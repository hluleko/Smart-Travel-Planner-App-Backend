const express = require("express");
const router = express.Router();

module.exports = (db) => {
    // Create a new destination
    router.post("/", async (req, res) => {
        const { user_id, location, address, rating, photo_url } = req.body;
    
        if (!user_id || !location || !address) {
        return res.status(400).json({ error: "Missing required fields: user_id, location, or address." });
        }
    
        try {
        const insertQuery = `
            INSERT INTO destination (user_id, location, address, rating, photo_url)
            VALUES (?, ?, ?, ?, ?)
        `;
    
        const [result] = await db.promise().query(insertQuery, [
            user_id,
            location,
            address,
            rating || null,
            photo_url || null,
        ]);
    
        const destination_id = result.insertId;
    
        res.status(201).json({
            message: "Destination added successfully.",
            destination_id, // <-- return this to frontend
        });
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
