const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// 使用中间件
app.use(cors());
app.use(bodyParser.json());

// 初始化数据库
const db = new sqlite3.Database('./chemicals.db', (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// 创建表（如果不存在）
db.run(`
    CREATE TABLE IF NOT EXISTS chemicals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chemicalName TEXT,
        chemicalType TEXT,
        purity TEXT,
        size TEXT,
        quantity INTEGER,
        date TEXT,
        recordedBy TEXT
    )
`);

// 添加化学试剂
app.post('/api/addChemical', (req, res) => {
    const { chemicalName, chemicalType, purity, size, quantity, date, recordedBy } = req.body;

    const query = `INSERT INTO chemicals (chemicalName, chemicalType, purity, size, quantity, date, recordedBy)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [chemicalName, chemicalType, purity, size, quantity, date, recordedBy], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Chemical added successfully!' });
    });
});

// 获取所有化学试剂
app.get('/api/chemicals', (req, res) => {
    db.all(`SELECT * FROM chemicals`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 删除化学试剂
app.delete('/api/chemicals/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM chemicals WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Chemical deleted successfully!' });
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
