const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get all prescriptions for a specific patient
router.get("/for-patient/:patientId", async (req, res) => {
  const patient_id = parseInt(req.params.patientId);
  try {
    const query = `
      SELECT p.*, a.appointment_date, a.reason, d.doctor_id, 
             e.first_name as doctor_first_name, e.last_name as doctor_last_name
      FROM "PRESCRIPTION" p
      JOIN "APPOINTMENT" a ON p.appointment_id = a.appointment_id
      JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
      JOIN "EMPLOYEE" e ON d.employee_id = e.employee_id
      WHERE a.patient_id = $1
      ORDER BY p.prescription_date DESC;
    `;
    const { rows } = await pool.query(query, [patient_id]);

    const results = [];
    for (const pres of rows) {
      const medsQuery = `SELECT pm.*, m.name as medication_name FROM "PRESCRIPTION_MEDICATION" pm LEFT JOIN "MEDICATION" m ON pm.medication_id = m.medication_id WHERE pm.prescription_id = $1`;
      const medsResult = await pool.query(medsQuery, [pres.prescription_id]);

      const checkupsQuery =
        'SELECT * FROM "PRESCRIPTION_CHECKUP" WHERE prescription_id = $1';
      const checkupsResult = await pool.query(checkupsQuery, [
        pres.prescription_id,
      ]);

      results.push({
        ...pres,
        medicines: medsResult.rows,
        checkups: checkupsResult.rows,
      });
    }
    res.json(results);
  } catch (err) {
    console.error("Error fetching patient prescriptions:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
