# pazugiri-character-tracker

刀剣乱舞ぱずぎりの育成管理アプリです。ビルドは不要です。

**アプリの URL：** https://mikankaihatu.github.io/pazugiri-character-tracker/

## 使い方

上の URL をブラウザで開くと使えます。
手元で試すときは、`index.html` をブラウザで直接開いてください。

## 機能

- **キャラ一覧**：レア／その他に分けてキャラを追加・削除できます。
  - 刀種類・強化待ち・限界突破・信頼度・奥義色を編集できます。
  - 上の項目でフィルターをかけられます。
- ドロップ統計・素材トラッキング・在庫管理・設定（準備中）

## ファイル構成

```
index.html              画面の骨組み（タブとコンテナ）
css/style.css           スタイル
js/data.js              データ構造と localStorage への保存
js/features/
  characters.js         キャラ一覧タブ（追加・編集・フィルター）
  drops.js              ドロップ統計タブ
  materials.js          素材トラッキングタブ
  inventory.js          在庫管理タブ
  settings.js           設定タブ
js/app.js               タブ切り替えと初期化
```

- ビルドは不要です。ファイルを編集して push すれば GitHub Pages に反映されます。
- `index.html` の `<script>` は上から順に読み込まれます。
  - `data.js` は最初に、`app.js` は最後に読み込んでください。
- 新しいタブを足すときの手順です。
  1. `js/features/` にファイルを作り、`renderXxx()` 関数を書きます。
  2. `index.html` にタブボタン・`<div>`・`<script>` を追加します。
  3. `js/app.js` の `switchTab` に分岐を追加します。

## データの保存先

データはブラウザの `localStorage`（キー名 `toukenData`）に保存されます。
ブラウザや端末が変わるとデータは引き継がれません。
