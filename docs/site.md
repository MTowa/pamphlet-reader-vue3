# 紹介サイトの開発・公開手順

この文書は、紹介サイトを編集・確認・公開する開発者向けの手順書です。
ライブラリを利用する方は、[READMEのインストール手順](../README.md#install--インストール)を参照してください。

紹介サイトは `playground/vue-app/` にあります。ライブラリ本体とは別に管理し、npmパッケージには含めません。
この手順書もnpmパッケージや紹介サイトには含まれず、GitHub上の開発用ドキュメントとして管理します。

GitHubアイコンなどの素材を変更する場合は、[素材の出典と利用範囲](../playground/vue-app/src/assets/ATTRIBUTION.md)も確認してください。

## ローカルで確認

リポジトリ直下で `pnpm dev`（または `npm run dev`）を実行し、ターミナルに表示されるURLを開きます。
通常は `http://127.0.0.1:5173/demo/` です。Node.jsとpnpmの準備は[README](../README.md#develop--ローカルで試す)を参照してください。

- `?format=svg`：SVGサンプルから開始します。
- `?lang=en`：英語版を開きます。上部の日本語 / Englishボタンでも切り替えられます。URLに言語を保持し、資料を読み直さずに表示を切り替えます。
- `?testing=true`：開発用の検証ボタンを表示します。SVGと併用する場合は `?testing=true&format=svg` です。
- 表示設定と命名規則は、通常の紹介サイトでも折りたたみを開いて確認できます。
- 手元のSVGの配置・名前の付け方は[SVGの説明](svg.md)を参照してください。

上部はnpmからインストールする `pnpm add vue-leafbook` です。対応するVueのバージョンと、npmのパッケージページへのリンクを表示しています。「使い方」にはコンポーネントとCSSをimportするVueのコード例を掲載しています。
英語版は紹介文・デモの案内・ビューアーの操作・エラー表示まで対応しています。元のPDF/SVG本文や、リンク先ドキュメントを自動翻訳する機能ではありません。
ローカルで変更した配布ファイルを試す場合は、READMEの[ビルド済みパッケージを使う](../README.md#install-the-built-package--ビルド済みパッケージを使う)を参照してください。

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
