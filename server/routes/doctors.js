const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all approved doctors with search
router.get("/", async (req, res) => {
  const searchTerm = req.query.search || "";
  try {
    const query = `
      SELECT
        d.doctor_id,
        e.first_name, e.last_name,
        dt.type_name AS specialization,
        dept.name as department_name
      FROM "DOCTOR" d
      JOIN "EMPLOYEE" e ON d.employee_id = e.employee_id
      JOIN "DOCTOR_TYPE" dt ON d.doctor_type_id = dt.doctor_type_id
      JOIN "DEPARTMENT" dept ON d.department_id = dept.department_id
      WHERE
        e.status = 'approved' AND
        (e.first_name ILIKE $1 OR
        e.last_name ILIKE $1 OR
        dt.type_name ILIKE $1 OR
        dept.name ILIKE $1)
      ORDER BY dept.name, e.first_name;
    `;
    const { rows } = await pool.query(query, [`%${searchTerm}%`]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching all doctors:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a single doctor's full details, including qualifications
router.get("/:id", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID." });
  }
  try {
    const query = `
      SELECT
        d.doctor_id, d.license_number, d.consultation_fee,
        e.first_name, e.last_name, e.email,
        dt.type_name AS specialization,
        dept.name as department_name,
        (SELECT array_agg(q.name || ', ' || q.institution)
         FROM "DOCTOR_QUALIFICATION_MAP" dqm
         JOIN "QUALIFICATION" q ON dqm.qualification_id = q.qualification_id
         WHERE dqm.doctor_id = d.doctor_id) as qualifications
      FROM "DOCTOR" d
      JOIN "EMPLOYEE" e ON d.employee_id = e.employee_id
      JOIN "DOCTOR_TYPE" dt ON d.doctor_type_id = dt.doctor_type_id
      JOIN "DEPARTMENT" dept ON d.department_id = dept.department_id
      WHERE d.doctor_id = $1 AND e.status = 'approved';
    `;
    const { rows } = await pool.query(query, [doctorId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Doctor not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching doctor ${doctorId}:`, err.message);
    res.status(500).send("Server error");
  }
});

// GET a doctor's availability
router.get("/:id/availability", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID." });
  }
  try {
    const query = `
      WITH potential_slots AS (
        SELECT slot::timestamptz
        FROM generate_series(
          date_trunc('day', now() AT TIME ZONE 'utc'),
          date_trunc('day', now() AT TIME ZONE 'utc') + interval '14 days',
          '30 minutes'
        ) as slot
        WHERE
          EXTRACT(ISODOW FROM slot) BETWEEN 1 AND 5 -- Monday to Friday
          AND (slot::time >= '09:00' AND slot::time < '17:00') -- Working hours in UTC
      )
      SELECT
        p.slot as "time",
        COALESCE(a.is_booked, d.is_booked, false) as "is_booked",
        CASE
          WHEN a.is_booked THEN 'appointment'
          WHEN d.is_booked THEN 'unavailable'
          ELSE 'available'
        END as "status",
        a.appointment_id
      FROM potential_slots p
      LEFT JOIN (
        SELECT
          appointment_date,
          appointment_id,
          true as is_booked
        FROM "APPOINTMENT"
        WHERE doctor_id = $1 AND status = 'Scheduled'
      ) a ON p.slot = a.appointment_date
      LEFT JOIN (
        SELECT
          unavailable_time,
          true as is_booked
        FROM "DOCTOR_UNAVAILABILITY"
        WHERE doctor_id = $1
      ) d ON p.slot = d.unavailable_time
      WHERE p.slot > now()
      ORDER BY p.slot;
    `;
    const { rows } = await pool.query(query, [doctorId]);
    res.json(rows);
  } catch (err) {
    console.error(
      `Error fetching availability for doctor ${doctorId}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

// ✅ FIX: This route is now more robust against timestamp format issues.
// POST to mark a time slot as unavailable
router.post("/:id/availability/unavailable", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  const { time_slot } = req.body;

  if (isNaN(doctorId) || !time_slot) {
    return res
      .status(400)
      .json({ error: "Invalid doctor ID or time slot provided." });
  }

  try {
    // Explicitly cast the incoming time_slot to timestamptz to ensure format consistency.
    const query = `INSERT INTO "DOCTOR_UNAVAILABILITY" (doctor_id, unavailable_time) VALUES ($1, $2::timestamptz)`;
    await pool.query(query, [doctorId, time_slot]);
    res
      .status(200)
      .json({ message: "Slot successfully marked as unavailable." });
  } catch (err) {
    if (err.code === "23505") {
      // Handles unique constraint violation
      return res.status(200).json({ message: "Slot was already unavailable." });
    }
    console.error(
      `Error marking slot unavailable for doctor ${doctorId}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

// ✨ NEW: Temporary route to check the database for unavailable slots.
router.get("/:id/check-unavailability", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID." });
  }
  try {
    const { rows } = await pool.query(
      'SELECT unavailable_time FROM "DOCTOR_UNAVAILABILITY" WHERE doctor_id = $1 ORDER BY unavailable_time DESC',
      [doctorId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error checking unavailability:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a doctor's appointments
router.get("/:id/appointments", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID." });
  }
  try {
    const query = `
      SELECT
        a.appointment_id,
        a.appointment_date,
        a.status,
        a.reason,
        p.patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email
      FROM "APPOINTMENT" a
      JOIN "PATIENT" p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date ASC;
    `;
    const { rows } = await pool.query(query, [doctorId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching appointments:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
