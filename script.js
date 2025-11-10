// 全局变量存储当前抽取的用户和结果
let currentUserName = '';
let drawnTopics = []; // 已抽取的题目ID集合
// 本地存储sequence数据
let sequence = [];
// 本地存储topics数据
const topics = [
    { id: 1, name: "针对青少年群体（如职业技术院校在校学生），开展未列管易成瘾物质防范技能宣讲" },
    { id: 2, name: "在某开发性文化集市中（如农村大集市场景），面向社会大众开展禁毒拒毒宣讲，强识毒、拒毒、防毒能力，推动禁毒社会化服务" },
    { id: 3, name: "针对社区居民（重点是青少年家长群体），开展新精神活性物质滥用防范宣讲" },
    { id: 4, name: "针对企业、事业群体（如易制毒企业协会成员单位），开展禁毒法治宣讲，净化企事业生产经营环境，打造\"无毒企业\"" },
    { id: 5, name: "针对社区矫正对象群体，结合当前禁毒形势开展一堂禁毒法治教育课" },
    { id: 6, name: "针对初中年龄段学生群体，自设情景，自设形式开展禁毒法治宣讲" },
    { id: 7, name: "针对农村留守人员，自设情景，自设形式开展禁毒法治宣讲" }
];
const MAX_SEQUENCE = 13; // 最大序号数

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
    // 从本地存储加载数据
    loadDataFromLocalStorage();
}

// 从本地存储加载数据
function loadDataFromLocalStorage() {
    try {
        console.log('尝试从本地存储加载数据...');
        const savedSequence = localStorage.getItem('drawSequence');
        
        if (savedSequence) {
            sequence = JSON.parse(savedSequence);
            console.log('成功从本地存储加载数据:', sequence);
        } else {
            // 初始化空的sequence数组
            sequence = Array.from({ length: MAX_SEQUENCE }, (_, i) => ({
                seqNo: i + 1,
                name: null,
                topic: null
            }));
            console.log('初始化新的sequence数据');
            // 保存到本地存储
            saveDataToLocalStorage();
        }
        
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
        console.error('从本地存储加载数据失败:', error.message);
        // 初始化空的sequence数组
        sequence = Array.from({ length: MAX_SEQUENCE }, (_, i) => ({
            seqNo: i + 1,
            name: null,
            topic: null
        }));
        saveDataToLocalStorage();
        renderResultsList();
        return true;
    }
}

// 保存数据到本地存储
function saveDataToLocalStorage() {
    try {
        localStorage.setItem('drawSequence', JSON.stringify(sequence));
        console.log('数据已保存到本地存储');
    } catch (error) {
        console.error('保存数据到本地存储失败:', error.message);
    }
}

// 重置抽签功能
function resetDraw() {
    // 确认重置操作
    if (confirm('确定要重置所有抽签结果吗？此操作不可撤销。')) {
        try {
            console.log('执行本地重置抽签...');
            
            // 重置sequence数组
            sequence = Array.from({ length: MAX_SEQUENCE }, (_, i) => ({
                seqNo: i + 1,
                name: null,
                topic: null
            }));
            
            // 重置drawnTopics数组
            drawnTopics = [];
            
            // 保存到本地存储
            saveDataToLocalStorage();
            
            // 更新界面
            renderResultsList();
            
            alert('重置成功！');
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
async function startDrawingAnimation() {
    try {
        console.log('开始抽签动画...');
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
                setTimeout(() => {
                    // 执行实际抽签并获取结果
                    const result = performDraw();
                    
                    // 如果有抽签结果，直接在卡片上显示
                        if (result && result.success) {
                            console.log('在抽签卡片上显示最终结果');
                            
                            // 获取模态框内容元素
                            const modalContent = drawingModal.querySelector('.modal-content');
                            
                            // 更新模态框标题
                            const modalTitle = modalContent.querySelector('h3');
                            modalTitle.textContent = '抽签结果';
                            modalTitle.style.color = '#293241';
                            modalTitle.style.fontSize = '24px';
                            
                            // 更新动画区域样式
                            const drawingAnimation = modalContent.querySelector('.drawing-animation');
                            drawingAnimation.style.textAlign = 'center';
                            drawingAnimation.style.padding = '20px';
                            drawingAnimation.style.backgroundColor = '#f7f7f7';
                            drawingAnimation.style.borderRadius = '8px';
                            drawingAnimation.style.margin = '20px 0';
                            
                            // 更新结果文本和样式
                            const seqLabel = drawingSeq.parentNode;
                            const topicLabel = drawingTopic.parentNode;
                            
                            seqLabel.style.display = 'block';
                            seqLabel.style.margin = '10px 0';
                            seqLabel.style.fontSize = '18px';
                            seqLabel.style.color = '#293241';
                            
                            topicLabel.style.display = 'block';
                            topicLabel.style.margin = '10px 0';
                            topicLabel.style.fontSize = '18px';
                            topicLabel.style.color = '#293241';
                            
                            // 设置结果值
                            drawingSeq.textContent = result.user.seqNo;
                            drawingTopic.textContent = result.user.topic;
                            
                            // 更新结果值样式，使其更醒目
                            drawingSeq.style.fontSize = '28px';
                            drawingSeq.style.fontWeight = 'bold';
                            drawingSeq.style.color = '#ff6b35';
                            drawingSeq.style.marginLeft = '10px';
                            
                            drawingTopic.style.fontSize = '22px';
                            drawingTopic.style.fontWeight = 'bold';
                            drawingTopic.style.color = '#457b9d';
                            drawingTopic.style.marginLeft = '10px';
                            drawingTopic.style.wordWrap = 'break-word';
                            drawingTopic.style.maxWidth = '90%';
                            
                            // 添加结果确认按钮
                            
                            // 移除已有的确认按钮（如果有）
                            const existingConfirmBtn = modalContent.querySelector('#result-confirm-btn');
                            if (existingConfirmBtn) {
                                existingConfirmBtn.remove();
                            }
                            
                            // 创建确认按钮
                            const confirmBtn = document.createElement('button');
                            confirmBtn.id = 'result-confirm-btn';
                            confirmBtn.textContent = '确认结果';
                            confirmBtn.style.cssText = `
                                margin-top: 20px;
                                padding: 12px 30px;
                                background-color: #4ecdc4;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-size: 18px;
                                font-weight: bold;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                outline: none;
                            `;
                            
                            // 添加悬停效果
                            confirmBtn.addEventListener('mouseover', () => {
                                confirmBtn.style.backgroundColor = '#45b7aa';
                                confirmBtn.style.transform = 'scale(1.05)';
                            });
                            
                            confirmBtn.addEventListener('mouseout', () => {
                                confirmBtn.style.backgroundColor = '#4ecdc4';
                                confirmBtn.style.transform = 'scale(1)';
                            });
                            
                            // 添加点击事件
                            confirmBtn.addEventListener('click', () => {
                                drawingModal.style.display = 'none';
                                // 重置所有样式
                                modalTitle.textContent = '抽签中...';
                                modalTitle.style.cssText = '';
                                drawingAnimation.style.cssText = '';
                                seqLabel.style.cssText = '';
                                topicLabel.style.cssText = '';
                                drawingSeq.style.cssText = '';
                                drawingTopic.style.cssText = '';
                            });
                            
                            // 添加按钮到模态框底部中央
                            confirmBtn.style.display = 'block';
                            confirmBtn.style.marginLeft = 'auto';
                            confirmBtn.style.marginRight = 'auto';
                            modalContent.appendChild(confirmBtn);
                    } else {
                        // 如果没有成功结果，隐藏弹窗
                        drawingModal.style.display = 'none';
                    }
                }, 300);
            }
        }, 100);
    } catch (error) {
        console.error('抽签动画失败:', error.message);
        console.error('错误详情:', error);
        alert('抽签过程中发生错误，请重试。');
        
        // 隐藏抽签动画弹窗
        drawingModal.style.display = 'none';
    }
}

// 执行抽签逻辑
function performDraw() {
    try {
        console.log('执行本地抽签逻辑...');
        
        // 检查是否已存在同名用户
        const existingUser = sequence.find(item => item.name === currentUserName);
        if (existingUser) {
            alert('该用户已参与抽签！');
            return { success: false, message: '该用户已参与抽签' };
        }
        
        // 找出未抽签的序号
        const emptySeqs = sequence.filter(item => item.name === null);
        if (emptySeqs.length === 0) {
            alert('所有序号已分配完毕！');
            return { success: false, message: '所有序号已分配完毕' };
        }
        
        // 随机选择一个未抽签的序号
        const randomIndex = Math.floor(Math.random() * emptySeqs.length);
        const selectedSeq = emptySeqs[randomIndex];
        
        // 找出未抽取的题目
        const availableTopics = topics.filter(topic => !drawnTopics.includes(topic.id));
        let selectedTopic;
        
        if (availableTopics.length > 0) {
            // 如果还有未抽取的题目，随机选择一个
            const topicIndex = Math.floor(Math.random() * availableTopics.length);
            selectedTopic = availableTopics[topicIndex];
            drawnTopics.push(selectedTopic.id);
        } else {
            // 如果所有题目都已抽取，随机选择一个题目
            const topicIndex = Math.floor(Math.random() * topics.length);
            selectedTopic = topics[topicIndex];
        }
        
        // 更新sequence
        const seqIndex = sequence.findIndex(item => item.seqNo === selectedSeq.seqNo);
        sequence[seqIndex] = {
            seqNo: selectedSeq.seqNo,
            name: currentUserName,
            topic: selectedTopic.name
        };
        
        // 保存到本地存储
        saveDataToLocalStorage();
        
        // 更新界面
        renderResultsList();
        
        console.log('抽签成功:', { seqNo: selectedSeq.seqNo, name: currentUserName, topic: selectedTopic.name });
        
        // 返回结果
        return {
            success: true,
            user: {
                seqNo: selectedSeq.seqNo,
                name: currentUserName,
                topic: selectedTopic.name
            }
        };
    } catch (error) {
        console.error('抽签操作失败:', error.message);
        console.error('错误详情:', error);
        alert('抽签失败，请重试。错误: ' + error.message);
        // 返回错误结果
        return { success: false, error: error.message };
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

// 不再需要定期刷新数据，因为现在是本地存储

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);