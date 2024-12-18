const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 连接数据库
const db = new sqlite3.Database('./chemicals.db', (err) => {
    if (err) {
        console.error('无法连接数据库:', err.message);
    } else {
        console.log('成功连接到 SQLite 数据库。');
    }
});

// 初始化数据库表
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
`);

// 添加化学品
app.post('/api/addChemical', (req, res) => {
    const { chemicalName, chemicalType, purity, size, quantity, date, recordedBy } = req.body;

    if (!chemicalName || !chemicalType || !purity || !size || !quantity || !date || !recordedBy) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = `
        INSERT INTO chemicals (name, type, purity, size, quantity, date, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [chemicalName, chemicalType, purity, size, quantity, date, recordedBy], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to add chemical' });
        }
        res.status(200).json({ message: 'Chemical added successfully', id: this.lastID });
    });
});

// 获取化学品列表
app.get('/api/chemicals', (req, res) => {
    db.all('SELECT * FROM chemicals', [], (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Failed to fetch chemicals', error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// 删除化学品
app.delete('/api/chemicals/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM chemicals WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to delete chemical' });
        } else if (this.changes === 0) {
            res.status(404).json({ message: 'Chemical not found' });
        } else {
            res.json({ message: 'Chemical deleted successfully' });
        }
    });
});

// 处理根路径
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在运行：http://localhost:${port}`);
});
