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

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  const client = await pool.connect();
  try {
    // Start a database transaction
    await client.query("BEGIN");

    // Process each item in the cart
    for (const item of cartItems) {
      // ✅ FIX: Update the stock and check if the update was successful
      const updateResult = await client.query(
        'UPDATE "MEDICATION" SET stock_quantity = stock_quantity - $1 WHERE medication_id = $2 AND stock_quantity >= $1',
        [item.quantity, item.medication_id]
      );

      // If rowCount is 0, the WHERE clause failed (insufficient stock)
      if (updateResult.rowCount === 0) {
        // If an item is out of stock, cancel the entire transaction
        await client.query("ROLLBACK");
        // Send a specific error message back to the user
        return res.status(409).json({
          // 409 Conflict is a good status code for this
          error: `Checkout failed: Not enough stock for "${item.name}". Please review your cart.`,
          outOfStockItem: item.medication_id,
        });
      }
    }

    // If all items were updated successfully, commit the transaction
    await client.query("COMMIT");
    res.status(200).json({ message: "Checkout successful!" });
  } catch (err) {
    // If any other error occurs, roll back the transaction
    await client.query("ROLLBACK");
    console.error("Error during checkout:", err.message);
    res.status(500).json({ error: "A server error occurred during checkout." });
  } finally {
    // Release the database client back to the pool
    client.release();
  }
});

module.exports = router;
