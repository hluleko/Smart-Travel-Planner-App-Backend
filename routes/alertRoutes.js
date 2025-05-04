const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Create a new alert
  router.post("/", async (req, res) => {
    const { user_id, type, message } = req.body;

    if (!user_id || !type || !message) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      const insertQuery = `
        INSERT INTO alert (user_id, type, message)
        VALUES (?, ?, ?)
      `;

      const [result] = await db.promise().query(insertQuery, [
        user_id,
        type,
        message,
      ]);

      res.status(201).json({
        message: "Alert created successfully.",
        alert_id: result.insertId,
      });
    } catch (error) {
      console.error("Create alert error:", error.message);
      res.status(500).json({ error: "Failed to create alert." });
    }
  });

  // Get all alerts for a user
  router.get("/user/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const [alerts] = await db
        .promise()
        .query(`SELECT * FROM alert WHERE user_id = ? ORDER BY created_at DESC`, [userId]);

      res.json(alerts);
    } catch (error) {
      console.error("Fetch alerts error:", error.message);
      res.status(500).json({ error: "Failed to retrieve alerts." });
    }
  });

  // Mark alert as seen
  router.patch("/seen/:alertId", async (req, res) => {
    const { alertId } = req.params;

    try {
      const [result] = await db
        .promise()
        .query(`UPDATE alert SET seen = TRUE WHERE alert_id = ?`, [alertId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Alert not found." });
      }

      res.json({ message: "Alert marked as seen." });
    } catch (error) {
      console.error("Mark alert as seen error:", error.message);
      res.status(500).json({ error: "Failed to mark alert as seen." });
    }
  });

  // Delete an alert
  router.delete("/:alertId", async (req, res) => {
    const { alertId } = req.params;

    try {
      const [result] = await db
        .promise()
        .query(`DELETE FROM alert WHERE alert_id = ?`, [alertId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Alert not found." });
      }

      res.json({ message: "Alert deleted successfully." });
    } catch (error) {
      console.error("Delete alert error:", error.message);
      res.status(500).json({ error: "Failed to delete alert." });
    }
  });

  // Get count of unseen alerts for a user
  router.get("/user/:userId/unseen-count", async (req, res) => {
    const { userId } = req.params;

    try {
      const [rows] = await db
        .promise()
        .query(`SELECT COUNT(*) AS unseen_count FROM alert WHERE user_id = ? AND seen = FALSE`, [userId]);

      res.json({ unseen_count: rows[0].unseen_count });
    } catch (error) {
      console.error("Unseen count error:", error.message);
      res.status(500).json({ error: "Failed to fetch unseen alert count." });
    }
  });

  return router;
};
