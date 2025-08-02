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

// GET the count of unpaid bills for a specific patient
router.get("/count/:patient_id", async (req, res) => {
  const { patient_id } = req.params;
  try {
    const query = `
      SELECT COUNT(*) FROM "BILLING"
      WHERE patient_id = $1 AND status = 'unpaid';
    `;
    const { rows } = await pool.query(query, [patient_id]);
    res.json({ count: parseInt(rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching patient bill count:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST to mark all of a patient's bills as paid
router.post("/pay", async (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) {
    return res.status(400).json({ error: "Patient ID is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const unpaidBillsQuery = `SELECT description FROM "BILLING" WHERE patient_id = $1 AND status = 'unpaid'`;
    const { rows: unpaidBills } = await client.query(unpaidBillsQuery, [patient_id]);
    
    const membershipBill = unpaidBills.find(bill => bill.description.toLowerCase().includes("membership application fee"));

    if (membershipBill) {
        const newMembershipLevel = membershipBill.description.split(" ")[0];
        
        const patientStatusRes = await client.query('SELECT membership_status FROM "PATIENT" WHERE patient_id = $1', [patient_id]);
        const currentStatus = patientStatusRes.rows[0]?.membership_status;

        if (currentStatus === 'approved') {
            // This is an upgrade. Keep status 'approved' and set the pending level.
            const updateQuery = `UPDATE "PATIENT" SET pending_upgrade_level = $1 WHERE patient_id = $2`;
            await client.query(updateQuery, [newMembershipLevel, patient_id]);
        } else {
            // This is a new application. Set level and status to pending.
            const updateQuery = `UPDATE "PATIENT" SET membership_level = $1, membership_status = 'pending' WHERE patient_id = $2`;
            await client.query(updateQuery, [newMembershipLevel, patient_id]);
        }
    }

    const payBillsQuery = `UPDATE "BILLING" SET status = 'paid' WHERE patient_id = $1 AND status = 'unpaid'`;
    await client.query(payBillsQuery, [patient_id]);
    
    await client.query("COMMIT");
    res.status(200).json({ message: "All bills paid successfully!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error processing payment:", err.message);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});

// DELETE a pending membership application and its associated bill
router.delete("/membership-application", async (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) {
    return res.status(400).json({ error: "Patient ID is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const deleteBillQuery = `DELETE FROM "BILLING" WHERE patient_id = $1 AND status = 'unpaid' AND description ILIKE '%Membership Application Fee%' RETURNING bill_id;`;
    const deletedBill = await client.query(deleteBillQuery, [patient_id]);

    if (deletedBill.rowCount === 0) {
      throw new Error("No pending membership application found to cancel.");
    }

    const resetPatientQuery = `UPDATE "PATIENT" SET membership_level = NULL, membership_status = NULL, pending_upgrade_level = NULL WHERE patient_id = $1;`;
    await client.query(resetPatientQuery, [patient_id]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Membership application has been successfully cancelled." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error cancelling membership application:", err.message);
    res.status(500).json({ error: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

module.exports = router;
