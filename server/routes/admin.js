const express = require("express");
const router = express.Router();
const pool = require("../db");

// --- ROOM MANAGEMENT ---
//test
// GET all room booking requests
router.get("/rooms/bookings", async (req, res) => {
  try {
    // ✅ FIX: Rewrote the query using LEFT JOINs to be more robust.
    // This prevents the entire query from failing if a single piece of related data is missing.
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

// POST to approve a room booking
router.post("/rooms/approve", async (req, res) => {
  const { booking_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const bookingRes = await client.query(
      "SELECT room_id FROM \"ROOM_BOOKING\" WHERE booking_id = $1 AND booking_status = 'pending'",
      [booking_id]
    );
    if (bookingRes.rows.length === 0)
      throw new Error("Booking not found or already handled.");
    const { room_id } = bookingRes.rows[0];

    await client.query(
      'UPDATE "ROOM" SET availability = false WHERE room_id = $1',
      [room_id]
    );
    await client.query(
      `UPDATE "ROOM_BOOKING" SET booking_status = 'confirmed' WHERE booking_id = $1`,
      [booking_id]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Booking approved successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error approving booking:", err.message);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
});

// POST to decline a room booking
router.post("/rooms/decline", async (req, res) => {
  const { booking_id } = req.body;
  try {
    await pool.query(
      "DELETE FROM \"ROOM_BOOKING\" WHERE booking_id = $1 AND booking_status = 'pending'",
      [booking_id]
    );
    res.status(200).json({ message: "Booking declined and removed." });
  } catch (err) {
    console.error("Error declining booking:", err.message);
    res.status(500).send("Server error");
  }
});

// --- AMBULANCE, DOCTOR, & NURSE MANAGEMENT (Your existing code) ---

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

module.exports = router;
