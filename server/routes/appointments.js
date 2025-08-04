const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST to create a new appointment and generate a bill
router.post("/", async (req, res) => {
  const { doctor_id, appointment_date, reason, patient_id } = req.body;
  if (!doctor_id || !appointment_date || !patient_id || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ FIX: Perform two separate checks for appointment conflicts and doctor unavailability.

    // Check 1: See if the slot is already booked with an appointment.
    const checkAppointmentQuery =
      'SELECT appointment_id FROM "APPOINTMENT" WHERE doctor_id = $1 AND appointment_date = $2::timestamptz FOR UPDATE';
    const existingAppointment = await client.query(checkAppointmentQuery, [
      doctor_id,
      appointment_date,
    ]);

    if (existingAppointment.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This time slot has just been booked. Please select another.",
      });
    }

    // Check 2: See if the doctor has manually marked this slot as unavailable.
    const checkUnavailableQuery =
      'SELECT doctor_id FROM "DOCTOR_UNAVAILABILITY" WHERE doctor_id = $1 AND unavailable_time = $2::timestamptz';
    const unavailableSlot = await client.query(checkUnavailableQuery, [
      doctor_id,
      appointment_date,
    ]);

    if (unavailableSlot.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error:
          "The doctor is not available at this time. Please select another.",
      });
    }

    // If both checks pass, proceed to create the appointment.
    const doctorInfoQuery = `
      SELECT d.consultation_fee, e.first_name, e.last_name
      FROM "DOCTOR" d
      JOIN "EMPLOYEE" e ON d.employee_id = e.employee_id
      WHERE d.doctor_id = $1;
    `;
    const doctorInfoRes = await client.query(doctorInfoQuery, [doctor_id]);

    if (doctorInfoRes.rows.length === 0) {
      throw new Error("Doctor not found.");
    }
    const doctorInfo = doctorInfoRes.rows[0];
    const consultationFee = doctorInfo.consultation_fee;
    const doctorName = `Dr. ${doctorInfo.first_name} ${doctorInfo.last_name}`;

    const insertAppointmentQuery = `
      INSERT INTO "APPOINTMENT" (doctor_id, patient_id, appointment_date, status, reason)
      VALUES ($1, $2, $3, 'Scheduled', $4)
      RETURNING *;
    `;
    const { rows } = await client.query(insertAppointmentQuery, [
      doctor_id,
      patient_id,
      appointment_date,
      reason,
    ]);
    const newAppointment = rows[0];

    const billDescription = `Consultation Fee: ${doctorName}`;
    const insertBillingQuery = `
      INSERT INTO "BILLING" (patient_id, appointment_id, total_amount, description, status)
      VALUES ($1, $2, $3, $4, 'unpaid');
    `;
    await client.query(insertBillingQuery, [
      patient_id,
      newAppointment.appointment_id,
      consultationFee,
      billDescription,
    ]);

    await client.query("COMMIT");
    res.status(201).json(newAppointment);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating appointment and bill:", err.message);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
});

// GET a single appointment by ID
router.get("/:id", async (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);
  if (isNaN(appointmentId)) {
    return res.status(400).json({ error: "Invalid appointment ID." });
  }
  try {
    const query = `SELECT * FROM "APPOINTMENT" WHERE appointment_id = $1`;
    const { rows } = await pool.query(query, [appointmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching appointment:", err.message);
    res.status(500).send("Server Error");
  }
});

// GET a prescription by appointment ID
router.get("/:id/prescription", async (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);
  if (isNaN(appointmentId)) {
    return res.status(400).json({ error: "Invalid appointment ID." });
  }
  try {
    const prescriptionQuery = `SELECT * FROM "PRESCRIPTION" WHERE appointment_id = $1`;
    const presResult = await pool.query(prescriptionQuery, [appointmentId]);
    if (presResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No prescription found for this appointment." });
    }
    const prescription = presResult.rows[0];

    const medsQuery = `SELECT * FROM "PRESCRIPTION_MEDICATION" WHERE prescription_id = $1`;
    const medsResult = await pool.query(medsQuery, [
      prescription.prescription_id,
    ]);

    const checkupsQuery = `SELECT * FROM "PRESCRIPTION_CHECKUP" WHERE prescription_id = $1`;
    const checkupsResult = await pool.query(checkupsQuery, [
      prescription.prescription_id,
    ]);

    res.json({
      ...prescription,
      medicines: medsResult.rows,
      checkups: checkupsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching prescription details:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST a prescription for an appointment
router.post("/:id/prescription", async (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);
  const { instructions, medicines, checkups } = req.body;

  if (isNaN(appointmentId)) {
    return res.status(400).json({ error: "Invalid appointment ID." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const presResult = await client.query(
      'INSERT INTO "PRESCRIPTION" (appointment_id, instructions) VALUES ($1, $2) RETURNING prescription_id',
      [appointmentId, instructions]
    );
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
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});

module.exports = router;
``