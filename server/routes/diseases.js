const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all diseases (handles search)
// Path: /api/diseases
router.get("/", async (req, res) => {
  const searchTerm = req.query.search || "";
  try {
    const query = `
      SELECT disease_id, name, description, image_url, symptoms 
      FROM "DISEASE"
      WHERE name ILIKE $1
      ORDER BY name;
    `;
    const { rows } = await pool.query(query, [`%${searchTerm}%`]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching diseases:", err.message);
    res.status(500).send("Server error");
  }
});

// GET a single disease by ID
// Path: /api/diseases/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM "DISEASE" WHERE disease_id = $1;';
    const { rows } = await pool.query(query, [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send("Disease not found");
    }
  } catch (err) {
    console.error(`Error fetching disease ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
