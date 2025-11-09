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

// 从config.js文件加载配置数据
function loadConfig() {
    // 直接定义配置数据，避免解析问题
    const config = {
        admin: "黄立荧",
        topics: [
            {
        "id": 1,
        "name": "针对青少年群体（如职业技术院校在校学生），开展未列管易成瘾物质防范技能宣讲"
    },
    {
        "id": 2,
        "name": "在某开发性文化集市中（如农村大集市场景），面向社会大众开展禁毒拒毒宣讲，强识毒、拒毒、防毒能力，推动禁毒社会化服务"
    },
    {
        "id": 3,
        "name": "针对社区居民（重点是青少年家长群体），开展新精神活性物质滥用防范宣讲"
    },
    {
        "id": 4,
        "name": "针对企业、事业群体（如易制毒企业协会成员单位），开展禁毒法治宣讲，净化企事业生产经营环境，打造\"无毒企业"
    },
    {
        "id": 5,
        "name": "针对社区矫正对象群体，结合当前禁毒形势开展一堂禁毒法治教育课"
    },
    {
        "id": 6,
        "name": "针对初中年龄段学生群体，自设情景，自设形式开展禁毒法治宣讲"
    },
    {
        "id": 7,
        "name": "针对农村留守人员，自设情景，自设形式开展禁毒法治宣讲"
    }
        ],
        sequence: [
            { seqNo: 1, name: null, topic: null },
            { seqNo: 2, name: null, topic: null },
            { seqNo: 3, name: null, topic: null },
            { seqNo: 4, name: null, topic: null },
            { seqNo: 5, name: null, topic: null },
            { seqNo: 6, name: null, topic: null },
            { seqNo: 7, name: null, topic: null },
            { seqNo: 8, name: null, topic: null },
            { seqNo: 9, name: null, topic: null },
            { seqNo: 10, name: null, topic: null },
            { seqNo: 11, name: null, topic: null },
            { seqNo: 12, name: null, topic: null },
            { seqNo: 13, name: null, topic: null }
        ]
    };
    
    return config;
}

// 加载初始配置
let config = loadConfig();
let sequence = JSON.parse(JSON.stringify(config.sequence)); // 深拷贝初始序列
let drawnTopics = []; // 已抽取的题目ID集合

// 初始化已抽取题目
function initDrawnTopics() {
    drawnTopics = [];
    sequence.forEach(item => {
        if (item.topic) {
            const topic = config.topics.find(t => t.name === item.topic);
            if (topic) {
                drawnTopics.push(topic.id);
            }
        }
    });
}

// 初始化
initDrawnTopics();


// API: 获取当前sequence
app.get('/api/sequence', (req, res) => {
    res.json(sequence); // 直接返回sequence数组，不包装额外对象
});

// API: 执行抽签
app.post('/api/draw', (req, res) => {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
        return res.status(400).json({ success: false, message: '用户名不能为空' });
    }
    
    // 检查用户是否已经抽过题（要求9）
    const existingUser = sequence.find(item => item.name === username);
    if (existingUser) {
        return res.json({
            success: true,
            message: '用户已抽过题',
            user: existingUser
        });
    }
    
    // 检查是否所有用户都已抽完
    const emptySeqs = sequence.filter(item => item.name === null);
    if (emptySeqs.length === 0) {
        return res.status(400).json({ success: false, message: '所有用户已抽完题目！' });
    }
    
    let result;
    
    // 检查是否为管理员用户
    if (username === config.admin) {
        // 管理员逻辑：抽到第5题，答题序号为10
        const adminSeq = sequence.find(item => item.seqNo === 10);
        if (adminSeq) {
            adminSeq.name = username;
            // 找到第5题
            const adminTopic = config.topics.find(topic => topic.id === 5);
            adminSeq.topic = adminTopic ? adminTopic.name : '';
            drawnTopics.push(5);
            result = adminSeq;
        }
    } else {
        // 普通用户逻辑
        // 1. 随机选择一个空的序号（排除seq=5）
        const availableSeqs = sequence.filter(item => item.name === null && item.seqNo !== 5);
        if (availableSeqs.length > 0) {
            const selectedSeq = availableSeqs[Math.floor(Math.random() * availableSeqs.length)];
            selectedSeq.name = username;
            
            // 2. 从可用题目中随机抽取一个（确保不重复）
            const availableTopics = config.topics.filter(topic => !drawnTopics.includes(topic.id));
            if (availableTopics.length > 0) {
                const selectedTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
                selectedSeq.topic = selectedTopic.name;
                drawnTopics.push(selectedTopic.id);
            } else {
                // 如果所有题目都被抽过，则随机选一个
                const randomTopic = config.topics[Math.floor(Math.random() * config.topics.length)];
                selectedSeq.topic = randomTopic.name;
            }
            
            result = selectedSeq;
        }
    }
    
    if (result) {
        res.json({
            success: true,
            message: '抽签成功',
            user: result
        });
    } else {
        res.status(500).json({ success: false, message: '抽签失败' });
    }
});

// API: 重置抽签结果（POST，用于前端调用）
app.post('/api/reset', (req, res) => {
    try {
        // 重置sequence数据
        sequence = JSON.parse(JSON.stringify(config.sequence)); // 重新从配置深拷贝
        drawnTopics = [];
        
        res.json({
            success: true,
            message: '抽签结果已成功重置！'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: '重置失败',
            error: error.message
        });
    }
});

// API: 重置抽签结果（GET，用于直接访问）
app.get('/reset', (req, res) => {
    try {
        // 重置sequence数据
        sequence = JSON.parse(JSON.stringify(config.sequence)); // 重新从配置深拷贝
        drawnTopics = [];
        
        // 重定向到首页
        res.redirect('/');
    } catch (error) {
        res.status(500).send('重置失败，请稍后重试');
    }
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
    console.log('  GET  /api/sequence - 获取抽签序列');
    console.log('  POST /api/draw - 执行抽签');
    console.log('  POST /api/reset - 重置抽签结果');
    console.log('  GET  /reset - 重置并重定向到首页');
});