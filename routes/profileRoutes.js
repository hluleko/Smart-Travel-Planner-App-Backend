const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Get User Profile
  // Get User Profile
  router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const [users] = await db.promise().query(
        `SELECT user_id, username, email, created_at, user_role 
         FROM user 
         WHERE user_id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: "User not found." });
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
    const { username, email } = req.body;

    try {
      const [result] = await db.promise().query(
        `UPDATE user 
         SET username = ?, email = ? 
         WHERE user_id = ?`,
        [username, email, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found." });
      }

      res.json({ message: "Profile updated successfully." });
    } catch (error) {
      console.error("Update profile error:", error.message);
      res.status(500).json({ error: "Failed to update profile." });
    }
  });

  // Delete User
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await db.promise().query(
        "DELETE FROM user WHERE user_id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found." });
      }

      res.json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Delete profile error:", error.message);
      res.status(500).json({ error: "Failed to delete user." });
    }
  });

  return router;
};
