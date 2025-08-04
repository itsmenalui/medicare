const express = require("express");
const router = express.Router();
const pool = require("../db");

// --- ROOM MANAGEMENT ---

// GET all room booking requests
router.get("/rooms/bookings", async (req, res) => {
  try {
    const query = `
            SELECT 
                rb.booking_id, rb.check_in_date, rb.booking_status,
                r.room_number, 
                rt.type_name,
                p.first_name, p.last_name
            FROM "ROOM_BOOKING" rb
            LEFT JOIN "ROOM" r ON rb.room_id = r.room_id
            LEFT JOIN "ROOM_TYPE" rt ON r.room_type_id = rt.room_type_id
            LEFT JOIN "PATIENT" p ON rb.patient_id = p.patient_id
            ORDER BY rb.booking_status ASC, rb.check_in_date DESC;
        `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching room bookings for admin:", err.message);
    res.status(500).send("Server error");
  }
});

// POST to approve a room booking AND add the fee to billing
router.post("/rooms/approve", async (req, res) => {
  const { booking_id } = req.body;
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query("BEGIN");

    // Step 1: Get booking details (patient_id, room_id) and lock the row to prevent race conditions
    const bookingRes = await client.query(
      `SELECT room_id, patient_id FROM "ROOM_BOOKING" WHERE booking_id = $1 AND booking_status = 'pending' FOR UPDATE`,
      [booking_id]
    );

    if (bookingRes.rows.length === 0) {
      throw new Error("Booking not found or has already been processed.");
    }
    const { room_id, patient_id } = bookingRes.rows[0];

    // Step 2: Get room details (cost_per_day, room_number) for the bill
    const roomRes = await client.query(
      `SELECT cost_per_day, room_number FROM "ROOM" WHERE room_id = $1`,
      [room_id]
    );

    if (roomRes.rows.length === 0) {
      throw new Error("Associated room could not be found.");
    }
    const { cost_per_day, room_number } = roomRes.rows[0];

    // Step 3: Update the room's availability to false
    await client.query(
      'UPDATE "ROOM" SET availability = false WHERE room_id = $1',
      [room_id]
    );

    // Step 4: Update the booking status to 'confirmed'
    await client.query(
      `UPDATE "ROOM_BOOKING" SET booking_status = 'confirmed' WHERE booking_id = $1`,
      [booking_id]
    );

    // ✨ --- START: NEW BILLING LOGIC --- ✨
    // Step 5: Create a new entry in the BILLING table for the room fee.
    // This effectively adds the room cost to the patient's "cart".
    const billDescription = `Room Booking Fee: Room ${room_number}`;
    const billingQuery = `
      INSERT INTO "BILLING" (patient_id, total_amount, description, status)
      VALUES ($1, $2, $3, 'unpaid')
    `;
    await client.query(billingQuery, [
      patient_id,
      cost_per_day,
      billDescription,
    ]);
    // ✨ --- END: NEW BILLING LOGIC --- ✨

    // If all steps succeed, commit the transaction
    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Booking approved and bill generated successfully." });
  } catch (err) {
    // If any step fails, roll back the entire transaction
    await client.query("ROLLBACK");
    console.error("Error during booking approval transaction:", err.message);
    res
      .status(500)
      .json({ error: err.message || "Server error during booking approval." });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

// POST to decline a room booking
router.post("/rooms/decline", async (req, res) => {
  const { booking_id } = req.body;
  try {
    const result = await pool.query(
      "DELETE FROM \"ROOM_BOOKING\" WHERE booking_id = $1 AND booking_status = 'pending'",
      [booking_id]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or already handled." });
    }
    res.status(200).json({ message: "Booking declined and removed." });
  } catch (err) {
    console.error("Error declining booking:", err.message);
    res.status(500).send("Server error");
  }
});

// --- AMBULANCE, DOCTOR, & NURSE MANAGEMENT (Your existing code) ---
// (The rest of your admin.js file remains unchanged)

// GET all ambulance details for the admin dashboard
router.get("/ambulances/details", async (req, res) => {
  try {
    const query = `
      SELECT
        a.ambulance_id,
        a.contact_number,
        a.status,
        a.booking_fee,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name
      FROM 
        "AMBULANCE" a
      LEFT JOIN 
        "AMBULANCE_REQUEST" ar ON a.ambulance_id = ar.ambulance_id AND a.status = 'Booked'
      LEFT JOIN 
        "PATIENT" p ON ar.patient_id = p.patient_id
      ORDER BY 
        a.status, a.ambulance_id;
    `;
    const { rows } = await pool.query(query);
    const finalRows = rows.map((row) => {
      const { patient_first_name, patient_last_name, ...rest } = row;
      const booked_by_patient =
        patient_first_name && patient_last_name
          ? `${patient_first_name} ${patient_last_name}`
          : null;
      return { ...rest, booked_by_patient };
    });
    res.json(finalRows);
  } catch (err) {
    console.error("Error fetching ambulance details for admin:", err.message);
    res.status(500).send("Server error");
  }
});

// GET all pending doctor applications
router.get("/pending-doctors", async (req, res) => {
  try {
    const query = `
      SELECT e.employee_id, e.first_name, e.last_name, e.email, e.contact_number, e.role,
             d.license_number, dept.name as department_name, dt.type_name as specialization
      FROM "EMPLOYEE" e
      JOIN "DOCTOR" d ON e.employee_id = d.employee_id
      JOIN "DEPARTMENT" dept ON d.department_id = dept.department_id
      JOIN "DOCTOR_TYPE" dt ON d.doctor_type_id = dt.doctor_type_id
      WHERE e.status = 'pending' AND e.role = 'Doctor'
      ORDER BY e.joining_date ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching pending doctors:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST to approve a doctor
router.post("/approve-doctor", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id) {
    return res.status(400).json({ error: "Employee ID is required." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const employeeRes = await client.query(
      `SELECT email, password_hash FROM "EMPLOYEE" WHERE employee_id = $1 AND status = 'pending'`,
      [employee_id]
    );
    if (employeeRes.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    const { email, password_hash } = employeeRes.rows[0];
    await client.query(
      `UPDATE "EMPLOYEE" SET status = 'approved' WHERE employee_id = $1`,
      [employee_id]
    );
    await client.query(
      `INSERT INTO "LOGIN" (username, password_hash, user_type, employee_id) VALUES ($1, $2, 'EMPLOYEE', $3);`,
      [email, password_hash, employee_id]
    );
    await client.query("COMMIT");
    res.status(200).json({ message: `Doctor ${email} approved successfully.` });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

// POST to decline a doctor application
router.post("/decline-doctor", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id)
    return res.status(400).json({ error: "Employee ID is required." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM "DOCTOR" WHERE employee_id = $1`, [
      employee_id,
    ]);
    const deleteResult = await client.query(
      `DELETE FROM "EMPLOYEE" WHERE employee_id = $1`,
      [employee_id]
    );
    if (deleteResult.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Doctor application declined and removed." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error declining doctor:", err.message);
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

// GET all pending nurse applications
router.get("/pending-nurses", async (req, res) => {
  try {
    const query = `
      SELECT e.employee_id, e.first_name, e.last_name, e.email, e.contact_number, e.role,
             n.license_number, dept.name as department_name
      FROM "EMPLOYEE" e
      JOIN "NURSE" n ON e.employee_id = n.employee_id
      JOIN "DEPARTMENT" dept ON n.department_id = dept.department_id
      WHERE e.status = 'pending' AND e.role = 'Nurse'
      ORDER BY e.joining_date ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching pending nurses:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST to approve a nurse
router.post("/approve-nurse", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id)
    return res.status(400).json({ error: "Employee ID is required." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const employeeRes = await client.query(
      `SELECT email, password_hash FROM "EMPLOYEE" WHERE employee_id = $1 AND status = 'pending'`,
      [employee_id]
    );
    if (employeeRes.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    const { email, password_hash } = employeeRes.rows[0];
    await client.query(
      `UPDATE "EMPLOYEE" SET status = 'approved' WHERE employee_id = $1`,
      [employee_id]
    );
    await client.query(
      `INSERT INTO "LOGIN" (username, password_hash, user_type, employee_id) VALUES ($1, $2, 'EMPLOYEE', $3);`,
      [email, password_hash, employee_id]
    );
    await client.query("COMMIT");
    res.status(200).json({ message: `Nurse ${email} approved successfully.` });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

// POST to decline a nurse application
router.post("/decline-nurse", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id)
    return res.status(400).json({ error: "Employee ID is required." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM "NURSE" WHERE employee_id = $1`, [
      employee_id,
    ]);
    const deleteResult = await client.query(
      `DELETE FROM "EMPLOYEE" WHERE employee_id = $1`,
      [employee_id]
    );
    if (deleteResult.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Nurse application declined and removed." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error declining nurse:", err.message);
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

router.get("/membership-applications", async (req, res) => {
  try {
    // ✅ FIX: This query now correctly finds both new applications AND upgrades.
    const query = `
      SELECT 
        patient_id, 
        first_name, 
        last_name, 
        email, 
        membership_level as current_level,
        pending_upgrade_level
      FROM "PATIENT"
      WHERE 
        membership_status = 'pending' OR pending_upgrade_level IS NOT NULL;
    `;
    const { rows } = await pool.query(query);

    // This logic determines what the "requested" level is for the admin's view.
    const applications = rows.map(row => ({
      ...row,
      requested_level: row.pending_upgrade_level || row.current_level
    }));

    res.json(applications);
  } catch (err) {
    console.error("Error fetching membership applications:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST to approve a membership application
router.post("/approve-membership", async (req, res) => {
  const { patient_id, new_level } = req.body;
  try {
    // ✅ FIX: This query now correctly finalizes an upgrade by clearing the pending_upgrade_level.
    const result = await pool.query(
      `UPDATE "PATIENT" 
       SET membership_level = $1, 
           membership_status = 'approved',
           pending_upgrade_level = NULL
       WHERE patient_id = $2`,
      [new_level, patient_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Application not found or already handled." });
    }
    res.status(200).json({ message: "Membership approved successfully." });
  } catch (err) {
    console.error("Error approving membership:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
