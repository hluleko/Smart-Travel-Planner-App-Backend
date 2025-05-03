//budgetRoutes.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Create a new budget for a trip
  router.post("/", async (req, res) => {
    const { trip_id, min_amount, max_amount } = req.body;

    if (!trip_id || min_amount === undefined || max_amount === undefined) {
      return res.status(400).json({ error: "Missing required fields for budget." });
    }

    try {
      const insertQuery = `
        INSERT INTO budget (trip_id, min_amount, max_amount)
        VALUES (?, ?, ?)
      `;

      await db.promise().query(insertQuery, [trip_id, min_amount, max_amount]);

      res.status(201).json({ message: "Budget added successfully." });
    } catch (error) {
      console.error("Create budget error:", error.message);
      res.status(500).json({ error: "Failed to create budget." });
    }
  });

  // Get budget for a specific trip
  router.get("/:tripId", async (req, res) => {
    const { tripId } = req.params;

    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM budget WHERE trip_id = ?`,
        [tripId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Budget not found for this trip." });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error("Fetch budget error:", error.message);
      res.status(500).json({ error: "Failed to retrieve budget." });
    }
  });

  // Update a budget
  router.put("/:budgetId", async (req, res) => {
    const { budgetId } = req.params;
    const { min_amount, max_amount } = req.body;

    try {
      const updateQuery = `
        UPDATE budget
        SET min_amount = ?, max_amount = ?
        WHERE budget_id = ?
      `;

      const [result] = await db.promise().query(updateQuery, [
        min_amount,
        max_amount,
        budgetId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Budget not found." });
      }

      res.json({ message: "Budget updated successfully." });
    } catch (error) {
      console.error("Update budget error:", error.message);
      res.status(500).json({ error: "Failed to update budget." });
    }
  });

  // Delete a budget
  router.delete("/:budgetId", async (req, res) => {
    const { budgetId } = req.params;

    try {
      const [result] = await db.promise().query(
        `DELETE FROM budget WHERE budget_id = ?`,
        [budgetId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Budget not found." });
      }

      res.json({ message: "Budget deleted successfully." });
    } catch (error) {
      console.error("Delete budget error:", error.message);
      res.status(500).json({ error: "Failed to delete budget." });
    }
  });

  return router;
};
