import os
from google import genai

# Gemini クライアントの初期化
client = None
try:
    api_key = os.environ.get('GEMINI_API_KEY')
    if api_key:
        os.environ['GOOGLE_API_KEY'] = api_key
        client = genai.Client()
except Exception as e:
    print(f"Gemini初期化エラー: {e}")

def analyze_diary(content):
    """
    日記の内容をAIで分析する
    
    Args:
        content (str): 日記の内容
    
    Returns:
        dict: 分析結果（感情、トピック、重要なキーワードなど）
    """
    if not client:
        return {
            'error': 'Gemini APIキーが設定されていません',
            'emotion': '不明',
            'topics': [],
            'keywords': [],
            'summary': '分析できませんでした'
        }
    
    try:
        prompt = """あなたは優秀な日記分析アシスタントです。
日記の内容を分析し、以下の項目をJSON形式で返してください：
1. emotion（感情）: ポジティブ/ニュートラル/ネガティブのいずれか
2. emotion_detail（詳細な感情）: 喜び、悲しみ、怒り、不安、平穏など具体的な感情
3. topics（トピック）: 日記に含まれる主なテーマのリスト（最大5つ）
4. keywords（キーワード）: 重要なキーワードのリスト（最大10個）
5. summary（要約）: 1-2文で日記を要約

必ずJSON形式で返してください。

以下の日記を分析してください：

""" + content
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        
        import json
        # Geminiの応答からJSON部分を抽出
        text = response.text.strip()
        # JSONコードブロックがある場合は抽出
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()
        
        analysis = json.loads(text)
        return analysis
        
    except Exception as e:
        print(f"分析エラー: {e}")
        return {
            'error': str(e),
            'emotion': '不明',
            'topics': [],
            'keywords': [],
            'summary': '分析に失敗しました'
        }

def generate_reply(content, analysis):
    """
    日記の内容と分析結果に基づいてAIが返信を生成する
    
    Args:
        content (str): 日記の内容
        analysis (dict): 分析結果
    
    Returns:
        str: AIからの返信メッセージ
    """
    if not client:
        return "Gemini APIキーが設定されていないため、返信を生成できません。"
    
    try:
        # 分析結果を文字列化
        analysis_text = f"""
感情: {analysis.get('emotion', '不明')}
詳細な感情: {analysis.get('emotion_detail', '不明')}
トピック: {', '.join(analysis.get('topics', []))}
要約: {analysis.get('summary', '')}
"""
        
        prompt = f"""あなたは共感的で優しい日記アシスタントです。
ユーザーの日記に対して、以下の点を意識して返信してください：
1. ユーザーの感情に共感する
2. ポジティブな側面を見つけて励ます
3. 必要に応じてアドバイスや視点を提供する
4. 親しみやすく、温かいトーンで書く
5. 200-300文字程度で簡潔に

日記の内容：
{content}

分析結果：
{analysis_text}

この日記に対して、共感的で励ましの返信を書いてください。"""
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        reply = response.text
        return reply
        
    except Exception as e:
        print(f"返信生成エラー: {e}")
        return f"返信の生成に失敗しました: {str(e)}"
