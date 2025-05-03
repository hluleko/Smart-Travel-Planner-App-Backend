const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Get admin stats: number of users registered and deleted
  router.get("/stats", async (req, res) => {
    try {
      const [stats] = await db.promise().query(`
        SELECT
          (SELECT COUNT(*) FROM user WHERE deleted_at IS NULL) AS number_of_users_registered,
          (SELECT COUNT(*) FROM user WHERE deleted_at IS NOT NULL) AS number_of_users_deleted
      `);

      res.json(stats[0]);
    } catch (error) {
      console.error("Fetch admin stats error:", error.message);
      res.status(500).json({ error: "Failed to retrieve stats." });
    }
  });

  // Log admin activity (e.g., user account creation or deletion)
  router.post("/activity", async (req, res) => {
    const { user_id, type } = req.body;

    // Validate the activity type
    if (type !== "account_created" && type !== "account_deleted") {
      return res.status(400).json({ error: "Invalid activity type." });
    }

    try {
      const insertQuery = `
        INSERT INTO admin_activity (user_id, type)
        VALUES (?, ?)
      `;
      
      await db.promise().query(insertQuery, [user_id, type]);

      res.status(201).json({ message: "Activity logged successfully." });
    } catch (error) {
      console.error("Log admin activity error:", error.message);
      res.status(500).json({ error: "Failed to log activity." });
    }
  });

  return router;
};
