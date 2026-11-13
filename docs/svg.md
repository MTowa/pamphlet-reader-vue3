# SVGフォルダーを使う

公開前に用意したSVGを、フォルダー単位で指定できます。各ページのURLを手作業で列挙する必要はありません。PDFからSVGへの変換機能は含まれません。

## 1. ページを配置する

アプリの `public/` に資料用のフォルダーを作ります。

```text
public/
  pamphlet/
    001.svg
    002.svg
    003.svg
```

ページ順はファイル名の数字を考慮して自動で並べます。`1.svg, 2.svg, 10.svg` はその順になります。`001.svg` のように桁数をそろえると管理しやすくなります。フォルダー直下の `.svg` / `.SVG` が対象で、下位フォルダーは探索しません。

## 2. フォルダーを一度登録する

### Vue + Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { svgDirectories } from '@your-org/vue-flipbook/vite'

export default defineConfig({
  plugins: [vue(), svgDirectories({ directories: ['pamphlet'] })],
})
```

### Nuxt 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@your-org/vue-flipbook/style.css'],
  modules: [['@your-org/vue-flipbook/nuxt', { directories: ['pamphlet'] }]],
})
```

Nuxtでは上のモジュールを使います。Vite用プラグインを重ねて登録する必要はありません。`directories` は公開フォルダーからの相対パスです。例えば `['pamphlet', 'catalog/2026']` と複数登録できます。登録先の変更後は開発サーバーを再起動します。Viteの `publicDir` とNuxtの `dir.public` の変更にも対応しています。

## 3. 表示する

```vue
<script setup lang="ts">
import { FlipbookViewer } from '@your-org/vue-flipbook'
import '@your-org/vue-flipbook/style.css'
</script>

<template>
  <FlipbookViewer svg-dir="/pamphlet/" />
</template>
```

`svg-dir` はブラウザーからアクセスするURLです。パソコン上の絶対パス（`/Users/...` など）を渡すものではありません。`src` はPDF用、`svg-dir` はSVG用で、どちらか片方を指定します。

`/demo/` などのサブパスで公開する場合は、アプリのベースパスを含めます。

```ts
// Vue + Vite の <script setup>
const svgDir = import.meta.env.BASE_URL + 'pamphlet/'

// Nuxt の <script setup> ではこちら
// const svgDir = useRuntimeConfig().app.baseURL + 'pamphlet/'
```

```vue
<FlipbookViewer :svg-dir="svgDir" />
```

SSRでも直接使用できます。サーバーでは読み込み中の表示だけを作り、ブラウザーでページ画像を取得します。

## 自動生成と公開

開発サーバーの起動時とビルド時に、各フォルダーへ `flipbook.json` が生成されます。開発中にSVGを追加・削除・変更すると一覧を更新し、画面を再読み込みします。公開時はビルド結果に含まれるSVGと一覧を一緒に配信します。静的ホスティングで使え、サーバーがフォルダー一覧を返す機能は不要です。

生成された一覧は直接編集しません。アプリ側の `.gitignore` に、例えば `public/pamphlet/flipbook.json` を追加できます。既に同名の別用途ファイルがある場合は、上書きせずにビルドを止めます。空フォルダー、公開フォルダー外への参照、SVGファイルのシンボリックリンクもエラーになります。

公開後にSVGだけを入れ替える運用では一覧が古くなるため、再ビルドしてまとめて再公開してください。別ドメインのフォルダーURLも指定できますが、一覧の取得を許可するCORS設定が必要です。URLのクエリー文字列・フラグメントは指定できません。

## 表示方法と制限

- SVGだけの表示ではPDF.js、PDF Worker、PDF用フォント・CMap・WASMを取得しません。ページめくりエンジンはPDFと共通です。同じ画面でPDFも開けば、その時点でPDF用コードが必要になります。
- 最初の画像から用紙の縦横比を取得し、他の比率のページは余白を含めて収めます。SVGに `viewBox` または幅・高さを設定してください。
- 現在のページと近くのページだけを順番に取得し、画像のキャッシュは最大6ページです。ブラウザー全体のメモリー使用量を6ページ分に制限するものではありません。
- `<img>` として表示します。SVGのスクリプトは実行せず、内部のリンクやアニメーション制御には対応しません。外部画像・CSS・フォントを参照するSVGは表示が欠ける可能性があります。画像は埋め込み、フォントは権利を確認したうえで埋め込むかアウトライン化し、実際の表示を確認してください。外部リソースの制限は [MDNのSVG画像の説明](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)を参照してください。
- SVGの文字選択や本文のスクリーンリーダー読み上げは提供しません。必要に応じてHTML版や原本のリンクを併記してください。
- SVGファイルが大きい場合や複雑な図形が多い場合は、PDFより軽くなるとは限りません。通信量と表示時間は実際の資料で比較してください。

PDFと同じページ操作、スマートフォンでの単ページ表示、全画面、イベント、公開メソッドを使用できます。SVGの `loading` イベントは読み込み中かどうかを通知し、バイト進捗は `loaded: 0, total: null` になります。
