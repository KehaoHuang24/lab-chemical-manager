// Import necessary modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('./chemicals.db', (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Successfully connected to the SQLite database.');
    }
});

// Create database table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS chemicals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        purity TEXT,
        size TEXT,
        quantity INTEGER,
        date TEXT,
        recorded_by TEXT
    )
`, (err) => {
    if (err) {
        console.error('Failed to create database table:', err.message);
    } else {
        console.log('Database table is ready.');
    }
});

// API Endpoints

// 1. Add a new chemical
app.post('/api/addChemical', (req, res) => {
    const { chemicalName, chemicalType, purity, size, quantity, date, recordedBy } = req.body;

    // Validate fields
    if (!chemicalName || !chemicalType || !purity || !size || !quantity || !date || !recordedBy) {
        return res.status(400).json({ message: 'Missing required fields. Please fill out all fields.' });
    }

    // Insert into the database
    const sql = `
        INSERT INTO chemicals (name, type, purity, size, quantity, date, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [chemicalName, chemicalType, purity, size, quantity, date, recordedBy], function (err) {
        if (err) {
            console.error('Failed to add chemical:', err.message);
            return res.status(500).json({ message: 'Internal server error. Could not add chemical.' });
        }
        res.status(200).json({ message: 'Chemical added successfully!', id: this.lastID });
    });
});

// 2. Get all chemicals
app.get('/api/chemicals', (req, res) => {
    const sql = `
        SELECT * FROM chemicals
        ORDER BY 
            CASE
                WHEN name GLOB '[A-Za-z]*' THEN 1
                WHEN name GLOB '[0-9]*' THEN 2
                ELSE 3
            END, 
            name COLLATE NOCASE
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Failed to fetch chemicals:', err.message);
            return res.status(500).json({ message: 'Internal server error. Could not fetch chemicals.' });
        }
        res.status(200).json(rows);
    });
});

// 3. Delete a chemical
app.delete('/api/chemicals/:id', (req, res) => {
    const { id } = req.params;

    // Delete the chemical by ID
    const sql = `DELETE FROM chemicals WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            console.error('Failed to delete chemical:', err.message);
            return res.status(500).json({ message: 'Internal server error. Could not delete chemical.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Chemical not found.' });
        }

        res.status(200).json({ message: 'Chemical deleted successfully!' });
    });
});

// 4. Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});