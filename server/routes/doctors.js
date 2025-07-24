const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all doctors (handles search and filters for approved doctors)
router.get("/", async (req, res) => {
  const searchTerm = req.query.search || "";
  try {
    const query = `
      SELECT 
        d.doctor_id, d.license_number,
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

// GET a single doctor by ID
router.get("/:id", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID." });
  }

  try {
    const query = `
      SELECT
        d.doctor_id, d.license_number, e.first_name, e.last_name, e.email,
        dt.type_name AS specialization, dept.name as department_name
      FROM "DOCTOR" d
      JOIN "EMPLOYEE" e ON d.employee_id = e.employee_id
      JOIN "DOCTOR_TYPE" dt ON d.doctor_type_id = dt.doctor_type_id
      JOIN "DEPARTMENT" dept ON d.department_id = dept.department_id
      WHERE d.doctor_id = $1;
    `;
    const { rows } = await pool.query(query, [doctorId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching doctor ${doctorId}:`, err.message);
    res.status(500).send("Server error");
  }
});

// GET doctor's availability
router.get("/:id/availability", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID." });
  }
  try {
    const bookedSlotsResult = await pool.query(
      "SELECT (appointment_date AT TIME ZONE 'utc') as utc_appointment_date FROM \"APPOINTMENT\" WHERE doctor_id = $1 AND appointment_date >= NOW()",
      [doctorId]
    );
    const bookedISOs = new Set(
      bookedSlotsResult.rows.map((r) =>
        new Date(r.utc_appointment_date).toISOString()
      )
    );
    let allSlots = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const dayOfWeek = day.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotTime = new Date(day);
            slotTime.setHours(hour, minute, 0, 0);
            if (slotTime > now) {
              const slotISO = slotTime.toISOString();
              allSlots.push({
                time: slotISO,
                isBooked: bookedISOs.has(slotISO),
              });
            }
          }
        }
      }
    }
    res.json(allSlots);
  } catch (err) {
    console.error(
      `Error fetching availability for doctor ${doctorId}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

// GET a doctor's appointments
router.get("/:id/appointments", async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  // ✅ FIX: Get status from query. Default to 'Scheduled' for the main schedule page.
  const status = req.query.status || "Scheduled";

  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID." });
  }
  try {
    const query = `
      SELECT 
        a.appointment_id, a.appointment_date, a.status, a.reason, a.patient_id,
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        p.email as patient_email
      FROM "APPOINTMENT" a 
      JOIN "PATIENT" p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = $1 AND a.status = $2
      ORDER BY a.appointment_date DESC;
    `;
    const { rows } = await pool.query(query, [doctorId, status]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching doctor appointments:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
