const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET patient details by ID
// Path: /api/patient/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM "PATIENT" WHERE patient_id = $1',
      [id]
    );
    res.json(rows.length ? rows[0] : res.status(404).send("Patient not found"));
  } catch (err) {
    console.error("Error fetching patient details:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a patient's appointments
// Path: /api/patient/:id/appointments
router.get("/:id/appointments", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
        SELECT a.appointment_id, a.appointment_date, a.status, a.reason, 
        e.first_name as doc_first_name, e.last_name as doc_last_name, 
        dt.type_name as specialization 
        FROM "APPOINTMENT" a 
        JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id 
        JOIN "EMPLOYEE" e ON d.employee_id = e.employee_id 
        JOIN "DOCTOR_TYPE" dt ON d.doctor_type_id = dt.doctor_type_id 
        WHERE a.patient_id = $1 ORDER BY a.appointment_date DESC;
    `;
    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching patient appointments:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a patient's room bookings
// Path: /api/patient/:id/bookings
router.get("/:id/bookings", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        rb.booking_id, rb.check_in_date, rb.booking_status,
        r.room_number, rt.type_name, rt.description, r.cost_per_day
      FROM "ROOM_BOOKING" rb
      JOIN "ROOM" r ON rb.room_id = r.room_id
      JOIN "ROOM_TYPE" rt ON r.room_type_id = rt.room_type_id
      WHERE rb.patient_id = $1
      ORDER BY rb.check_in_date DESC;
    `;
    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching patient room bookings:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
