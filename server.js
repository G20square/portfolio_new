require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('./database');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Admin Login Route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '12h' });

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 12 * 3600000 // 12 hours
        });

        res.json({ message: 'Logged in successfully' });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/check-auth', authMiddleware, (req, res) => {
    res.json({ authenticated: true, user: req.user.username });
});

// --- Public Data Routes ---

app.get('/api/projects', (req, res) => {
    db.all('SELECT * FROM projects', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/skills', (req, res) => {
    db.all('SELECT * FROM skills', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/certificates', (req, res) => {
    db.all('SELECT * FROM certificates', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Admin Protected Routes (CRUD) ---

// Projects
app.post('/api/projects', authMiddleware, (req, res) => {
    const { title, description, image_url, demo_url, repo_url } = req.body;
    db.run(
        'INSERT INTO projects (title, description, image_url, demo_url, repo_url) VALUES (?, ?, ?, ?, ?)',
        [title, description, image_url, demo_url, repo_url],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, title, description, image_url, demo_url, repo_url });
        }
    );
});

app.delete('/api/projects/:id', authMiddleware, (req, res) => {
    db.run('DELETE FROM projects WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.put('/api/projects/:id', authMiddleware, (req, res) => {
    const { title, description, image_url, demo_url, repo_url } = req.body;
    db.run(
        'UPDATE projects SET title = ?, description = ?, image_url = ?, demo_url = ?, repo_url = ? WHERE id = ?',
        [title, description, image_url, demo_url, repo_url, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// Skills
app.post('/api/skills', authMiddleware, (req, res) => {
    const { name, category, proficiency } = req.body;
    db.run(
        'INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)',
        [name, category, proficiency],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, category, proficiency });
        }
    );
});

app.delete('/api/skills/:id', authMiddleware, (req, res) => {
    db.run('DELETE FROM skills WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.put('/api/skills/:id', authMiddleware, (req, res) => {
    const { name, category, proficiency } = req.body;
    db.run(
        'UPDATE skills SET name = ?, category = ?, proficiency = ? WHERE id = ?',
        [name, category, proficiency, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// Certificates
app.post('/api/certificates', authMiddleware, (req, res) => {
    const { title, issuer, date, url } = req.body;
    db.run(
        'INSERT INTO certificates (title, issuer, date, url) VALUES (?, ?, ?, ?)',
        [title, issuer, date, url],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, title, issuer, date, url });
        }
    );
});

app.delete('/api/certificates/:id', authMiddleware, (req, res) => {
    db.run('DELETE FROM certificates WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.put('/api/certificates/:id', authMiddleware, (req, res) => {
    const { title, issuer, date, url } = req.body;
    db.run(
        'UPDATE certificates SET title = ?, issuer = ?, date = ?, url = ? WHERE id = ?',
        [title, issuer, date, url, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
