const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Add an allergy
  router.post("/", async (req, res) => {
    const { user_id, name } = req.body;

    if (!user_id || !name) {
      return res.status(400).json({ error: "user_id and name are required." });
    }

    try {
      await db.promise().query(
        "INSERT INTO allergy (user_id, name) VALUES (?, ?)",
        [user_id, name]
      );
      res.status(201).json({ message: "Allergy added successfully." });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        res.status(409).json({ error: "Allergy already exists for this user." });
      } else {
        console.error("Add allergy error:", error);
        res.status(500).json({ error: "Failed to add allergy." });
      }
    }
  });

  // Get all allergies for a user
  router.get("/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
      const [rows] = await db
        .promise()
        .query("SELECT allergy_id, name FROM allergy WHERE user_id = ?", [user_id]);
      res.json(rows);
    } catch (error) {
      console.error("Fetch allergies error:", error);
      res.status(500).json({ error: "Failed to fetch allergies." });
    }
  });

  // Delete an allergy
  router.delete("/:allergy_id", async (req, res) => {
    const { allergy_id } = req.params;

    try {
      await db
        .promise()
        .query("DELETE FROM allergy WHERE allergy_id = ?", [allergy_id]);
      res.json({ message: "Allergy deleted." });
    } catch (error) {
      console.error("Delete allergy error:", error);
      res.status(500).json({ error: "Failed to delete allergy." });
    }
  });

  return router;
};
