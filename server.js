const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');

const corsOptions = {
    origin: '*', // 允许所有来源
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));


// 提供前端文件
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // 假设前端文件放在 `public` 文件夹
});



// PostgreSQL 数据库连接配置
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(bodyParser.json());

// 创建数据库表
const createTables = async () => {
    const orderTableQuery = `
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            chemical VARCHAR(255),
            catalog_number VARCHAR(255),
            size VARCHAR(255),
            quantity INTEGER,
            price FLOAT,
            requested_by VARCHAR(255),
            website TEXT
        );
    `;
    const chemicalTableQuery = `
        CREATE TABLE IF NOT EXISTS registered_chemicals (
            id SERIAL PRIMARY KEY,
            chemical_name VARCHAR(255),
            chemical_type VARCHAR(50),
            purity VARCHAR(50),
            size VARCHAR(50),
            quantity INTEGER,
            date DATE,
            recorded_by VARCHAR(255)
        );
    `;
    await pool.query(orderTableQuery);
    await pool.query(chemicalTableQuery);
};
createTables().catch(err => console.error('Error creating tables:', err));

// 添加订单
app.post('/api/addOrder', async (req, res) => {
    const { chemical, catalogNumber, size, quantity, price, requestedBy, website } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO orders (chemical, catalog_number, size, quantity, price, requested_by, website) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [chemical, catalogNumber, size, quantity, price, requestedBy, website]
        );
        res.status(201).json({ message: 'Order added successfully!', order: result.rows[0] });
    } catch (err) {
        console.error('Error adding order:', err);
        res.status(500).json({ error: 'Failed to add order.' });
    }
});

// 获取所有订单
app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

// 删除订单
app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        res.json({ message: 'Order deleted successfully!' });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ error: 'Failed to delete order.' });
    }
});

// 添加化学品
app.post('/api/addChemical', async (req, res) => {
    const { chemicalName, chemicalType, purity, size, quantity, date, recordedBy } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO registered_chemicals (chemical_name, chemical_type, purity, size, quantity, date, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [chemicalName, chemicalType, purity, size, quantity, date, recordedBy]
        );
        res.status(201).json({ message: 'Chemical registered successfully!', chemical: result.rows[0] });
    } catch (err) {
        console.error('Error registering chemical:', err);
        res.status(500).json({ error: 'Failed to register chemical.' });
    }
});

// 获取所有化学品
app.get('/api/registeredChemicals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM registered_chemicals');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching chemicals:', err);
        res.status(500).json({ error: 'Failed to fetch chemicals.' });
    }
});

// 删除所有化学品
app.delete('/api/registeredChemicals', async (req, res) => {
    try {
        await pool.query('DELETE FROM registered_chemicals');
        res.json({ message: 'All chemicals deleted successfully!' });
    } catch (err) {
        console.error('Error deleting all chemicals:', err);
        res.status(500).json({ error: 'Failed to delete all chemicals.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
