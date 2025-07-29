const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all medications (handles search and pagination)
// This route is unchanged and correct.
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
// ✅ FIX: This is the fully merged and corrected checkout route.
router.post("/checkout", async (req, res) => {
  // Now accepts both cartItems and patient_id
  const { cartItems, patient_id } = req.body;

  if (!cartItems || cartItems.length === 0 || !patient_id) {
    return res
      .status(400)
      .json({ error: "Cart is empty or patient ID is missing." });
  }

  const client = await pool.connect();
  try {
    // Start a database transaction
    await client.query("BEGIN");

    // Separate cart items into medications and tests
    const medications = cartItems.filter(
      (item) => !item.medication_id.toString().startsWith("test_")
    );
    const tests = cartItems.filter((item) =>
      item.medication_id.toString().startsWith("test_")
    );

    // Process medications with robust stock checking
    for (const item of medications) {
      const updateResult = await client.query(
        'UPDATE "MEDICATION" SET stock_quantity = stock_quantity - $1 WHERE medication_id = $2 AND stock_quantity >= $1',
        [item.quantity, item.medication_id]
      );

      // If rowCount is 0, it means the stock was insufficient.
      if (updateResult.rowCount === 0) {
        // Immediately cancel the entire transaction
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: `Checkout failed: Not enough stock for "${item.name}". Please review your cart.`,
          outOfStockItem: item.medication_id,
        });
      }
    }

    // Process medical tests by creating new order records
    for (const test of tests) {
      const testId = parseInt(test.medication_id.split("_")[1]); // Extract the real test_id
      if (isNaN(testId)) {
        // If the ID is invalid, throw an error to cancel the transaction
        throw new Error(`Invalid test ID found in cart: ${test.medication_id}`);
      }
      await client.query(
        'INSERT INTO "TEST_ORDER" (patient_id, test_id, order_date, status) VALUES ($1, $2, NOW(), $3)',
        [patient_id, testId, "Pending"]
      );
    }

    // If all items were processed successfully, commit the transaction
    await client.query("COMMIT");
    res.status(200).json({ message: "Checkout successful!" });
  } catch (err) {
    // If any other error occurs, roll back the transaction
    await client.query("ROLLBACK");
    console.error("Error during checkout:", err.message);
    res
      .status(500)
      .json({
        error: err.message || "A server error occurred during checkout.",
      });
  } finally {
    // Release the database client back to the pool
    client.release();
  }
});

module.exports = router;
