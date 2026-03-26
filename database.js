const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'portfolio.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDB();
    }
});

function initializeDB() {
    db.serialize(() => {
        // Users table (Admins)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        // Projects table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            image_url TEXT,
            demo_url TEXT,
            repo_url TEXT
        )`);

        // Skills table
        db.run(`CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category TEXT,
            proficiency INTEGER
        )`);

        // Certificates table
        db.run(`CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            issuer TEXT,
            date TEXT,
            url TEXT
        )`);

        // Insert default admin if not exists
        db.get("SELECT id FROM users WHERE username = ?", ['gauth'], (err, row) => {
            if (!row) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync('123', salt);
                db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['gauth', hash], (err) => {
                    if (!err) {
                        console.log('Default admin created (username: gauth, password: 123)');
                    }
                });
            }
        });
    });
}

module.exports = db;
