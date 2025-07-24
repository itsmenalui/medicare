const express = require("express");
const router = express.Router();
const pool = require("../db");

// --- DOCTOR APPROVAL ROUTES ---

// GET all pending doctor applications
router.get("/pending-doctors", async (req, res) => {
  try {
    const query = `
      SELECT e.employee_id, e.first_name, e.last_name, e.email, e.contact_number, e.role,
             d.license_number, dept.name as department_name, dt.type_name as specialization
      FROM "EMPLOYEE" e
      JOIN "DOCTOR" d ON e.employee_id = d.employee_id
      JOIN "DEPARTMENT" dept ON d.department_id = dept.department_id
      JOIN "DOCTOR_TYPE" dt ON d.doctor_type_id = dt.doctor_type_id
      WHERE e.status = 'pending' AND e.role = 'Doctor'
      ORDER BY e.joining_date ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching pending doctors:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST to approve a doctor
router.post("/approve-doctor", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id) {
    return res.status(400).json({ error: "Employee ID is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const employeeRes = await client.query(
      `SELECT email, password_hash FROM "EMPLOYEE" WHERE employee_id = $1 AND status = 'pending'`,
      [employee_id]
    );

    if (employeeRes.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    if (!employeeRes.rows[0].password_hash)
      throw new Error("Password not set for this employee.");

    const { email, password_hash } = employeeRes.rows[0];
    await client.query(
      `UPDATE "EMPLOYEE" SET status = 'approved' WHERE employee_id = $1`,
      [employee_id]
    );
    const loginQuery = `INSERT INTO "LOGIN" (username, password_hash, user_type, employee_id) VALUES ($1, $2, 'EMPLOYEE', $3);`;
    await client.query(loginQuery, [email, password_hash, employee_id]);

    await client.query("COMMIT");
    res.status(200).json({ message: `Doctor ${email} approved successfully.` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error approving doctor:", err.message);
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

// POST to decline a doctor application
router.post("/decline-doctor", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id)
    return res.status(400).json({ error: "Employee ID is required." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM "DOCTOR" WHERE employee_id = $1`, [
      employee_id,
    ]);
    const deleteResult = await client.query(
      `DELETE FROM "EMPLOYEE" WHERE employee_id = $1`,
      [employee_id]
    );
    if (deleteResult.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Doctor application declined and removed." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error declining doctor:", err.message);
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

// --- NURSE APPROVAL ROUTES (NEW) ---

// GET all pending nurse applications
router.get("/pending-nurses", async (req, res) => {
  try {
    const query = `
      SELECT e.employee_id, e.first_name, e.last_name, e.email, e.contact_number, e.role,
             n.license_number, dept.name as department_name
      FROM "EMPLOYEE" e
      JOIN "NURSE" n ON e.employee_id = n.employee_id
      JOIN "DEPARTMENT" dept ON n.department_id = dept.department_id
      WHERE e.status = 'pending' AND e.role = 'Nurse'
      ORDER BY e.joining_date ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching pending nurses:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST to approve a nurse
router.post("/approve-nurse", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id)
    return res.status(400).json({ error: "Employee ID is required." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const employeeRes = await client.query(
      `SELECT email, password_hash FROM "EMPLOYEE" WHERE employee_id = $1 AND status = 'pending'`,
      [employee_id]
    );

    if (employeeRes.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    if (!employeeRes.rows[0].password_hash)
      throw new Error("Password not set for this employee.");

    const { email, password_hash } = employeeRes.rows[0];
    await client.query(
      `UPDATE "EMPLOYEE" SET status = 'approved' WHERE employee_id = $1`,
      [employee_id]
    );
    const loginQuery = `INSERT INTO "LOGIN" (username, password_hash, user_type, employee_id) VALUES ($1, $2, 'EMPLOYEE', $3);`;
    await client.query(loginQuery, [email, password_hash, employee_id]);

    await client.query("COMMIT");
    res.status(200).json({ message: `Nurse ${email} approved successfully.` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error approving nurse:", err.message);
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

// POST to decline a nurse application
router.post("/decline-nurse", async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id)
    return res.status(400).json({ error: "Employee ID is required." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM "NURSE" WHERE employee_id = $1`, [
      employee_id,
    ]);
    const deleteResult = await client.query(
      `DELETE FROM "EMPLOYEE" WHERE employee_id = $1`,
      [employee_id]
    );
    if (deleteResult.rowCount === 0)
      throw new Error("Employee not found or already handled.");
    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Nurse application declined and removed." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error declining nurse:", err.message);
    res.status(500).send({ message: err.message || "Server Error" });
  } finally {
    client.release();
  }
});

module.exports = router;
