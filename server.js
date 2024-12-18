// 引入所需模块
const express = require('express');      // 引入 Express 框架
const sqlite3 = require('sqlite3').verbose(); // 引入 SQLite3 数据库
const bodyParser = require('body-parser'); // 引入 body-parser 解析请求数据
const cors = require('cors');            // 引入 CORS 中间件
const path = require('path');            // 引入 path 模块，用于处理文件路径

const app = express();                  // 创建 Express 实例
const port = process.env.PORT || 4000;  // 动态设置服务器端口号（适用于 Render 等云服务）

// 使用中间件
app.use(cors()); // 允许跨域请求
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 设置静态文件目录，指向前端代码所在的 public 文件夹
app.use(express.static(path.join(__dirname, 'public')));

// 连接 SQLite 数据库（如果不存在会自动创建）
const db = new sqlite3.Database('./chemicals.db', (err) => {
    if (err) {
        console.error('无法连接数据库:', err.message);
    } else {
        console.log('成功连接到 SQLite 数据库。');
    }
});

// 初始化数据库表格
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

// 路由：添加化学品信息
app.post('/api/addChemical', (req, res) => {
    const { chemicalName, chemicalType, purity, size, quantity, date, recordedBy } = req.body;

    // 检查是否缺少字段
    if (!chemicalName || !chemicalType || !purity || !size || !quantity || !date || !recordedBy) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // 插入到数据库
    const sql = `
        INSERT INTO chemicals (chemicalName, chemicalType, purity, size, quantity, date, recordedBy)
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


// 路由：获取所有化学品数据
app.get('/chemicals', (req, res) => {
    db.all('SELECT * FROM chemicals', [], (err, rows) => {
        if (err) {
            res.status(500).send('Failed to obtain data：' + err.message);
        } else {
            res.json(rows);
        }
    });
});

// 路由：处理根路径 `/`
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在运行：http://localhost:${port}`);
});
