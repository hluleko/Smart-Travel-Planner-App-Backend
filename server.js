require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB connection pool
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  queueLimit: 0,
});

//Ensure all tables exist
db.query(`
  CREATE TABLE IF NOT EXISTS user (
    user_id INT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    language_preferences TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
db.query(`
  CREATE TABLE IF NOT EXISTS trip (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    destination_id INT,
    title VARCHAR(255),
    start_date DATE,
    end_date DATE,
    description TEXT,
    starting_point VARCHAR(255),
    number_of_people INT,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
  )
`);
db.query(`
  CREATE TABLE IF NOT EXISTS destination (
    destination_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    rating DECIMAL(2,1),
    photo_url VARCHAR(1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
db.query(`
  CREATE TABLE IF NOT EXISTS budget (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    min_amount DECIMAL(10,2) NOT NULL,
    max_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE
  )
`);
db.query(`
  CREATE TABLE IF NOT EXISTS review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE
  )
`);
db.query(`
  CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number_of_users_registered INT DEFAULT 0,
    number_of_users_deleted INT DEFAULT 0
  )
`);

// Routes
const userRoutes = require("./routes/userRoutes")(db);
app.use("/api/users", userRoutes);
const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profile", profileRoutes(db));
const tripRoutes = require("./routes/tripRoutes");
app.use("/api/trips", tripRoutes(db));
const destinationRoutes = require("./routes/destinationRoutes");
app.use("/api/destinations", destinationRoutes(db));
const budgetRoutes = require("./routes/budgetRoutes");
app.use("/api/budgets", budgetRoutes(db));
const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/reviews", reviewRoutes(db));
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes(db));

// Test DB connection route
app.get("/api/ping-db", (req, res) => {
  db.query("SELECT 1 + 1 AS solution", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "DB connected!", solution: results[0].solution });
  });
});

// Basic root route
app.get("/", (req, res) => {
  res.send("Welcome to the backend API!");
});

// 404 fallback
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
