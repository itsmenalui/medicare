const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ✅ This 'ssl' block is required for connecting to Neon/Render
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
