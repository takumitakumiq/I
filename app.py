from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime
from ai_analyzer import analyze_diary, generate_reply

app = Flask(__name__)

# データディレクトリの設定
DATA_DIR = 'data'
DIARY_FILE = os.path.join(DATA_DIR, 'diaries.json')

# データファイルが存在しない場合は作成
if not os.path.exists(DIARY_FILE):
    with open(DIARY_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, ensure_ascii=False, indent=2)

def load_diaries():
    """日記データを読み込む"""
    with open(DIARY_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_diaries(diaries):
    """日記データを保存する"""
    with open(DIARY_FILE, 'w', encoding='utf-8') as f:
        json.dump(diaries, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    """メインページを表示"""
    return render_template('index.html')

@app.route('/api/diaries', methods=['GET'])
def get_diaries():
    """全ての日記を取得"""
    diaries = load_diaries()
    # 日付順にソート（新しい順）
    diaries.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(diaries)

@app.route('/api/diary', methods=['POST'])
def create_diary():
    """新しい日記を作成"""
    data = request.json
    content = data.get('content', '')
    
    if not content:
        return jsonify({'error': '日記の内容を入力してください'}), 400
    
    # 日記データを作成
    diary_entry = {
        'id': datetime.now().strftime('%Y%m%d%H%M%S'),
        'content': content,
        'created_at': datetime.now().isoformat(),
        'analysis': None,
        'reply': None
    }
    
    # AI分析と返信生成
    try:
        analysis = analyze_diary(content)
        reply = generate_reply(content, analysis)
        
        diary_entry['analysis'] = analysis
        diary_entry['reply'] = reply
    except Exception as e:
        print(f"AI処理エラー: {e}")
        diary_entry['analysis'] = {
            'error': 'AI分析に失敗しました。APIキーを確認してください。'
        }
        diary_entry['reply'] = 'AI返信の生成に失敗しました。'
    
    # 保存
    diaries = load_diaries()
    diaries.append(diary_entry)
    save_diaries(diaries)
    
    return jsonify(diary_entry), 201

@app.route('/api/diary/<diary_id>', methods=['GET'])
def get_diary(diary_id):
    """特定の日記を取得"""
    diaries = load_diaries()
    diary = next((d for d in diaries if d['id'] == diary_id), None)
    
    if diary:
        return jsonify(diary)
    else:
        return jsonify({'error': '日記が見つかりません'}), 404

@app.route('/api/diary/<diary_id>', methods=['DELETE'])
def delete_diary(diary_id):
    """日記を削除"""
    diaries = load_diaries()
    diaries = [d for d in diaries if d['id'] != diary_id]
    save_diaries(diaries)
    
    return jsonify({'message': '削除しました'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
