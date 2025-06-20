//costRoutes.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Create a new cost for a trip
  router.post("/", async (req, res) => {
    const { trip_id, amount, breakdown } = req.body;

    if (!trip_id || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields for cost." });
    }

    try {
      const insertQuery = `
        INSERT INTO cost (trip_id, amount, breakdown)
        VALUES (?, ?, ?)
      `;

      await db.promise().query(insertQuery, [trip_id, amount, breakdown ? JSON.stringify(breakdown) : null]);

      res.status(201).json({ message: "Cost added successfully." });
    } catch (error) {
      console.error("Create cost error:", error.message);
      res.status(500).json({ error: "Failed to create cost." });
    }
  });

  // Get cost for a specific trip
  router.get("/:tripId", async (req, res) => {
    const { tripId } = req.params;

    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM cost WHERE trip_id = ?`,
        [tripId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Cost not found for this trip." });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error("Fetch cost error:", error.message);
      res.status(500).json({ error: "Failed to retrieve cost." });
    }
  });

  // Update a cost
  router.put("/:costId", async (req, res) => {
    const { costId } = req.params;
    const { amount, breakdown } = req.body;

    try {
      const updateQuery = `
        UPDATE cost
        SET amount = ?, breakdown = ?
        WHERE cost_id = ?
      `;

      const [result] = await db.promise().query(updateQuery, [
        amount,
        breakdown ? JSON.stringify(breakdown) : null,
        costId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Cost not found." });
      }

      res.json({ message: "Cost updated successfully." });
    } catch (error) {
      console.error("Update cost error:", error.message);
      res.status(500).json({ error: "Failed to update cost." });
    }
  });

  // Delete a cost
  router.delete("/:costId", async (req, res) => {
    const { costId } = req.params;

    try {
      const [result] = await db.promise().query(
        `DELETE FROM cost WHERE cost_id = ?`,
        [costId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Cost not found." });
      }

      res.json({ message: "Cost deleted successfully." });
    } catch (error) {
      console.error("Delete cost error:", error.message);
      res.status(500).json({ error: "Failed to delete cost." });
    }
  });

  return router;
};