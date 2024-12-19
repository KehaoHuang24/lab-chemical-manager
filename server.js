// Import necessary modules
const express = require('express');
const { Pool } = require('pg');
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

// PostgreSQL Database Configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Render PostgreSQL environment variable
    ssl: {
        rejectUnauthorized: false, // Required for Render PostgreSQL
    },
});

// Initialize Database Table
pool.query(`
    CREATE TABLE IF NOT EXISTS chemicals (
        id SERIAL PRIMARY KEY,
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

// Add a new chemical
app.post('/api/addChemical', async (req, res) => {
    const { chemicalName, chemicalType, purity, size, quantity, date, recordedBy } = req.body;

    if (!chemicalName || !chemicalType || !purity || !size || !quantity || !date || !recordedBy) {
        return res.status(400).json({ message: 'Missing required fields. Please fill out all fields.' });
    }

    try {
        await pool.query(
            `INSERT INTO chemicals (name, type, purity, size, quantity, date, recorded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [chemicalName, chemicalType, purity, size, quantity, date, recordedBy]
        );
        res.json({ message: 'Chemical added successfully!' });
    } catch (err) {
        console.error('Error adding chemical:', err.message);
        res.status(500).json({ message: 'Error adding chemical.' });
    }
});

// Get all chemicals
app.get('/api/chemicals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM chemicals');
        res.json(result.rows);
    } catch (err) {
        console.error('Error retrieving chemicals:', err.message);
        res.status(500).json({ message: 'Error retrieving chemicals.' });
    }
});

// Delete a chemical
app.delete('/api/chemicals/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM chemicals WHERE id = $1', [id]);
        res.json({ message: 'Chemical deleted successfully!' });
    } catch (err) {
        console.error('Error deleting chemical:', err.message);
        res.status(500).json({ message: 'Error deleting chemical.' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
