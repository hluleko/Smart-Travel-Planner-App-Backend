const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Create a new review for a trip
  router.post("/", async (req, res) => {
    const { trip_id, rating, comment } = req.body;

    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    if (!trip_id) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      const insertQuery = `
        INSERT INTO review (trip_id, rating, comment)
        VALUES (?, ?, ?)
      `;

      await db.promise().query(insertQuery, [trip_id, rating, comment]);

      res.status(201).json({ message: "Review added successfully." });
    } catch (error) {
      console.error("Create review error:", error.message);
      res.status(500).json({ error: "Failed to create review." });
    }
  });

  // Get all reviews for a specific trip
  router.get("/:tripId", async (req, res) => {
    const { tripId } = req.params;

    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM review WHERE trip_id = ?`,
        [tripId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "No reviews found for this trip." });
      }

      res.json(rows);
    } catch (error) {
      console.error("Fetch reviews error:", error.message);
      res.status(500).json({ error: "Failed to retrieve reviews." });
    }
  });

  // Update a review
  router.put("/:reviewId", async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    try {
      const updateQuery = `
        UPDATE review
        SET rating = ?, comment = ?
        WHERE review_id = ?
      `;

      const [result] = await db.promise().query(updateQuery, [
        rating,
        comment,
        reviewId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Review not found." });
      }

      res.json({ message: "Review updated successfully." });
    } catch (error) {
      console.error("Update review error:", error.message);
      res.status(500).json({ error: "Failed to update review." });
    }
  });

  // Delete a review
  router.delete("/:reviewId", async (req, res) => {
    const { reviewId } = req.params;

    try {
      const [result] = await db.promise().query(
        `DELETE FROM review WHERE review_id = ?`,
        [reviewId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Review not found." });
      }

      res.json({ message: "Review deleted successfully." });
    } catch (error) {
      console.error("Delete review error:", error.message);
      res.status(500).json({ error: "Failed to delete review." });
    }
  });

  return router;
};
