const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all unpaid bills for a specific patient
router.get("/:patient_id", async (req, res) => {
  const { patient_id } = req.params;
  try {
    const query = `
      SELECT bill_id, total_amount, description, status, bill_date
      FROM "BILLING"
      WHERE patient_id = $1 AND status = 'unpaid'
      ORDER BY bill_date DESC;
    `;
    const { rows } = await pool.query(query, [patient_id]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching patient bills:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✨ --- NEW ENDPOINT START --- ✨
// GET the count of unpaid bills for a specific patient
router.get("/count/:patient_id", async (req, res) => {
  const { patient_id } = req.params;
  try {
    const query = `
      SELECT COUNT(*) FROM "BILLING"
      WHERE patient_id = $1 AND status = 'unpaid';
    `;
    const { rows } = await pool.query(query, [patient_id]);
    // The result from COUNT(*) is in rows[0].count
    res.json({ count: parseInt(rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching patient bill count:", err.message);
    res.status(500).send("Server Error");
  }
});
// ✨ --- NEW ENDPOINT END --- ✨

// POST to mark all of a patient's bills as paid
router.post("/pay", async (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) {
    return res.status(400).json({ error: "Patient ID is required." });
  }

  try {
    const query = `
      UPDATE "BILLING"
      SET status = 'paid'
      WHERE patient_id = $1 AND status = 'unpaid';
    `;
    await pool.query(query, [patient_id]);
    res.status(200).json({ message: "All bills paid successfully!" });
  } catch (err) {
    console.error("Error processing payment:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
