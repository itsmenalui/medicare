const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all doctors (handles search)
// Path: /api/doctors
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
        e.first_name ILIKE $1 OR
        e.last_name ILIKE $1 OR
        dt.type_name ILIKE $1 OR
        dept.name ILIKE $1
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
// Path: /api/doctors/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
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
    const { rows } = await pool.query(query, [id]);
    res.json(rows.length ? rows[0] : res.status(404).send("Doctor not found"));
  } catch (err) {
    console.error(`Error fetching doctor ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

// GET doctor's availability
// Path: /api/doctors/:id/availability
router.get("/:id/availability", async (req, res) => {
  const { id } = req.params;
  try {
    const bookedSlotsResult = await pool.query(
      "SELECT (appointment_date AT TIME ZONE 'utc') as utc_appointment_date FROM \"APPOINTMENT\" WHERE doctor_id = $1 AND appointment_date >= NOW()",
      [id]
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
    console.error(`Error fetching availability for doctor ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

// GET a doctor's appointments
// Path: /api/doctors/:id/appointments
router.get("/:id/appointments", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        a.appointment_id, a.appointment_date, a.status, a.reason,
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        p.email as patient_email
      FROM "APPOINTMENT" a 
      JOIN "PATIENT" p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = $1 
      ORDER BY a.appointment_date DESC;
    `;
    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching doctor appointments:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
