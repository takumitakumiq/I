// DOM要素の取得
const diaryContent = document.getElementById('diary-content');
const submitBtn = document.getElementById('submit-btn');
const loading = document.getElementById('loading');
const diaryList = document.getElementById('diary-list');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const charCount = document.getElementById('char-count');
const tagsInput = document.getElementById('tags-input');
const tagsDisplay = document.getElementById('tags-display');

// グローバル変数
let allDiaries = [];
let currentFilter = 'all';
let currentTags = [];

// ページ読み込み時に日記一覧を取得
document.addEventListener('DOMContentLoaded', () => {
    loadDiaries();
    initializeEventListeners();
});

// イベントリスナーの初期化
function initializeEventListeners() {
    // 検索
    searchInput.addEventListener('input', filterDiaries);
    
    // フィルター
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            filterDiaries();
        });
    });
    
    // 並び替え
    sortSelect.addEventListener('change', filterDiaries);
    
    // 文字数カウント
    diaryContent.addEventListener('input', () => {
        charCount.textContent = `${diaryContent.value.length} 文字`;
    });
    
    // タグ入力
    tagsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagsInput.value.trim());
            tagsInput.value = '';
        }
    });
    
    // 音声入力
    document.getElementById('voice-btn').addEventListener('click', startVoiceInput);
    
    // 絵文字選択
    document.getElementById('emoji-btn').addEventListener('click', openEmojiModal);
    
    // AI提案
    document.getElementById('suggest-btn').addEventListener('click', getAISuggestion);
    
    // エクスポート
    document.getElementById('export-btn').addEventListener('click', exportDiaries);
    
    // インポート
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', importDiaries);
    
    // グラフ表示切り替え
    const toggleChartsBtn = document.getElementById('toggle-charts');
    if (toggleChartsBtn) {
        toggleChartsBtn.addEventListener('click', () => {
            const chartsContainer = document.getElementById('charts-container');
            if (chartsContainer.style.display === 'none') {
                chartsContainer.style.display = 'grid';
                toggleChartsBtn.textContent = 'グラフを非表示';
            } else {
                chartsContainer.style.display = 'none';
                toggleChartsBtn.textContent = 'グラフを表示';
            }
        });
    }
    
    // モーダル
    const modal = document.getElementById('emoji-modal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 絵文字グリッド
    const emojiGrid = document.querySelector('.emoji-grid');
    emojiGrid.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN' || e.target.parentElement.classList.contains('emoji-grid')) {
            const emoji = e.target.textContent.trim();
            if (emoji) {
                insertAtCursor(diaryContent, emoji);
                modal.style.display = 'none';
            }
        }
    });
}

// 日記を投稿
submitBtn.addEventListener('click', async () => {
    const content = diaryContent.value.trim();
    
    if (!content) {
        alert('日記の内容を入力してください');
        return;
    }
    
    // ローディング表示
    submitBtn.disabled = true;
    loading.style.display = 'block';
    
    try {
        const response = await fetch('/api/diary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content,
                tags: currentTags
            }),
        });
        
        if (response.ok) {
            const diary = await response.json();
            diaryContent.value = '';
            currentTags = [];
            tagsDisplay.innerHTML = '';
            charCount.textContent = '0 文字';
            loadDiaries();
            
            // 成功メッセージ
            showNotification('日記を書きました！AIが分析結果を返してくれました 🎉', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || '日記の保存に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('サーバーとの通信に失敗しました', 'error');
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
});

// 日記一覧を読み込む
async function loadDiaries() {
    try {
        const response = await fetch('/api/diaries');
        allDiaries = await response.json();
        
        if (allDiaries.length === 0) {
            diaryList.innerHTML = `
                <div class="empty-state">
                    <p>📝 まだ日記がありません</p>
                    <p>上のフォームから最初の日記を書いてみましょう！</p>
                </div>
            `;
            document.getElementById('stats-section').style.display = 'none';
            document.getElementById('summary-cards').style.display = 'none';
            return;
        }
        
        // サマリーカードを更新
        updateSummaryCards(allDiaries);
        
        // フィルタリングと表示
        filterDiaries();
        
        // グラフを表示
        displayCharts(allDiaries);
    } catch (error) {
        console.error('Error loading diaries:', error);
        diaryList.innerHTML = '<div class="error">日記の読み込みに失敗しました</div>';
    }
}

// フィルタリングと並び替え
function filterDiaries() {
    let filtered = [...allDiaries];
    
    // 検索フィルター
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(diary => 
            diary.content.toLowerCase().includes(searchTerm)
        );
    }
    
    // 感情フィルター
    if (currentFilter !== 'all') {
        filtered = filtered.filter(diary => 
            diary.analysis && diary.analysis.emotion === currentFilter
        );
    }
    
    // 並び替え
    const sortValue = sortSelect.value;
    filtered.sort((a, b) => {
        switch(sortValue) {
            case 'date-asc':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'date-desc':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'length-asc':
                return a.content.length - b.content.length;
            case 'length-desc':
                return b.content.length - a.content.length;
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    
    // 表示
    diaryList.innerHTML = '';
    if (filtered.length === 0) {
        diaryList.innerHTML = '<div class="empty-state"><p>該当する日記がありません</p></div>';
    } else {
        filtered.forEach(diary => {
            const diaryElement = createDiaryElement(diary);
            diaryList.appendChild(diaryElement);
        });
    }
}

// 日記要素を作成
function createDiaryElement(diary) {
    const div = document.createElement('div');
    div.className = 'diary-item';
    
    const date = new Date(diary.created_at);
    const formattedDate = formatDate(date);
    
    let analysisHTML = '';
    if (diary.analysis) {
        if (diary.analysis.error) {
            analysisHTML = `
                <div class="error">
                    ${diary.analysis.error}
                </div>
            `;
        } else {
            const topics = diary.analysis.topics || [];
            const keywords = diary.analysis.keywords || [];
            
            analysisHTML = `
                <div class="analysis-section">
                    <h3>🤖 AI分析結果</h3>
                    <div class="analysis-grid">
                        ${diary.analysis.emotion ? `
                            <div class="analysis-item">
                                <strong>感情:</strong>
                                <span>${getEmotionEmoji(diary.analysis.emotion)} ${diary.analysis.emotion}</span>
                            </div>
                        ` : ''}
                        ${diary.analysis.emotion_detail ? `
                            <div class="analysis-item">
                                <strong>詳細な感情:</strong>
                                <span>${diary.analysis.emotion_detail}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${diary.analysis.summary ? `
                        <div class="analysis-item" style="margin-bottom: 15px;">
                            <strong>要約:</strong>
                            <p>${diary.analysis.summary}</p>
                        </div>
                    ` : ''}
                    ${topics.length > 0 ? `
                        <div class="analysis-item">
                            <strong>トピック:</strong>
                            <div class="tags">
                                ${topics.map(topic => `<span class="tag">🏷️ ${topic}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${keywords.length > 0 ? `
                        <div class="analysis-item" style="margin-top: 10px;">
                            <strong>キーワード:</strong>
                            <div class="tags">
                                ${keywords.map(keyword => `<span class="tag" style="background: #764ba2;">✨ ${keyword}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }
    
    let replyHTML = '';
    if (diary.reply) {
        replyHTML = `
            <div class="ai-reply">
                <strong>💬 AIからの返信</strong>
                <p>${diary.reply}</p>
            </div>
        `;
    }
    
    div.innerHTML = `
        <div class="diary-header">
            <div class="diary-date">📅 ${formattedDate}</div>
            <button class="delete-btn" onclick="deleteDiary('${diary.id}')">🗑️ 削除</button>
        </div>
        <div class="diary-content">${diary.content}</div>
        ${analysisHTML}
        ${replyHTML}
    `;
    
    return div;
}

// 日記を削除
async function deleteDiary(diaryId) {
    if (!confirm('この日記を削除しますか？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/diary/${diaryId}`, {
            method: 'DELETE',
        });
        
        if (response.ok) {
            loadDiaries();
            showNotification('日記を削除しました', 'success');
        } else {
            showNotification('削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('削除に失敗しました', 'error');
    }
}

// 日付をフォーマット
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

// 感情に応じた絵文字を取得
function getEmotionEmoji(emotion) {
    const emotionMap = {
        'ポジティブ': '😊',
        'ニュートラル': '😐',
        'ネガティブ': '😢',
        'positive': '😊',
        'neutral': '😐',
        'negative': '😢',
    };
    return emotionMap[emotion] || '😊';
}

// 通知を表示
function showNotification(message, type = 'info') {
    // 簡易的な通知実装
    alert(message);
}

// タグ管理
function addTag(tag) {
    if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        updateTagsDisplay();
    }
}

function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    updateTagsDisplay();
}

function updateTagsDisplay() {
    tagsDisplay.innerHTML = currentTags.map(tag => 
        `<span class="tag-item">${tag} <span class="remove-tag" onclick="removeTag('${tag}')">×</span></span>`
    ).join('');
}

// 音声入力
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('お使いのブラウザは音声入力に対応していません');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    
    recognition.onstart = () => {
        document.getElementById('voice-btn').style.background = '#ff4757';
        document.getElementById('voice-btn').textContent = '🎙️';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        diaryContent.value += transcript;
        charCount.textContent = `${diaryContent.value.length} 文字`;
    };
    
    recognition.onend = () => {
        document.getElementById('voice-btn').style.background = '';
        document.getElementById('voice-btn').textContent = '🎤';
    };
    
    recognition.start();
}

// 絵文字モーダル
function openEmojiModal() {
    document.getElementById('emoji-modal').style.display = 'block';
}

// カーソル位置に挿入
function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.substring(0, start) + text + value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
    charCount.textContent = `${textarea.value.length} 文字`;
}

// AI提案
async function getAISuggestion() {
    const currentText = diaryContent.value.trim();
    if (!currentText) {
        alert('まず少し文章を書いてから提案をリクエストしてください');
        return;
    }
    
    alert('この機能は今後実装予定です。現在の文章を分析してAIが続きを提案します！');
}

// エクスポート
function exportDiaries() {
    const dataStr = JSON.stringify(allDiaries, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diary_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('日記をエクスポートしました！', 'success');
}

// インポート
async function importDiaries(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const diaries = JSON.parse(e.target.result);
            // 各日記をサーバーに送信
            for (const diary of diaries) {
                await fetch('/api/diary', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ content: diary.content })
                });
            }
            loadDiaries();
            showNotification('日記をインポートしました！', 'success');
        } catch (error) {
            showNotification('インポートに失敗しました', 'error');
        }
    };
    reader.readAsText(file);
}

// サマリーカードを更新
function updateSummaryCards(diaries) {
    document.getElementById('summary-cards').style.display = 'grid';
    
    // 総日記数
    document.getElementById('total-entries').textContent = diaries.length;
    
    // 連続日数（簡易実装）
    const dates = diaries.map(d => new Date(d.created_at).toDateString());
    const uniqueDates = [...new Set(dates)].length;
    document.getElementById('streak-days').textContent = uniqueDates;
    
    // ポジティブ率
    const positiveCount = diaries.filter(d => 
        d.analysis && d.analysis.emotion === 'ポジティブ'
    ).length;
    const positiveRate = diaries.length > 0 
        ? Math.round((positiveCount / diaries.length) * 100) 
        : 0;
    document.getElementById('positive-rate').textContent = `${positiveRate}%`;
    
    // 平均文字数
    const avgLength = diaries.length > 0
        ? Math.round(diaries.reduce((sum, d) => sum + d.content.length, 0) / diaries.length)
        : 0;
    document.getElementById('avg-length').textContent = avgLength;
}

// グラフを表示
let emotionChart = null;
let topicsChart = null;
let keywordsChart = null;
let emotionPieChart = null;
let weekdayChart = null;
let monthlyChart = null;

function displayCharts(diaries) {
    const statsSection = document.getElementById('stats-section');
    statsSection.style.display = 'block';
    
    // 感情データの集計
    const emotions = { 'ポジティブ': 0, 'ニュートラル': 0, 'ネガティブ': 0 };
    const emotionTimeline = [];
    const topicsCount = {};
    const keywordsCount = {};
    
    diaries.forEach((diary, index) => {
        if (diary.analysis) {
            // 感情集計
            const emotion = diary.analysis.emotion || 'ニュートラル';
            emotions[emotion] = (emotions[emotion] || 0) + 1;
            
            // 感情推移
            emotionTimeline.push({
                date: new Date(diary.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
                emotion: emotion,
                score: emotion === 'ポジティブ' ? 3 : emotion === 'ニュートラル' ? 2 : 1
            });
            
            // トピック集計
            if (diary.analysis.topics) {
                diary.analysis.topics.forEach(topic => {
                    topicsCount[topic] = (topicsCount[topic] || 0) + 1;
                });
            }
            
            // キーワード集計
            if (diary.analysis.keywords) {
                diary.analysis.keywords.forEach(keyword => {
                    keywordsCount[keyword] = (keywordsCount[keyword] || 0) + 1;
                });
            }
        }
    });
    
    // 1. 感情推移グラフ
    if (emotionChart) emotionChart.destroy();
    const emotionCtx = document.getElementById('emotionChart').getContext('2d');
    emotionChart = new Chart(emotionCtx, {
        type: 'line',
        data: {
            labels: emotionTimeline.map(e => e.date),
            datasets: [{
                label: '感情スコア',
                data: emotionTimeline.map(e => e.score),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: emotionTimeline.map(e => 
                    e.emotion === 'ポジティブ' ? '#4CAF50' : 
                    e.emotion === 'ニュートラル' ? '#FFC107' : '#F44336'
                )
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const emotion = emotionTimeline[context.dataIndex].emotion;
                            return `感情: ${emotion}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 4,
                    ticks: {
                        callback: function(value) {
                            if (value === 3) return 'ポジティブ';
                            if (value === 2) return 'ニュートラル';
                            if (value === 1) return 'ネガティブ';
                            return '';
                        }
                    }
                }
            }
        }
    });
    
    // 2. トピック分布グラフ
    if (topicsChart) topicsChart.destroy();
    const topicsEntries = Object.entries(topicsCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (topicsEntries.length > 0) {
        const topicsCtx = document.getElementById('topicsChart').getContext('2d');
        topicsChart = new Chart(topicsCtx, {
            type: 'bar',
            data: {
                labels: topicsEntries.map(e => e[0]),
                datasets: [{
                    label: '出現回数',
                    data: topicsEntries.map(e => e[1]),
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: '#667eea',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }
    
    // 3. キーワードグラフ
    if (keywordsChart) keywordsChart.destroy();
    const keywordsEntries = Object.entries(keywordsCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (keywordsEntries.length > 0) {
        const keywordsCtx = document.getElementById('keywordsChart').getContext('2d');
        keywordsChart = new Chart(keywordsCtx, {
            type: 'doughnut',
            data: {
                labels: keywordsEntries.map(e => e[0]),
                datasets: [{
                    data: keywordsEntries.map(e => e[1]),
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
                        '#a8edea', '#fed6e3'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    // 4. 感情サマリー（円グラフ）
    if (emotionPieChart) emotionPieChart.destroy();
    const emotionPieCtx = document.getElementById('emotionPieChart').getContext('2d');
    emotionPieChart = new Chart(emotionPieCtx, {
        type: 'pie',
        data: {
            labels: ['ポジティブ', 'ニュートラル', 'ネガティブ'],
            datasets: [{
                data: [
                    emotions['ポジティブ'] || 0,
                    emotions['ニュートラル'] || 0,
                    emotions['ネガティブ'] || 0
                ],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // 5. 曜日別投稿数
    if (weekdayChart) weekdayChart.destroy();
    const weekdayCount = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
    diaries.forEach(diary => {
        const day = new Date(diary.created_at).getDay();
        weekdayCount[day]++;
    });
    
    const weekdayCtx = document.getElementById('weekdayChart').getContext('2d');
    weekdayChart = new Chart(weekdayCtx, {
        type: 'bar',
        data: {
            labels: ['日', '月', '火', '水', '木', '金', '土'],
            datasets: [{
                label: '投稿数',
                data: [0,1,2,3,4,5,6].map(i => weekdayCount[i]),
                backgroundColor: 'rgba(118, 75, 162, 0.7)',
                borderColor: '#764ba2',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
    
    // 6. 月間文字数
    if (monthlyChart) monthlyChart.destroy();
    const monthlyData = {};
    diaries.forEach(diary => {
        const month = new Date(diary.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + diary.content.length;
    });
    
    const monthlyEntries = Object.entries(monthlyData).slice(-6);
    if (monthlyEntries.length > 0) {
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        monthlyChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: monthlyEntries.map(e => e[0]),
                datasets: [{
                    label: '文字数',
                    data: monthlyEntries.map(e => e[1]),
                    borderColor: '#43e97b',
                    backgroundColor: 'rgba(67, 233, 123, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
