const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = (db) => {
  // Register User (with gapless ID logic)
  router.post("/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields." });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Find next available user_id (gapless)
      const [rows] = await db.promise().query(`
        SELECT t1.user_id + 1 AS next_id
        FROM user t1
        LEFT JOIN user t2 ON t1.user_id + 1 = t2.user_id
        WHERE t2.user_id IS NULL
        ORDER BY t1.user_id
        LIMIT 1
      `);
  
      const nextUserId = rows.length > 0 ? rows[0].next_id : 1;
  
      // Include user_role in the insert
      const insertQuery = `
        INSERT INTO user (user_id, username, email, password, user_role)
        VALUES (?, ?, ?, ?, ?)
      `;
  
      await db.promise().query(insertQuery, [
        nextUserId,
        username,
        email,
        hashedPassword,
        "user" // default role
      ]);
  
      res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
      console.error("Registration error:", error.message);
      res.status(500).json({ error: "Registration failed." });
    }
  });
  

  // Login User
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const [users] = await db.promise().query("SELECT * FROM user WHERE email = ?", [email]);

      if (users.length === 0) {
        return res.status(404).json({ error: "Email not found. Please register." });
      }

      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      }

      const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.json({
        token,
        user_id: user.user_id,
      });
    } catch (error) {
      console.error("Login error:", error.message);
      res.status(500).json({ error: "Login failed. Please try again later." });
    }
  });

  return router;
};
