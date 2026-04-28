const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.join(__dirname, "yuka.db"));

db.exec(`
    CREATE TABLE IF NOT EXISTS schedule (
        day_of_week TEXT NOT NULL,
        time        TEXT NOT NULL,
        max_orders  INTEGER DEFAULT 3,
        PRIMARY KEY (day_of_week, time)
    );
        
    CREATE TABLE IF NOT EXISTS bookings (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        date     TEXT NOT NULL,  -- '2026-05-02'
        time     TEXT NOT NULL, -- '10:00 AM'
        order_id TEXT
    );
`);

module.exports = db;