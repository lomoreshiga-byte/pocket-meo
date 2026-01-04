# Pocket MEO

スマホで「3秒で返信」「5秒で投稿」ができる、店舗オーナーのための極めてシンプルなMEO管理ツール。

## 🎯 プロジェクト概要

Pocket MEOは、多忙な店舗オーナーがスマートフォン片手でGoogleビジネスプロフィール（GBP）とInstagram連携を管理できるモバイルファーストのWebアプリケーションです。

### 主な機能

- **📱 ダッシュボード**: 今やるべきアクションのみをカード表示
- **⭐ クチコミ管理**: LINEライクなタイムライン形式でクチコミを表示
- **🤖 AI返信生成**: Gemini APIを活用したワンタップ返信生成
- **✏️ 投稿管理**: シンプルな投稿画面とスケジュール機能
- **🔗 Instagram連携**: Instagram投稿を自動でGBPに連携
- **⚙️ 設定**: 営業時間変更と臨時休業スイッチ

## 🛠️ 技術スタック

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui互換コンポーネント
- **Backend**: Supabase (予定)
- **APIs**: 
  - Google Business Profile API
  - Instagram Graph API
  - Gemini API (AI返信生成)

## 📁 プロジェクト構造

```
pocket-meo/
├── app/
│   ├── (main)/              # メインアプリケーション
│   │   ├── dashboard/       # ダッシュボード
│   │   ├── reviews/         # クチコミ管理
│   │   ├── posts/           # 投稿管理
│   │   └── settings/        # 設定
│   ├── login/               # ログイン画面
│   ├── globals.css          # グローバルスタイル
│   └── layout.tsx           # ルートレイアウト
├── components/
│   ├── ui/                  # 基本UIコンポーネント
│   ├── BottomNav.tsx        # ボトムナビゲーション
│   ├── ReviewCard.tsx       # クチコミカード
│   └── AIReplyGenerator.tsx # AI返信生成モーダル
├── lib/
│   └── utils.ts             # ユーティリティ関数
└── types/
    └── index.ts             # TypeScript型定義
```

## 🚀 セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## 📱 モバイル最適化

- **Bottom Navigation**: 4タブ構成（ホーム / クチコミ / 投稿 / 設定）
- **Safe Area対応**: iOS SafeArea対応のパディング
- **PWA対応**: ホーム画面追加、オフライン表示
- **タッチ最適化**: 大きなタップターゲット、スムーズなアニメーション

## 🔧 今後の実装予定

### Phase 2: API統合
- [ ] Supabase認証の実装
- [ ] Google Business Profile API統合
- [ ] Instagram Graph API統合
- [ ] Gemini API統合（AI返信生成）

### Phase 3: 本番対応
- [ ] エラーハンドリング強化
- [ ] ローディング状態の改善
- [ ] Service Worker実装
- [ ] パフォーマンス最適化

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 🤝 貢献

現在、外部からの貢献は受け付けていません。

---

**Pocket MEO** - シンプルで強力なMEO管理ツール 🚀
