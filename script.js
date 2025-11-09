// 全局变量存储当前抽取的用户和结果
let currentUserName = '';
let drawnTopics = []; // 已抽取的题目ID集合
const API_BASE_URL = ''; // 服务器API基础URL（当前域名下）

// DOM元素
const drawBtn = document.getElementById('draw-btn');
const resetBtn = document.getElementById('reset-btn');
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('name-input');
const cancelBtn = document.getElementById('cancel-btn');
const confirmBtn = document.getElementById('confirm-btn');
const drawingModal = document.getElementById('drawing-modal');
const drawingSeq = document.getElementById('drawing-seq');
const drawingTopic = document.getElementById('drawing-topic');
const topicsList = document.getElementById('topics-list');
const resultsList = document.getElementById('results-list');

// 初始化函数
function init() {
    renderTopicsList();
    setupEventListeners();
    // 从服务器加载数据
    loadDataFromServer();
}

// 从服务器加载数据
async function loadDataFromServer() {
    try {
        console.log('尝试从服务器加载数据...');
        const endpoint = `${API_BASE_URL}/api/sequence`;
        console.log(`请求URL: ${endpoint}`);
        
        const response = await fetch(endpoint);
        console.log(`响应状态: ${response.status}`);
        
        // 检查响应是否成功
        if (!response.ok) {
            console.error(`HTTP错误: ${response.status} ${response.statusText}`);
            
            // 尝试获取错误响应内容
            let errorBody;
            try {
                // 尝试以JSON格式解析
                errorBody = await response.json();
                throw new Error(`服务器返回错误: ${errorBody.error || errorBody.message || response.statusText}`);
            } catch (jsonError) {
                // 如果不是JSON，获取文本内容预览
                const textContent = await response.text();
                const preview = textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '');
                throw new Error(`服务器返回错误状态: ${response.status}，内容: ${preview}`);
            }
        }
        
        // 安全处理JSON解析
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // 如果不是JSON响应，获取内容并提示
            const nonJsonContent = await response.text();
            const preview = nonJsonContent.substring(0, 100) + (nonJsonContent.length > 100 ? '...' : '');
            console.error('期望JSON响应，但收到其他类型:', contentType);
            console.error('响应内容预览:', preview);
            throw new Error(`收到非JSON响应，请检查API地址配置`);
        }
        
        // 现在服务器直接返回sequence数组
        const serverSequence = await response.json();
        console.log('成功获取数据:', serverSequence);
        
        // 确保返回的数据是数组
        if (!Array.isArray(serverSequence)) {
            throw new Error('服务器返回的数据格式错误，期望数组');
        }
        
        // 更新全局数据
        // 清空sequence数组，准备更新
        sequence.length = 0;
        // 直接使用服务器返回的sequence数据
        serverSequence.forEach(serverItem => {
            sequence.push({
                seqNo: serverItem.seqNo,
                name: serverItem.name,
                topic: serverItem.topic
            });
        });
        
        // 重新计算drawnTopics
        drawnTopics = [];
        sequence.forEach(item => {
            if (item.topic) {
                // 查找对应的topic ID
                const topic = topics.find(t => t.name === item.topic);
                if (topic) {
                    drawnTopics.push(topic.id);
                }
            }
        });
        
        // 更新界面
        renderResultsList();
        return true;
    } catch (error) {
        console.error('从服务器加载数据失败:', error.message);
        console.error('错误详情:', error);
        
        // 针对HTML响应的特殊处理
        if (error.message.includes('Unexpected token') || error.message.includes('<!DOCTYPE')) {
            alert('加载数据失败，收到HTML而非JSON响应。请检查API路径配置。错误: ' + error.message.substring(0, 150));
        } else {
            alert('加载数据失败，请刷新页面重试。错误: ' + error.message);
        }
        return false;
    }
}

// 重置抽签功能
async function resetDraw() {
    // 确认重置操作
    if (confirm('确定要重置所有抽签结果吗？此操作不可撤销。')) {
        try {
            console.log('执行重置抽签...');
            const endpoint = `${API_BASE_URL}/api/reset`;
            console.log(`请求URL: ${endpoint}`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`响应状态: ${response.status}`);
            
            // 检查响应是否成功
            if (!response.ok) {
                console.error(`HTTP错误: ${response.status} ${response.statusText}`);
                throw new Error(`服务器返回错误状态: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('重置结果:', result);
            
            if (result.success) {
                // 重新加载数据
                await loadDataFromServer();
                alert(result.message);
            } else {
                console.error('重置失败响应:', result.message);
                alert('重置失败: ' + result.message);
            }
        } catch (error) {
            console.error('重置操作失败:', error.message);
            console.error('错误详情:', error);
            alert('重置失败，请重试。错误: ' + error.message);
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 抽签按钮点击事件
    drawBtn.addEventListener('click', () => {
        // 检查是否所有用户都已抽完
        const emptySeqs = sequence.filter(item => item.name === null);
        if (emptySeqs.length === 0) {
            alert('所有用户已抽完题目！');
            return;
        }
        
        // 显示姓名输入弹窗
        nameModal.style.display = 'flex';
        nameInput.value = '';
        confirmBtn.disabled = true;
        nameInput.focus();
    });
    
    // 重置按钮点击事件
    resetBtn.addEventListener('click', resetDraw);
    
    // 姓名输入事件
    nameInput.addEventListener('input', () => {
        confirmBtn.disabled = nameInput.value.trim() === '';
    });
    
    // 取消按钮点击事件
    cancelBtn.addEventListener('click', () => {
        nameModal.style.display = 'none';
    });
    
    // 确认按钮点击事件
    confirmBtn.addEventListener('click', () => {
        currentUserName = nameInput.value.trim();
        nameModal.style.display = 'none';
        
        // 显示抽签动画
        startDrawingAnimation();
    });
    
    // 点击模态框外部关闭
    nameModal.addEventListener('click', (e) => {
        if (e.target === nameModal) {
            nameModal.style.display = 'none';
        }
    });
    
    // 点击模态框外部关闭
    drawingModal.addEventListener('click', (e) => {
        if (e.target === drawingModal) {
            drawingModal.style.display = 'none';
        }
    });
}

// 开始抽签动画
function startDrawingAnimation() {
    drawingModal.style.display = 'flex';
    
    // 模拟抽签动画效果
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
        iterations++;
        
        // 随机显示一些序号和题目
        const randomSeq = Math.floor(Math.random() * 13) + 1;
        const randomTopic = topics[Math.floor(Math.random() * topics.length)].name;
        
        drawingSeq.textContent = randomSeq;
        drawingTopic.textContent = randomTopic;
        
        // 动画结束，执行实际抽签
        if (iterations >= maxIterations) {
            clearInterval(interval);
            setTimeout(async () => {
                await performDraw();
                drawingModal.style.display = 'none';
            }, 300);
        }
    }, 100);
}

// 执行抽签逻辑
async function performDraw() {
    try {
        console.log('执行抽签逻辑...');
        const endpoint = `${API_BASE_URL}/api/draw`;
        console.log(`请求URL: ${endpoint}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: currentUserName })
        });
        
        console.log(`响应状态: ${response.status}`);
        
        // 检查响应是否成功
        if (!response.ok) {
            console.error(`HTTP错误: ${response.status} ${response.statusText}`);
            throw new Error(`服务器返回错误状态: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('抽签结果:', result);
        
        if (result.success) {
            // 重新加载数据
            await loadDataFromServer();
            
            // 显示抽签结果提示
            const message = result.message.includes('已抽过题') ? 
                `${currentUserName}，您已经抽过题了！\n序号: ${result.user.seqNo}\n题目: ${result.user.topic}` : 
                `${currentUserName}，您的抽签结果：\n序号: ${result.user.seqNo}\n题目: ${result.user.topic}`;
            
            alert(message);
            
            // 隐藏抽题区
            const drawSection = document.querySelector('.draw-section');
            if (drawSection) {
                drawSection.style.display = 'none';
                console.log('抽题区已隐藏');
            }
        } else {
            console.error('抽签失败响应:', result.message);
            alert('抽签失败: ' + result.message);
        }
    } catch (error) {
        console.error('抽签操作失败:', error.message);
        console.error('错误详情:', error);
        alert('抽签失败，请重试。错误: ' + error.message);
    }
}

// 渲染题目列表
function renderTopicsList() {
    topicsList.innerHTML = '';
    topics.forEach(topic => {
        const topicItem = document.createElement('div');
        topicItem.className = 'topic-item';
        topicItem.textContent = `${topic.id}. ${topic.name}`;
        topicsList.appendChild(topicItem);
    });
}

// 渲染抽签结果列表
function renderResultsList() {
    resultsList.innerHTML = '';
    
    // 按序号排序
    const sortedResults = [...sequence].sort((a, b) => a.seqNo - b.seqNo);
    
    sortedResults.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${item.name ? 'drawn' : 'undrawn'}`;
        
        if (item.name) {
            resultItem.textContent = `序号: ${item.seqNo}, 姓名: ${item.name}, 题目: ${item.topic}`;
        } else {
            resultItem.textContent = `序号: ${item.seqNo}, 待抽签`;
        }
        
        resultsList.appendChild(resultItem);
    });
}

// 定期刷新数据，确保多用户同步
setInterval(loadDataFromServer, 5000); // 每5秒刷新一次

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);