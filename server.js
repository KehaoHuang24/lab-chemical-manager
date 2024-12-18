// 引入所需模块
const express = require('express');      // 引入 Express 框架
const sqlite3 = require('sqlite3').verbose(); // 引入 SQLite3 数据库
const bodyParser = require('body-parser'); // 引入 body-parser 解析请求数据
const app = express();                  // 创建 Express 实例
const port = 3000;                      // 设置服务器端口号

// 使用 body-parser 中间件解析 JSON 数据
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
app.post('/add-chemical', (req, res) => {
    const { name, type, purity, size, quantity, date, recorded_by } = req.body;
    const query = `INSERT INTO chemicals (name, type, purity, size, quantity, date, recorded_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [name, type, purity, size, quantity, date, recorded_by], function(err) {
        if (err) {
            res.status(500).send('添加失败：' + err.message);
        } else {
            res.status(200).send('化学品添加成功！');
        }
    });
});

// 路由：获取所有化学品数据
app.get('/chemicals', (req, res) => {
    db.all('SELECT * FROM chemicals', [], (err, rows) => {
        if (err) {
            res.status(500).send('获取数据失败：' + err.message);
        } else {
            res.json(rows);
        }
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在运行：http://localhost:${port}`);
});
