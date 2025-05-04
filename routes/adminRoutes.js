const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Protected route - GET stats
  router.get("/stats", async (req, res) => {
    // Token verification should happen via middleware (not shown here)
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

  return router;
};
