require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Database connection using connection pool
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  queueLimit: 0,
});

// Check database connection
async function testDBConnection() {
  try {
    const connection = await db.getConnection();
    console.log(" Database connected successfully!");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Stop server if DB connection fails
  }
}

//Database Connection(Trip Table)
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  queueLimit: 0,
});

// Check database connection
async function testDBConnection() {
  try {
    const connection = await db.getConnection();
    console.log(" Database connected successfully!");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Stop server if DB connection fails
  }
}

//Ensure `users` table exists
async function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        destination VARCHAR(255) DEFAULT NULL,
        budget DECIMAL(10,2) DEFAULT NULL,
        dietary_restrictions VARCHAR(255) DEFAULT NULL,
        accessibility_needs VARCHAR(255) DEFAULT NULL,
        language_preferences VARCHAR(255) DEFAULT NULL
      );
    `;
    const connection = await db.getConnection();
    await connection.query(createTableQuery);
    connection.release();
    console.log("Users table checked/created.");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  }
}

async function initializeTripTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        destination VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        budget DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    const connection = await db.getConnection();
    await connection.query(createTableQuery);
    connection.release();
    console.log("Trips table checked/created.");
  } catch (error) {
    console.error("Trip table initialization failed:", error.message);
    process.exit(1);
  }
}

async function initializeReviewTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        destination VARCHAR(255) NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    const connection = await db.getConnection();
    await connection.query(createTableQuery);
    connection.release();
    console.log("Reviews table checked/created.");
  } catch (error) {
    console.error("Review table initialization failed:", error.message);
    process.exit(1);
  }
}


async function initializeTripTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        destination_id VARCHAR(222) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE  NOT NULL,
        bugdet (DECIMAL) NOT NULL
       
      );
    `;
    const connection = await db.getConnection();
    await connection.query(createTableQuery);
    connection.release();
    console.log("Users table checked/created.");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  }
}



//Run DB checks
testDBConnection();
initializeDatabase();
initializeTripTable();
initializeReviewTable();


//Register User
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, destination, budget, dietary_restrictions, accessibility_needs, language_preferences } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (username, email, password, destination, budget, dietary_restrictions, accessibility_needs, language_preferences)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [username, email, hashedPassword, destination, budget, dietary_restrictions, accessibility_needs, language_preferences];

    const connection = await db.getConnection();
    await connection.query(query, values);
    connection.release();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Registration failed." });
  }
});

//Login User
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const connection = await db.getConnection();
    const [users] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
    connection.release();

    if (users.length === 0) return res.status(401).json({ error: "Invalid credentials." });

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Login failed." });
  }
});

//Get User Profile
app.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const connection = await db.getConnection();
    const [users] = await connection.query(
      "SELECT id, username, email, destination, budget, dietary_restrictions, accessibility_needs, language_preferences FROM users WHERE id = ?",
      [userId]
    );
    connection.release();

    if (users.length === 0) return res.status(404).json({ error: "User not found." });

    res.json(users[0]);
  } catch (error) {
    console.error("Profile fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

//Update User Profile
app.put("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { destination, budget, dietary_restrictions, accessibility_needs, language_preferences } = req.body;

    const query = `
      UPDATE users SET destination = ?, budget = ?, dietary_restrictions = ?, accessibility_needs = ?, language_preferences = ?
      WHERE id = ?
    `;
    const values = [destination, budget, dietary_restrictions, accessibility_needs, language_preferences, userId];

    const connection = await db.getConnection();
    await connection.query(query, values);
    connection.release();

    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Update error:", error.message);
    res.status(500).json({ error: "Update failed." });
  }
});

//Delete User Profile
app.delete("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const connection = await db.getConnection();
    await connection.query("DELETE FROM users WHERE id = ?", [userId]);
    connection.release();

    res.json({ message: "Profile deleted successfully!" });
  } catch (error) {
    console.error("Deletion error:", error.message);
    res.status(500).json({ error: "Failed to delete profile." });
  }
});

//Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
