const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET a patient's current membership status
router.get("/status/:patient_id", async (req, res) => {
  const { patient_id } = req.params;
  try {
    // ✅ FIX: Also select the pending_upgrade_level column
    const { rows } = await pool.query(
      'SELECT membership_level, membership_status, pending_upgrade_level FROM "PATIENT" WHERE patient_id = $1',
      [patient_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching membership status:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST to apply for a membership and generate a bill for the fee
router.post("/apply", async (req, res) => {
  const { patient_id, level, fee, description } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // This route only creates the bill. The patient's current membership status remains active.
    const billingQuery = `
      INSERT INTO "BILLING" (patient_id, total_amount, description, status)
      VALUES ($1, $2, $3, 'unpaid')
    `;
    await client.query(billingQuery, [patient_id, fee, description]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Application submitted successfully! Please pay the membership fee to be considered for approval." });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error applying for membership:", err.message);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});

module.exports = router;