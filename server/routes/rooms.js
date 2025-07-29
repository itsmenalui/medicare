const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all rooms for the public view
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        r.room_id, r.room_number, r.availability, r.cost_per_day,
        rt.type_name, rt.description, rt.capacity
      FROM "ROOM" r
      JOIN "ROOM_TYPE" rt ON r.room_type_id = rt.room_type_id
      ORDER BY r.room_number;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching rooms:", err.message);
    res.status(500).send("Server error");
  }
});

// POST to REQUEST a room booking
router.post("/book", async (req, res) => {
  const { room_id, patient_id, check_in_date } = req.body;
  if (!room_id || !patient_id || !check_in_date) {
    return res
      .status(400)
      .json({ error: "Room ID, patient ID, and check-in date are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const roomCheckQuery =
      'SELECT availability FROM "ROOM" WHERE room_id = $1 FOR UPDATE';
    const roomResult = await client.query(roomCheckQuery, [room_id]);

    if (roomResult.rows.length === 0) throw new Error("Room not found.");
    if (!roomResult.rows[0].availability) {
      return res.status(409).json({
        error: "This room is no longer available. Please select another.",
      });
    }

    const insertBookingQuery = `INSERT INTO "ROOM_BOOKING" (room_id, patient_id, check_in_date, booking_status) VALUES ($1, $2, $3, 'pending') RETURNING *;`;
    const bookingResult = await client.query(insertBookingQuery, [
      room_id,
      patient_id,
      check_in_date,
    ]);

    await client.query("COMMIT");
    res.status(201).json({
      message:
        "Your booking request has been sent successfully! You will be notified upon confirmation.",
      booking: bookingResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error requesting room booking:", err.message);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
});

module.exports = router;
