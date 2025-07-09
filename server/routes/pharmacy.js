const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all medications (handles search and pagination)
// Path: /api/pharmacy/medications
router.get("/medications", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const searchTerm = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    const searchPattern = `%${searchTerm}%`;
    let medicationsQuery = 'SELECT * FROM "MEDICATION"';
    let totalQuery = 'SELECT COUNT(*) FROM "MEDICATION"';
    let queryParams = [];

    if (searchTerm) {
      const whereClause = " WHERE name ILIKE $1";
      medicationsQuery += whereClause;
      totalQuery += whereClause;
      queryParams.push(searchPattern);
    }

    medicationsQuery +=
      " ORDER BY name LIMIT $" +
      (queryParams.length + 1) +
      " OFFSET $" +
      (queryParams.length + 2);
    queryParams.push(limit, offset);

    const medsResult = await pool.query(medicationsQuery, queryParams);
    const totalResult = await pool.query(
      totalQuery,
      searchTerm ? [searchPattern] : []
    );

    res.json({
      medications: medsResult.rows,
      totalCount: parseInt(totalResult.rows[0].count),
    });
  } catch (err) {
    console.error("Error fetching medications:", err.message);
    res.status(500).send("Server error");
  }
});

// POST to checkout
// Path: /api/pharmacy/checkout
router.post("/checkout", async (req, res) => {
  const { cartItems } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of cartItems) {
      await client.query(
        'UPDATE "MEDICATION" SET stock_quantity = stock_quantity - $1 WHERE medication_id = $2 AND stock_quantity >= $1',
        [item.quantity, item.medication_id]
      );
    }
    await client.query("COMMIT");
    res.status(200).json({ message: "Checkout successful and stock updated." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error during checkout:", err.message);
    res.status(500).send("Server error during checkout.");
  } finally {
    client.release();
  }
});

module.exports = router;
