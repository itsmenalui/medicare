const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST to create a new appointment
router.post("/", async (req, res) => {
  const { doctor_id, appointment_date, reason, patient_id } = req.body;
  if (!doctor_id || !appointment_date || !patient_id || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const checkQuery =
      'SELECT * FROM "APPOINTMENT" WHERE doctor_id = $1 AND appointment_date = $2 FOR UPDATE';
    const existingAppointment = await client.query(checkQuery, [
      doctor_id,
      appointment_date,
    ]);

    if (existingAppointment.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This time slot has just been booked. Please select another.",
      });
    }

    const insertQuery = `INSERT INTO "APPOINTMENT" (doctor_id, patient_id, appointment_date, status, reason) VALUES ($1, $2, $3, 'Scheduled', $4) RETURNING *;`;
    const { rows } = await client.query(insertQuery, [
      doctor_id,
      patient_id,
      appointment_date,
      reason,
    ]);

    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error booking appointment:", err.message);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
});

// GET specific appointment details
router.get("/:id", async (req, res) => {
  // --- DIAGNOSTIC LOGGING ADDED ---
  console.log(`--- Handling GET /api/appointments/:id ---`);
  console.log(`Received id from URL params: '${req.params.id}'`);

  const appointmentId = parseInt(req.params.id, 10);
  console.log(`Parsed integer ID: ${appointmentId}`);

  if (isNaN(appointmentId)) {
    console.log(`ID is not a number. Sending 400 error.`);
    return res.status(400).json({ error: "Invalid appointment ID." });
  }

  try {
    const queryText = 'SELECT * FROM "APPOINTMENT" WHERE appointment_id = $1';
    console.log(`Executing query: ${queryText} with ID: ${appointmentId}`);

    const { rows } = await pool.query(queryText, [appointmentId]);

    console.log(`Database query returned ${rows.length} row(s).`);

    if (rows.length === 0) {
      console.log(`No appointment found. Sending 404 error.`);
      return res.status(404).json({ error: "Appointment not found" });
    }

    console.log(`Appointment found. Sending data.`);
    res.json(rows[0]);
  } catch (err) {
    console.error("--- ERROR in GET /api/appointments/:id ---");
    console.error(err.stack); // Log the full error stack
    res.status(500).send("Server error");
  }
});

// --- MERGED PRESCRIPTION ROUTES ---

// GET a prescription for an appointment
router.get("/:id/prescription", async (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);
  if (isNaN(appointmentId)) {
    return res.status(400).json({ error: "Invalid appointment ID." });
  }

  try {
    const presQuery = 'SELECT * FROM "PRESCRIPTION" WHERE appointment_id = $1';
    const presResult = await pool.query(presQuery, [appointmentId]);

    if (presResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No prescription found for this appointment." });
    }
    const prescription = presResult.rows[0];

    const medsQuery =
      'SELECT pm.*, m.name as medication_name FROM "PRESCRIPTION_MEDICATION" pm LEFT JOIN "MEDICATION" m ON pm.medication_id = m.medication_id WHERE pm.prescription_id = $1';
    const medsResult = await pool.query(medsQuery, [
      prescription.prescription_id,
    ]);

    const checkupsQuery =
      'SELECT * FROM "PRESCRIPTION_CHECKUP" WHERE prescription_id = $1';
    const checkupsResult = await pool.query(checkupsQuery, [
      prescription.prescription_id,
    ]);

    res.json({
      ...prescription,
      medicines: medsResult.rows,
      checkups: checkupsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching prescription:", err.message);
    res.status(500).send("Server error");
  }
});

// POST a prescription for an appointment
router.post("/:id/prescription", async (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);
  if (isNaN(appointmentId)) {
    return res.status(400).json({ error: "Invalid appointment ID." });
  }

  const { instructions, medicines, checkups } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const presQuery =
      'INSERT INTO "PRESCRIPTION" (appointment_id, instructions) VALUES ($1, $2) RETURNING prescription_id';
    const presResult = await client.query(presQuery, [
      appointmentId,
      instructions,
    ]);
    const newPrescriptionId = presResult.rows[0].prescription_id;

    for (const med of medicines) {
      const quantity = Number(med.times_per_day) * Number(med.days) || 0;
      const medQuery =
        'INSERT INTO "PRESCRIPTION_MEDICATION" (prescription_id, medication_id, custom_name, type, dosage, times_per_day, days, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
      await client.query(medQuery, [
        newPrescriptionId,
        med.medication_id || null,
        med.custom_name,
        med.type,
        med.dosage,
        med.times_per_day,
        med.days,
        quantity,
      ]);
    }

    if (checkups && checkups.length > 0) {
      for (const checkup of checkups) {
        if (checkup.description) {
          // Ensure description is not empty
          const checkupQuery =
            'INSERT INTO "PRESCRIPTION_CHECKUP" (prescription_id, description) VALUES ($1, $2)';
          await client.query(checkupQuery, [
            newPrescriptionId,
            checkup.description,
          ]);
        }
      }
    }

    await client.query(
      "UPDATE \"APPOINTMENT\" SET status = 'Done' WHERE appointment_id = $1",
      [appointmentId]
    );
    await client.query("COMMIT");
    res.status(201).json({ message: "Prescription created successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating prescription:", err.message);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
});

module.exports = router;
