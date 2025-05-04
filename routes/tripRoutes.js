//tripRoutes.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Create a new trip
  router.post("/", async (req, res) => {
    const { user_id, destination_id, number_of_people, start_date, end_date } = req.body;

    if (!user_id || !number_of_people || !start_date || !end_date) {
      return res.status(400).json({ error: "Missing required fields for trip." });
    }

    try {
      const insertQuery = `
        INSERT INTO trip (user_id, destination_id, number_of_people, start_date, end_date, starting_point)
        VALUES (?, ?, ?, ?, ?)
      `;

      await db.promise().query(insertQuery, [
        user_id,
        destination_id,
        number_of_people,
        start_date,
        end_date,
      ]);

      res.status(201).json({ message: "Trip created successfully." });
    } catch (error) {
      console.error("Create trip error:", error.message);
      res.status(500).json({ error: "Failed to create trip." });
    }
  });

  // Get all trips for a specific user
  router.get("/user/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const [trips] = await db.promise().query(
        `SELECT * FROM trip WHERE user_id = ?`,
        [userId]
      );

      res.json(trips);
    } catch (error) {
      console.error("Fetch user trips error:", error.message);
      res.status(500).json({ error: "Failed to retrieve trips." });
    }
  });

  // Get trip by ID
  router.get("/:tripId", async (req, res) => {
    const { tripId } = req.params;

    try {
      const [trips] = await db.promise().query(
        `SELECT * FROM trip WHERE trip_id = ?`,
        [tripId]
      );

      if (trips.length === 0) {
        return res.status(404).json({ error: "Trip not found." });
      }

      res.json(trips[0]);
    } catch (error) {
      console.error("Get trip error:", error.message);
      res.status(500).json({ error: "Failed to retrieve trip." });
    }
  });

    // Update a trip
    router.put("/:tripId", async (req, res) => {
        const { tripId } = req.params;
        const { number_of_people, start_date, end_date, trip_completed, destination_id } = req.body;
    
        // Check if destination_id is provided (it should be when updating after destination creation)
        if (destination_id == null) {
        return res.status(400).json({ error: "Missing destination_id for trip update." });
        }
    
        try {
        const updateQuery = `
            UPDATE trip 
            SET number_of_people = ?, start_date = ?, end_date = ?, trip_completed = ?, destination_id = ?
            WHERE trip_id = ?
        `;
    
        const [result] = await db.promise().query(updateQuery, [
            number_of_people,
            start_date,
            end_date,
            trip_completed,
            destination_id,  // Correctly pass destination_id here
            tripId,
        ]);
    
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Trip not found." });
        }
    
        res.json({ message: "Trip updated successfully." });
        } catch (error) {
        console.error("Update trip error:", error.message);
        res.status(500).json({ error: "Failed to update trip." });
        }
    });
  

  // Delete a trip
  router.delete("/:tripId", async (req, res) => {
    const { tripId } = req.params;

    try {
      const [result] = await db.promise().query(
        `DELETE FROM trip WHERE trip_id = ?`,
        [tripId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Trip not found." });
      }

      res.json({ message: "Trip deleted successfully." });
    } catch (error) {
      console.error("Delete trip error:", error.message);
      res.status(500).json({ error: "Failed to delete trip." });
    }
  });

  return router;
};
