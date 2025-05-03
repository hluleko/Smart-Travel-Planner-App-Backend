//destinationRoutes.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Create a new destination
  router.post("/", async (req, res) => {
    const { user_id, name, location, description } = req.body;

    if (!user_id || !name || !location) {
      return res.status(400).json({ error: "Missing required fields for destination." });
    }

    try {
      const insertQuery = `
        INSERT INTO destination (user_id, name, location, description)
        VALUES (?, ?, ?, ?)
      `;

      await db.promise().query(insertQuery, [user_id, name, location, description]);

      res.status(201).json({ message: "Destination added successfully." });
    } catch (error) {
      console.error("Create destination error:", error.message);
      res.status(500).json({ error: "Failed to create destination." });
    }
  });

  // Get all destinations for a user
  router.get("/user/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM destination WHERE user_id = ?`,
        [userId]
      );

      res.json(rows);
    } catch (error) {
      console.error("Fetch destinations error:", error.message);
      res.status(500).json({ error: "Failed to retrieve destinations." });
    }
  });

  // Get destination by ID
  router.get("/:destinationId", async (req, res) => {
    const { destinationId } = req.params;

    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM destination WHERE destination_id = ?`,
        [destinationId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Destination not found." });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error("Get destination error:", error.message);
      res.status(500).json({ error: "Failed to retrieve destination." });
    }
  });

  // Update a destination
  router.put("/:destinationId", async (req, res) => {
    const { destinationId } = req.params;
    const { name, location, description } = req.body;

    try {
      const updateQuery = `
        UPDATE destination
        SET name = ?, location = ?, description = ?
        WHERE destination_id = ?
      `;

      const [result] = await db.promise().query(updateQuery, [
        name,
        location,
        description,
        destinationId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Destination not found." });
      }

      res.json({ message: "Destination updated successfully." });
    } catch (error) {
      console.error("Update destination error:", error.message);
      res.status(500).json({ error: "Failed to update destination." });
    }
  });

  // Delete a destination
  router.delete("/:destinationId", async (req, res) => {
    const { destinationId } = req.params;

    try {
      const [result] = await db.promise().query(
        `DELETE FROM destination WHERE destination_id = ?`,
        [destinationId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Destination not found." });
      }

      res.json({ message: "Destination deleted successfully." });
    } catch (error) {
      console.error("Delete destination error:", error.message);
      res.status(500).json({ error: "Failed to delete destination." });
    }
  });

  return router;
};
