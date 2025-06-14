const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Ensure the admin row exists
  db.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      number_of_users_registered INT DEFAULT 0,
      number_of_users_deleted INT DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error("Error creating admin table:", err.message);
    } else {
      db.query(`SELECT COUNT(*) AS count FROM admin`, (err, results) => {
        if (err) {
          console.error("Error checking admin row:", err.message);
        } else if (results[0].count === 0) {
          db.query(`
            INSERT INTO admin (number_of_users_registered, number_of_users_deleted)
            VALUES (0, 0)
          `, (err) => {
            if (err) {
              console.error("Error inserting admin row:", err.message);
            } else {
              console.log("Initial row inserted into admin table.");
            }
          });
        }
      });
    }
  });

  // Protected route - GET stats
  router.get("/stats", async (req, res) => {
    try {
      const [stats] = await db.promise().query(`
        SELECT number_of_users_registered, number_of_users_deleted FROM admin LIMIT 1
      `);
      res.json(stats[0]);
    } catch (error) {
      console.error("Fetch admin stats error:", error.message);
      res.status(500).json({ error: "Failed to retrieve stats." });
    }
  });

  // Public route - increment counts for user creation/deletion
  router.post("/activity", async (req, res) => {
    const { type } = req.body;

    if (type !== "account_created" && type !== "account_deleted") {
      return res.status(400).json({ error: "Invalid activity type." });
    }

    const column =
      type === "account_created"
        ? "number_of_users_registered"
        : "number_of_users_deleted";

    try {
      await db.promise().query(`
        UPDATE admin SET ${column} = ${column} + 1
      `);
      res.status(200).json({ message: "Admin count updated." });
    } catch (error) {
      console.error("Admin count update error:", error.message);
      res.status(500).json({ error: "Failed to update admin count." });
    }
  });

  // Admin route - GET all users
  router.get("/users", async (req, res) => {
    try {
      const [users] = await db.promise().query(`
        SELECT user_id, username, email, user_role, created_at 
        FROM user
      `);
      res.json(users);
    } catch (error) {
      console.error("Fetch all users error:", error.message);
      res.status(500).json({ error: "Failed to retrieve users." });
    }
  });

  // Admin route - GET all trips
  router.get("/trips", async (req, res) => {
    try {
      const [trips] = await db.promise().query(`
        SELECT t.*, u.username, u.email, d.location
        FROM trip t
        LEFT JOIN user u ON t.user_id = u.user_id
        LEFT JOIN destination d ON t.destination_id = d.destination_id
      `);
      res.json(trips);
    } catch (error) {
      console.error("Fetch all trips error:", error.message);
      res.status(500).json({ error: "Failed to retrieve trips." });
    }
  });

  return router;
};
