const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET chat contacts
// Path: /api/chat/contacts
router.get("/contacts", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"];

  if (!userId || !userRole) {
    return res
      .status(400)
      .json({ error: "User ID and Role are required headers." });
  }

  try {
    let query;
    if (userRole === "PATIENT") {
      query = `
        SELECT DISTINCT l.login_id, e.first_name, e.last_name, e.role
        FROM "EMPLOYEE" e
        JOIN "LOGIN" l ON e.employee_id = l.employee_id
        JOIN "DOCTOR" d ON e.employee_id = d.employee_id
        JOIN "APPOINTMENT" a ON d.doctor_id = a.doctor_id
        WHERE a.patient_id = (SELECT patient_id FROM "LOGIN" WHERE login_id = $1);
      `;
    } else if (userRole === "EMPLOYEE") {
      query = `
        SELECT DISTINCT l.login_id, p.first_name, p.last_name, 'Patient' as role
        FROM "PATIENT" p
        JOIN "LOGIN" l ON p.patient_id = l.patient_id
        JOIN "APPOINTMENT" a ON p.patient_id = a.patient_id
        JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
        WHERE d.employee_id = (SELECT employee_id FROM "LOGIN" WHERE login_id = $1);
      `;
    } else {
      return res.status(400).json({ error: "Invalid user role specified." });
    }

    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching chat contacts:", err.message);
    res.status(500).send("Server error");
  }
});

// GET chat messages between two users
// Path: /api/chat/messages/:user1_id/:user2_id
router.get("/messages/:user1_id/:user2_id", async (req, res) => {
  const { user1_id, user2_id } = req.params;
  try {
    const query = `
      SELECT * FROM "MESSAGE"
      WHERE (sender_id = $1 AND recipient_id = $2)
         OR (sender_id = $2 AND recipient_id = $1)
      ORDER BY sent_at ASC;
    `;
    const { rows } = await pool.query(query, [user1_id, user2_id]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
