const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all ambulances
router.get("/", async (req, res) => {
  try {
    // ✅ FIX: Reverted to SELECT * to match your database schema and prevent crashes.
    // This will correctly fetch all columns, including the new booking_fee.
    const query =
      'SELECT * FROM "AMBULANCE" ORDER BY status, estimated_arrival_mins;';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching ambulances:", err.message);
    res.status(500).send("Server error");
  }
});

// POST to book an ambulance
router.post("/book", async (req, res) => {
  const { ambulance_id, patient_id } = req.body;
  if (!ambulance_id || !patient_id) {
    return res
      .status(400)
      .json({ error: "Ambulance ID and Patient ID are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updateQuery = `UPDATE "AMBULANCE" SET status = 'Booked' WHERE ambulance_id = $1 AND status = 'Available' RETURNING *;`;
    const updatedAmbulance = await client.query(updateQuery, [ambulance_id]);

    if (updatedAmbulance.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ error: "This ambulance is no longer available." });
    }

    const insertRequestQuery = `INSERT INTO "AMBULANCE_REQUEST" (ambulance_id, patient_id, request_time, status) VALUES ($1, $2, NOW(), 'Dispatched');`;
    await client.query(insertRequestQuery, [ambulance_id, patient_id]);

    await client.query("COMMIT");
    res.status(200).json({
      message: "Ambulance booked successfully",
      ambulance: updatedAmbulance.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error booking ambulance:", err.message);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
});

module.exports = router;
