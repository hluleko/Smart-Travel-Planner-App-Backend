const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Get User Profile
  router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const [users] = await db.promise().query(
        "SELECT user_id, username, email, language_preferences, created_at FROM user WHERE user_id = ? AND deleted_at IS NULL",
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: "User not found or deleted." });
      }

      res.json(users[0]);
    } catch (error) {
      console.error("Get profile error:", error.message);
      res.status(500).json({ error: "Failed to fetch user profile." });
    }
  });

  // Update User Profile
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { username, email, language_preferences } = req.body;

    try {
      const [result] = await db.promise().query(
        `UPDATE user 
         SET username = ?, email = ?, language_preferences = ? 
         WHERE user_id = ? AND deleted_at IS NULL`,
        [username, email, language_preferences, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found or already deleted." });
      }

      res.json({ message: "Profile updated successfully." });
    } catch (error) {
      console.error("Update profile error:", error.message);
      res.status(500).json({ error: "Failed to update profile." });
    }
  });

  // Soft Delete User
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await db.promise().query(
        "UPDATE user SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found or already deleted." });
      }

      res.json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Delete profile error:", error.message);
      res.status(500).json({ error: "Failed to delete user." });
    }
  });

  return router;
};
