const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 启用CORS，配置更灵活的选项以允许所有来源
app.use(cors({
    origin: '*', // 允许所有来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 处理预检请求
app.options('*', cors());

// 解析JSON请求体
app.use(express.json());


// 提供简单的健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '服务器运行正常'
    });
});

// 兜底路由处理：对于未匹配的API路径，返回404错误而不是HTML
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API端点不存在',
        path: req.path,
        message: '请检查API路径是否正确'
    });
});

// 提供静态文件服务，使用绝对路径
const staticPath = path.resolve(__dirname);
console.log(`静态文件路径: ${staticPath}`);
app.use(express.static(staticPath));

// 对于非API路径，尝试提供index.html（支持SPA路由）
app.get('*', (req, res) => {
    // 确保不是API请求
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'API端点不存在',
            path: req.path
        });
    }
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('文件不存在');
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('API端点:');
    console.log('  GET  /api/health - 健康检查');
});