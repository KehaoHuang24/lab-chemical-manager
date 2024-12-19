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

// Initialize Database Tables
const initTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                chemical TEXT NOT NULL,
                catalog_number TEXT NOT NULL,
                size TEXT,
                quantity INTEGER,
                price NUMERIC,
                requested_by TEXT,
                website TEXT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS registered_chemicals (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                purity TEXT,
                size TEXT,
                quantity INTEGER,
                date TEXT,
                recorded_by TEXT
            )
        `);

        console.log('Database tables are ready.');
    } catch (err) {
        console.error('Failed to create database tables:', err.message);
    }
};
initTables();

// API Endpoints

// Add a new order
app.post('/api/addOrder', async (req, res) => {
    const { chemical, catalogNumber, size, quantity, price, requestedBy, website } = req.body;

    if (!chemical || !catalogNumber || !size || !quantity || !price || !requestedBy || !website) {
        return res.status(400).json({ message: 'Missing required fields. Please fill out all fields.' });
    }

    try {
        await pool.query(
            `INSERT INTO orders (chemical, catalog_number, size, quantity, price, requested_by, website)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [chemical, catalogNumber, size, quantity, price, requestedBy, website]
        );
        res.json({ message: 'Order added successfully!' });
    } catch (err) {
        console.error('Error adding order:', err.message);
        res.status(500).json({ message: 'Error adding order.' });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders');
        res.json(result.rows);
    } catch (err) {
        console.error('Error retrieving orders:', err.message);
        res.status(500).json({ message: 'Error retrieving orders.' });
    }
});


// Add a registered chemical
app.post('/api/addRegisteredChemical', async (req, res) => {
    const { name, type, purity, size, quantity, date, recordedBy } = req.body;

    if (!name || !type || !purity || !size || !quantity || !date || !recordedBy) {
        return res.status(400).json({ message: 'Missing required fields. Please fill out all fields.' });
    }

    try {
        await pool.query(
            `INSERT INTO registered_chemicals (name, type, purity, size, quantity, date, recorded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, type, purity, size, quantity, date, recordedBy]
        );
        res.json({ message: 'Registered chemical added successfully!' });
    } catch (err) {
        console.error('Error adding registered chemical:', err.message);
        res.status(500).json({ message: 'Error adding registered chemical.' });
    }
});

// Get all registered chemicals
app.get('/api/registeredChemicals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM registered_chemicals');
        res.json(result.rows);
    } catch (err) {
        console.error('Error retrieving registered chemicals:', err.message);
        res.status(500).json({ message: 'Error retrieving registered chemicals.' });
    }
});

// Delete an order
app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        res.json({ message: 'Order deleted successfully!' });
    } catch (err) {
        console.error('Error deleting order:', err.message);
        res.status(500).json({ message: 'Error deleting order.' });
    }
});

// Delete a registered chemical
app.delete('/api/registeredChemicals/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM registered_chemicals WHERE id = $1', [id]);
        res.json({ message: 'Registered chemical deleted successfully!' });
    } catch (err) {
        console.error('Error deleting registered chemical:', err.message);
        res.status(500).json({ message: 'Error deleting registered chemical.' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
