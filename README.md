# AI日記アプリ 📔

AIがあなたの日記を分析して返信を書いてくれる日記アプリです。

## 機能

- 📝 日記の作成と管理
- 🤖 AIによる日記内容の詳細分析
  - 感情分析（ポジティブ/ニュートラル/ネガティブ）
  - トピック抽出
  - キーワード抽出
  - 自動要約
- 💬 AIからの共感的な返信メッセージ
- 🎨 美しく使いやすいUI

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成します：

```bash
cp .env.example .env
```

`.env`ファイルを編集してOpenAI APIキーを設定します：

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

OpenAI APIキーは[こちら](https://platform.openai.com/api-keys)から取得できます。

### 3. アプリケーションの起動

```bash
python app.py
```

ブラウザで以下のURLにアクセスします：
```
http://localhost:5000
```

## 使い方

1. **日記を書く**: テキストエリアに今日あったことや感じたことを自由に書きます
2. **送信**: 「📝 日記を書く」ボタンをクリック
3. **AI分析**: AIが自動的に日記の内容を分析します
   - 感情を判定
   - 重要なトピックを抽出
   - キーワードを抽出
   - 内容を要約
4. **返信を受け取る**: AIが共感的で励ましの返信を生成します
5. **過去の日記を見る**: 画面下部に過去の日記が新しい順に表示されます

## プロジェクト構造

```
.
├── app.py              # Flaskアプリケーション（メイン）
├── ai_analyzer.py      # AI分析ロジック
├── requirements.txt    # Python依存関係
├── .env.example        # 環境変数のサンプル
├── README.md          # このファイル
├── data/              # 日記データ保存ディレクトリ
│   └── diaries.json   # 日記データ（JSON形式）
├── templates/         # HTMLテンプレート
│   └── index.html     # メインページ
└── static/            # 静的ファイル
    ├── style.css      # スタイルシート
    └── script.js      # JavaScriptコード

```

## 技術スタック

- **バックエンド**: Python 3, Flask
- **AI**: OpenAI GPT-4o-mini
- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla)
- **データ保存**: JSON ファイル

## 注意事項

- OpenAI APIの利用には料金が発生する場合があります
- APIキーは必ず`.env`ファイルで管理し、公開リポジトリにコミットしないでください
- データは`data/diaries.json`にローカル保存されます

## ライセンス

MIT License

## 開発者

このアプリはAIアシスタントによって作成されました。
