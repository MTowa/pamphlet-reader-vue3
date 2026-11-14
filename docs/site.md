# 紹介サイト

紹介サイトは `playground/vue-app/` にあります。ライブラリ本体とは別に管理し、npmパッケージには含めません。
Figmaの[提供デザイン](https://www.figma.com/design/WeRYp6YCUD8qCwf90aNjyJ/?node-id=1-2)をもとに、名前・短い説明・コード・使い方・デモで構成しています。
コード欄はサイトの配色に合わせたCSSのカードです。コピー操作とコード本文を分け、狭い画面ではコードを折り返します。
GitHubアイコンは公式配布素材を使っています。出典と利用範囲は `src/assets/ATTRIBUTION.md` に記載しています。
タブのアイコンは、開いた本と葉を組み合わせたオリジナルのSVGです。

サイト名・見出し・タブ名と、実際のパッケージ名を `vue-leafbook` に統一しています。
インストールコマンドは `pnpm add ./vue-leafbook-0.1.0.tgz`、コード例のimport先は `vue-leafbook` です。

背景は淡いグリーンのグラデーションと、紙を重ねた形のCSSアニメーションです。
背景の一時停止ボタンと `prefers-reduced-motion` に対応しています。アニメーション用の依存ライブラリは追加していません。
[Motion](https://motion.dev/)と[PrimeVue](https://primevue.dev/)の、動きや使用例を中心に見せる構成を参考にしています。

## ローカルで確認

リポジトリ直下で `pnpm dev`（または `npm run dev`）を実行し、ターミナルに表示されるURLを開きます。
通常は `http://127.0.0.1:5173/demo/` です。Node.jsとpnpmの準備は[README](../README.md#develop--ローカルで試す)を参照してください。

- `?format=svg`：SVGサンプルから開始します。
- `?lang=en`：英語版を開きます。上部の日本語 / Englishボタンでも切り替えられます。URLに言語を保持し、資料を読み直さずに表示を切り替えます。
- `?testing=true`：開発用の検証ボタンを表示します。SVGと併用する場合は `?testing=true&format=svg` です。
- 表示設定と命名規則は、通常の紹介サイトでも折りたたみを開いて確認できます。
- 手元のSVGの配置・名前の付け方は[SVGの説明](svg.md)を参照してください。

上部はビルド済み.tgzのインストールコマンドです。npm公開前の開発版であることと、パッケージの作成手順を表示しています。「使い方」にはコンポーネントとCSSをimportするVueのコード例を掲載しています。
英語版は紹介文・デモの案内・ビューアーの操作・エラー表示まで対応しています。元のPDF/SVG本文や、リンク先ドキュメントを自動翻訳する機能ではありません。
インストールコマンドは、ビルドした.tgzを導入先プロジェクトの直下に置いた場合の例です。
npmにはまだ公開していません。公開後に、レジストリからのインストールコマンドへ切り替えます。

## GitHub Pages

同じリポジトリから公開します。初回はリポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定します。
[GitHub公式の設定手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)に沿った構成です。

`.github/workflows/pages.yml` はPRで公開用ビルドを確認し、`main`へのマージ後に公開します。
作業ブランチのPushだけではデプロイしません。公開先は `https://mtowa.github.io/pamphlet-reader-vue3/` です。
実際に公開されたかどうかは、Actionsの **Introduction site → deploy** の結果で確認してください。

```sh
pnpm build:site
pnpm --filter flipbook-vue-playground preview --base /pamphlet-reader-vue3/
# http://127.0.0.1:4173/pamphlet-reader-vue3/
```

出力先は `playground/vue-app/dist/` です。公開パスを含めたPDF・SVG・画像のURLをビルドし、
ライブラリの第三者表記・全文ライセンスと、サイトに含まれるVueのライセンスを一緒に配置します。
`scripts/site-notices.mjs` は追加の依存関係とVueのライセンス原文を照合し、変更があればビルドを失敗させます。
ドメインやリポジトリ名を変える場合は、`build:site` の `--base` も合わせて変更してください。

ブラウザーテストは通常の `/demo/` を使います。公開用ビルドの後にワークスペースで実行する場合は、
`pnpm build:apps` でテスト用のパスに戻すか、独立アプリを作る `pnpm test:package` を実行してください。
