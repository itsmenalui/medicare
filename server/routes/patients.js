const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET patient details by ID
router.get("/:id", async (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  if (isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID." });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM "PATIENT" WHERE patient_id = $1',
      [patientId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching patient details:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a patient's appointments
router.get("/:id/appointments", async (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  if (isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID." });
  }
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
    const { rows } = await pool.query(query, [patientId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching patient appointments:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a patient's room bookings
router.get("/:id/bookings", async (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  if (isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID." });
  }
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
    const { rows } = await pool.query(query, [patientId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching patient room bookings:", err.message);
    res.status(500).send("Server error");
  }
});

// GET all completed test reports for a specific patient
router.get("/:id/reports", async (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  if (isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID." });
  }
  try {
    const query = `
            SELECT 
                o.order_id, o.order_date, o.result_pdf_name,
                t.name as test_name
            FROM "TEST_ORDER" o
            JOIN "TEST" t ON o.test_id = t.test_id
            WHERE o.patient_id = $1 AND o.status = 'Completed'
            ORDER BY o.order_date DESC;
        `;
    const { rows } = await pool.query(query, [patientId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching test reports for patient:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a specific test report PDF to download
router.get("/reports/:orderId/download", async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid order ID." });
  }
  try {
    const query =
      'SELECT result_pdf_data, result_pdf_name FROM "TEST_ORDER" WHERE order_id = $1';
    const { rows } = await pool.query(query, [orderId]);

    if (rows.length === 0 || !rows[0].result_pdf_data) {
      return res.status(404).send("Report not found.");
    }

    const { result_pdf_data, result_pdf_name } = rows[0];

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${result_pdf_name || "report.pdf"}"`
    );
    res.send(result_pdf_data);
  } catch (err) {
    console.error("Error downloading test report:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
