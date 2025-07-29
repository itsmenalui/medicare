const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");

// Set up multer for memory storage. This is necessary for handling file uploads.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET all available medical tests (for patients)
router.get("/", async (req, res) => {
  try {
    const query = 'SELECT * FROM "TEST" ORDER BY name;';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching medical tests:", err.message);
    res.status(500).send("Server error");
  }
});

// GET all pending test orders (for nurses)
router.get("/orders", async (req, res) => {
  try {
    const query = `
            SELECT 
                o.order_id, o.order_date, o.status,
                p.first_name, p.last_name,
                t.name as test_name
            FROM "TEST_ORDER" o
            JOIN "PATIENT" p ON o.patient_id = p.patient_id
            JOIN "TEST" t ON o.test_id = t.test_id
            WHERE o.status = 'Pending'
            ORDER BY o.order_date ASC;
        `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching test orders:", err.message);
    res.status(500).send("Server error");
  }
});

// POST to submit a test result (for nurses)
router.post(
  "/orders/:id/result",
  upload.single("reportPdf"),
  async (req, res) => {
    // ✅ FIX: Convert the ID from the URL parameter (string) into a number
    const orderId = parseInt(req.params.id, 10);
    const file = req.file;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID." });
    }
    if (!file) {
      return res.status(400).json({ error: "No PDF file was uploaded." });
    }

    try {
      const updateResult = await pool.query(
        'UPDATE "TEST_ORDER" SET status = $1, result_pdf_data = $2, result_pdf_name = $3 WHERE order_id = $4',
        ["Completed", file.buffer, file.originalname, orderId]
      );

      if (updateResult.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Order not found or already completed." });
      }

      res.status(200).json({ message: "Test result submitted successfully." });
    } catch (err) {
      console.error("Error submitting test result:", err.stack); // Log the full error
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
