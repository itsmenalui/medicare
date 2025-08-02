const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all ambulances
router.get("/", async (req, res) => {
  try {
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

    // Step 1: Update ambulance status and get its details
    const updateQuery = `
      UPDATE "AMBULANCE" 
      SET status = 'Booked' 
      WHERE ambulance_id = $1 AND status = 'Available' 
      RETURNING *;
    `;
    const updatedAmbulance = await client.query(updateQuery, [ambulance_id]);

    if (updatedAmbulance.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ error: "This ambulance is no longer available." });
    }
    
    const { booking_fee } = updatedAmbulance.rows[0];

    // Step 2: Create the booking request
    const insertRequestQuery = `
      INSERT INTO "AMBULANCE_REQUEST" (ambulance_id, patient_id, request_time, status) 
      VALUES ($1, $2, NOW(), 'Dispatched');
    `;
    await client.query(insertRequestQuery, [ambulance_id, patient_id]);

    // ✅ FIX: Step 3: Create a corresponding bill for the booking fee
    const billDescription = `Ambulance Booking Fee (ID: ${ambulance_id})`;
    const billingQuery = `
      INSERT INTO "BILLING" (patient_id, total_amount, description, status)
      VALUES ($1, $2, $3, 'unpaid')
    `;
    await client.query(billingQuery, [patient_id, booking_fee, billDescription]);

    await client.query("COMMIT");
    res.status(200).json({
      message: "Ambulance booked successfully and fee added to your bill.",
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