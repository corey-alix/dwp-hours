const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// Database file path
const DB_PATH = path.join(__dirname, "..", "db", "dwp-hours.db");

// Create database directory if it doesn't exist
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
let db;
try {
    db = new Database(DB_PATH);
    console.log("Connected to SQLite database.");
} catch (error) {
    console.error("Error opening database:", error.message);
    process.exit(1);
}

// Read and execute schema
const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

try {
    db.exec(schema);
    console.log("Database schema created successfully.");
} catch (error) {
    console.error("Error creating tables:", error.message);
    process.exit(1);
}

db.close((err) => {
    if (err) {
        console.error("Error closing database:", err.message);
    } else {
        console.log("Database connection closed.");
    }
});
