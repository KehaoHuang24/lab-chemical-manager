require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
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
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    // 使用 Supabase 的 SQL 执行方法
    await supabase.rpc('execute_sql', { sql: orderTableQuery });
    await supabase.rpc('execute_sql', { sql: chemicalTableQuery });
};
createTables().catch(err => console.error('Error creating tables:', err));

// 添加订单
app.post('/api/addOrder', async (req, res) => {
    const { chemical, catalogNumber, size, quantity, price, requestedBy, website } = req.body;
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([
                { chemical, catalog_number: catalogNumber, size, quantity, price, requested_by: requestedBy, website }
            ])
            .select(); // 确保返回插入的记录

        if (error) throw error;

        console.log('Inserted Data:', data); // 打印插入的数据
        res.status(201).json({ message: 'Order added successfully!', order: data[0] });
    } catch (err) {
        console.error('Error adding order:', err);
        res.status(500).json({ error: 'Failed to add order.' });
    }
   
});


// 获取所有订单
app.get('/api/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*');

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

// 删除订单
app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Order deleted successfully!' });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ error: 'Failed to delete order.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);


    
});
