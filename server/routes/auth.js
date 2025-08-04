const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");

// --- PATIENT AUTHENTICATION ---
router.post("/signup", async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    dob,
    gender,
    contact_number,
    address,
    blood_type,
    emergency_contact,
  } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const patientQuery = `INSERT INTO "PATIENT" (first_name, last_name, email, date_of_birth, gender, contact_number, address, blood_type, emergency_contact) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING patient_id;`;
    const patientResult = await client.query(patientQuery, [
      first_name,
      last_name,
      email,
      dob,
      gender,
      contact_number,
      address,
      blood_type,
      emergency_contact,
    ]);
    const newPatientId = patientResult.rows[0].patient_id;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const loginQuery = `INSERT INTO "LOGIN" (username, password_hash, user_type, patient_id) VALUES ($1, $2, 'PATIENT', $3);`;
    await client.query(loginQuery, [email, password_hash, newPatientId]);
    await client.query("COMMIT");
    res.status(201).json({ message: "Signup successful! Please log in." });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "A user with this email already exists." });
    }
    console.error("Server error during patient signup:", err);
    res.status(500).send("Server error during signup.");
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userQuery = 'SELECT * FROM "LOGIN" WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    if (user.user_type === "PATIENT" && user.patient_id) {
      const patientQuery = 'SELECT * FROM "PATIENT" WHERE patient_id = $1';
      const patientResult = await pool.query(patientQuery, [user.patient_id]);
      if (patientResult.rows.length > 0) {
        res.json({
          login_id: user.login_id,
          username: user.username,
          user_type: user.user_type,
          patient: patientResult.rows[0],
        });
      } else {
        return res
          .status(404)
          .json({ error: "Patient record not found for this user." });
      }
    } else {
      res.status(403).json({ error: "Please use the employee login." });
    }
  } catch (err) {
    console.error("Patient login error:", err);
    res.status(500).send("Server error");
  }
});

// --- EMPLOYEE AUTHENTICATION ---
router.post("/employee/signup", async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    contact_number,
    role,
    license_number,
    department_name,
    doctor_type_id,
    consultation_fee, // ✅ 1. Get the new fee from the request
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let departmentId;
    const deptResult = await client.query(
      'SELECT department_id FROM "DEPARTMENT" WHERE name = $1',
      [department_name]
    );
    if (deptResult.rows.length > 0) {
      departmentId = deptResult.rows[0].department_id;
    } else {
      const newDeptResult = await client.query(
        'INSERT INTO "DEPARTMENT" (name) VALUES ($1) RETURNING department_id',
        [department_name]
      );
      departmentId = newDeptResult.rows[0].department_id;
    }
    const password_hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const employeeResult = await client.query(
      `INSERT INTO "EMPLOYEE" (first_name, last_name, contact_number, email, role, password_hash, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING employee_id;`,
      [first_name, last_name, contact_number, email, role, password_hash]
    );
    const newEmployeeId = employeeResult.rows[0].employee_id;
    if (role === "Doctor") {
      // ✅ 2. Update the INSERT query to include the new column
      await client.query(
        `INSERT INTO "DOCTOR" (employee_id, department_id, doctor_type_id, license_number, consultation_fee) VALUES ($1, $2, $3, $4, $5);`,
        // ✅ 3. Add the new fee to the values array
        [
          newEmployeeId,
          departmentId,
          doctor_type_id,
          license_number,
          consultation_fee,
        ]
      );
    } else if (role === "Nurse") {
      await client.query(
        `INSERT INTO "NURSE" (employee_id, department_id, license_number) VALUES ($1, $2, $3);`,
        [newEmployeeId, departmentId, license_number]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({
      message:
        "Registration submitted successfully! Please wait for admin approval.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505")
      return res
        .status(409)
        .json({ error: "An employee with this email already exists." });
    console.error("Server error during employee signup:", err);
    res.status(500).send("Server error during employee signup.");
  } finally {
    client.release();
  }
});

router.post("/employee/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });
  try {
    const loginResult = await pool.query(
      "SELECT * FROM \"LOGIN\" WHERE username = $1 AND user_type = 'EMPLOYEE'",
      [email]
    );
    if (loginResult.rows.length === 0)
      return res
        .status(404)
        .json({ error: "Employee not found or access denied." });

    const userLogin = loginResult.rows[0];
    if (!(await bcrypt.compare(password, userLogin.password_hash)))
      return res.status(400).json({ error: "Invalid credentials." });

    const employeeResult = await pool.query(
      'SELECT * FROM "EMPLOYEE" WHERE employee_id = $1',
      [userLogin.employee_id]
    );
    if (employeeResult.rows.length === 0)
      return res.status(404).json({ error: "Employee record not found." });

    let doctorId = null;
    if (employeeResult.rows[0].role === "Doctor") {
      const doctorRes = await pool.query(
        'SELECT doctor_id FROM "DOCTOR" WHERE employee_id = $1',
        [userLogin.employee_id]
      );
      if (doctorRes.rows.length > 0) {
        doctorId = doctorRes.rows[0].doctor_id;
      }
    }

    res.json({
      login_id: userLogin.login_id,
      username: userLogin.username,
      user_type: userLogin.user_type,
      employee: {
        ...employeeResult.rows[0],
        doctor_id: doctorId,
      },
    });
  } catch (err) {
    console.error("Employee login error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
