const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST to create a new appointment
// Path: /api/appointments
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
      return res
        .status(409)
        .json({
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
// Path: /api/appointments/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM "APPOINTMENT" WHERE appointment_id = $1',
      [id]
    );
    res.json(
      rows.length ? rows[0] : res.status(404).send("Appointment not found")
    );
  } catch (err) {
    console.error("Error fetching appointment details:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a prescription for an appointment
// Path: /api/appointments/:id/prescription
router.get("/:id/prescription", async (req, res) => {
  const { id } = req.params;
  try {
    const presQuery = 'SELECT * FROM "PRESCRIPTION" WHERE appointment_id = $1';
    const presResult = await pool.query(presQuery, [id]);

    if (presResult.rows.length === 0) {
      return res
        .status(404)
        .send("No prescription found for this appointment.");
    }
    const prescription = presResult.rows[0];

    const medsQuery =
      'SELECT pm.*, m.name as medication_name FROM "PRESCRIPTION_MEDICATION" pm LEFT JOIN "MEDICATION" m ON pm.medication_id = m.medication_id WHERE pm.prescription_id = $1';
    const medsResult = await pool.query(medsQuery, [
      prescription.prescription_id,
    ]);

    const checkupsQuery = 'SELECT * FROM "CHECKUP" WHERE prescription_id = $1';
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
// Path: /api/appointments/:id/prescription
router.post("/:id/prescription", async (req, res) => {
  const { id } = req.params;
  const { instructions, medicines, checkups } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const presQuery =
      'INSERT INTO "PRESCRIPTION" (appointment_id, instructions) VALUES ($1, $2) RETURNING prescription_id';
    const presResult = await client.query(presQuery, [id, instructions]);
    const newPrescriptionId = presResult.rows[0].prescription_id;

    for (const med of medicines) {
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
        med.times_per_day * med.days,
      ]);
    }

    for (const checkup of checkups) {
      const checkupQuery =
        'INSERT INTO "CHECKUP" (prescription_id, description) VALUES ($1, $2)';
      await client.query(checkupQuery, [
        newPrescriptionId,
        checkup.description,
      ]);
    }

    await client.query(
      "UPDATE \"APPOINTMENT\" SET status = 'Done' WHERE appointment_id = $1",
      [id]
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
