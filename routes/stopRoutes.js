const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Create a new stop
  router.post("/", async (req, res) => {
    const { trip_id, name, address, location, photo_url, order_index } = req.body;

    if (!trip_id || !name || !address || !location || order_index === undefined) {
      return res.status(400).json({ error: "Missing required fields for stop." });
    }

    try {
      const insertQuery = `
        INSERT INTO stop (trip_id, name, address, location, photo_url, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.promise().query(insertQuery, [
        trip_id,
        name,
        address,
        location,
        photo_url || null,
        order_index
      ]);

      res.status(201).json({
        message: "Stop added successfully.",
        stop_id: result.insertId
      });
    } catch (error) {
      console.error("Create stop error:", error.message);
      res.status(500).json({ error: "Failed to create stop." });
    }
  });

  // Get all stops for a trip
  router.get("/trip/:tripId", async (req, res) => {
    const { tripId } = req.params;

    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM stop WHERE trip_id = ? ORDER BY order_index ASC`,
        [tripId]
      );

      res.json(rows);
    } catch (error) {
      console.error("Fetch stops error:", error.message);
      res.status(500).json({ error: "Failed to retrieve stops." });
    }
  });

  // Update a stop
  router.put("/:stopId", async (req, res) => {
    const { stopId } = req.params;
    const { name, address, location, photo_url, order_index } = req.body;

    try {
      const updateQuery = `
        UPDATE stop
        SET name = ?, address = ?, location = ?, photo_url = ?, order_index = ?
        WHERE stop_id = ?
      `;

      const [result] = await db.promise().query(updateQuery, [
        name,
        address,
        location,
        photo_url,
        order_index,
        stopId
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop not found." });
      }

      res.json({ message: "Stop updated successfully." });
    } catch (error) {
      console.error("Update stop error:", error.message);
      res.status(500).json({ error: "Failed to update stop." });
    }
  });

  // Delete a stop
  router.delete("/:stopId", async (req, res) => {
    const { stopId } = req.params;

    try {
      const [result] = await db.promise().query(
        `DELETE FROM stop WHERE stop_id = ?`,
        [stopId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop not found." });
      }

      res.json({ message: "Stop deleted successfully." });
    } catch (error) {
      console.error("Delete stop error:", error.message);
      res.status(500).json({ error: "Failed to delete stop." });
    }
  });

  return router;
};