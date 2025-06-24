require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

// Middleware
app.use(cors({
  exposedHeaders: ['Content-Disposition', 'Content-Type'],
  origin: '*'
}));
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

// Ensure all tables exist with error handling
db.query(`
  CREATE TABLE IF NOT EXISTS user (
    user_id INT PRIMARY KEY,
    user_role VARCHAR(255) DEFAULT 'user',
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) console.error("Error creating user table:", err.message);
  else console.log("User table checked/created.");
});

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
    trip_started BOOLEAN DEFAULT FALSE,
    trip_ended BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("Error creating trip table:", err.message);
  else console.log("Trip table checked/created.");
});

db.query(`
  CREATE TABLE IF NOT EXISTS destination (
    destination_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    rating DECIMAL(2,1),
    photo_url VARCHAR(1000),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("Error creating destination table:", err.message);
  else console.log("Destination table checked/created.");
});

db.query(`
  CREATE TABLE IF NOT EXISTS cost (
    cost_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    breakdown JSON,
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("Error creating cost table:", err.message);
  else console.log("Cost table checked/created.");
});

db.query(`
  CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number_of_users_registered INT DEFAULT 0,
    number_of_users_deleted INT DEFAULT 0
  )
`, (err) => {
  if (err) console.error("Error creating admin table:", err.message);
  else console.log("Admin table checked/created.");
});

db.query(`
  CREATE TABLE IF NOT EXISTS alert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('info', 'warning', 'error') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seen BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("Error creating alert table:", err.message);
  else console.log("Alert table checked/created.");
});
/*
db.query(`
  CREATE TABLE IF NOT EXISTS allergy (
    allergy_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    severity ENUM('Low', 'Moderate', 'High') NOT NULL DEFAULT 'Low',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("Error creating allergy table:", err.message);
  else console.log("Allergy table checked/created.");
});
*/

db.query(`
  CREATE TABLE IF NOT EXISTS stop (
    stop_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    location VARCHAR(255) NOT NULL,
    photo_url VARCHAR(1000),
    order_index INT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("Error creating stop table:", err.message);
  else console.log("Stop table checked/created.");
});


db.query("SELECT VERSION() AS version", (err, results) => {
  if (err) {
    console.error("Error fetching MySQL version:", err.message);
  } else {
    console.log("MySQL Server Version:", results[0].version);
  }
});



// Routes
const userRoutes = require("./routes/userRoutes")(db);
app.use("/api/users", userRoutes);
const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profile", profileRoutes(db));
const tripRoutes = require("./routes/tripRoutes");
app.use("/api/trips", tripRoutes(db));
const destinationRoutes = require("./routes/destinationRoutes");
app.use("/api/destinations", destinationRoutes(db));
const costRoutes = require("./routes/costRoutes");
app.use("/api/costs", costRoutes(db));
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes(db));
const alertRoutes = require("./routes/alertRoutes");
app.use("/api/alerts", alertRoutes(db));
/*
const allergyRoutes = require("./routes/allergyRoutes");
app.use("/api/allergies", allergyRoutes(db));
*/
const exportRoutes = require("./routes/exportRoutes");
app.use("/api", exportRoutes(db));
const stopRoutes = require("./routes/stopRoutes");
app.use("/api/stops", stopRoutes(db));


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
