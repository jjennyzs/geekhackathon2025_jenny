# イッポ：ゴール支援アプリ

技育CAMP2025オンラインハッカソンに参加しました。1週間の開発期間で、5人チームとGitを使って開発しました。
「イッポ」は、ユーザーがゴールへの一歩を踏み出すことを支援するアプリです：
- AIが簡単なステップを自動生成しロードマップを提示
- 「賭けシステム」で目標達成への決意を決済に反映
- Stripe決済を利用し、目標達成ごとに返金される仕組み

## 自分の貢献
- Vue.js, Nuxt, Tailwind CSS, TypeScript を用いたフロントエンド開発
- Figmaでアプリのプロトタイプをデザイン ([Figmaデザイン](https://www.figma.com/design/2iz57gCSWxAGkBAJdFRyEm/Ippo_App-design?node-id=0-1&m=dev))
- チーム全員が同じイメージを共有できるようにデザインを作成し、タスク分担や開発を効率化

## Credits
Original repository: [SatoshiTomita/geekhackashon](https://github.com/SatoshiTomita/geekhackashon)

## Demo
Slide presentation & video demo: [Canva Presentation](https://www.canva.com/design/DAG7qKzWaYE/KwZ3xz9KowV4Oh_INBIVQA/view?utm_content=DAG7qKzWaYE&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hbda7d957c4)

# Ippo: Goal Support App

We participated in the GEEK CAMP 2025 Online Hackathon.  
Within a one-week development period, our 5-member team collaborated using Git to build this project.  

"Ippo" is an app that helps users take their first step toward achieving their goals:
- AI automatically generates simple steps and provides a roadmap
- A unique "betting system" reflects the user's commitment to goal achievement through payments
- Stripe integration allows users to place a bet amount, and refunds are issued each time a goal is achieved

## My Contribution
- Frontend development using Vue.js, Nuxt, Tailwind CSS, and TypeScript
- Designed the app prototype in Figma ([Figma Design](https://www.figma.com/design/2iz57gCSWxAGkBAJdFRyEm/Ippo_App-design?node-id=0-1&m=dev))
- Created design references to ensure the whole team shared the same vision, making task division and development more efficient


# FirebaseとNuxtのテンプレートリポジトリ

環境設定の手間を削減するために、よく使っている機能をテンプレートとして設定しました

# 使用技術

- Framework – Nuxt
- Backend – Firebase
- UI – Tailwind CSS
- Code Quality – ESLint
- Deployment – Vercel
- 決済: Stripe
- AI: OpenAI API（ステップ生成に使用）

# 環境構築の手段

## 1.リポジトリをクローン

- githubの「このテンプレートを使う」を押下し新たなリポジトリでテンプレートを使用する
- git clone <リポジトリのURL>

## 2. Firebaseの設定

- Firebaseのコンソールからプロジェクトを作成する
- @.envファイルをコピーし.envにリネームする
- .envファイルの環境変数を変更する
- .firebasercのdefaltを使用するproject名に変更する

## 3.パッケージのインストール

- ルート直下でnpm install
- functionsディレクトリに移動してnpm installを行う

## 4.ページ起動

- ルート直下でnpm run dev
- functions直下でnpm run serve

## 5.deploy設定

- vercelのページにアクセスし、プロジェクトと接続し環境変数を設定する
