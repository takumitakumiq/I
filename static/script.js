// DOM要素の取得
const diaryContent = document.getElementById('diary-content');
const submitBtn = document.getElementById('submit-btn');
const loading = document.getElementById('loading');
const diaryList = document.getElementById('diary-list');

// ページ読み込み時に日記一覧を取得
document.addEventListener('DOMContentLoaded', () => {
    loadDiaries();
});

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
            body: JSON.stringify({ content }),
        });
        
        if (response.ok) {
            const diary = await response.json();
            diaryContent.value = '';
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
        const diaries = await response.json();
        
        if (diaries.length === 0) {
            diaryList.innerHTML = `
                <div class="empty-state">
                    <p>📝 まだ日記がありません</p>
                    <p>上のフォームから最初の日記を書いてみましょう！</p>
                </div>
            `;
            return;
        }
        
        diaryList.innerHTML = '';
        diaries.forEach(diary => {
            const diaryElement = createDiaryElement(diary);
            diaryList.appendChild(diaryElement);
        });
    } catch (error) {
        console.error('Error loading diaries:', error);
        diaryList.innerHTML = '<div class="error">日記の読み込みに失敗しました</div>';
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
