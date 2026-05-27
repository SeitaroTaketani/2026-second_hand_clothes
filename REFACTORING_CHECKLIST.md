# リファクタリング修正チェックリスト — 2026 Second-Hand Clothes

レビューフィードバックに基づく修正項目の詳細チェックリスト。
各項目は現状コードを実際に確認したうえでステータスを付与しています。

**目的:** スタンドアロンでも `unctad.org` 埋め込み時でも壊れない、完全にカプセル化された状態で提出する。

## ステータス凡例

- ✅ **完了** — 確認済み、対応不要
- ⚠️ **要対応 / 要確認** — 一部対応済みだが残作業あり
- ❌ **未対応** — 修正が必要

## 検証結果（実施済み）

| 項目 | 結果 |
|------|------|
| `npx vite build` | ✅ 成功（605 modules, 2.65s）|
| `npx biome check src` | ✅ 0 errors / 10 warnings（全て `noDescendingSpecificity` 等の放置可 ⚠️ CSS 警告）|
| Playwright 自動テスト | ✅ 18 / 18 passed（ui-smoke 12件 + embedding 6件）|
| Tailwind / PostCSS 設定 | ✅ 削除済み（設定ファイルなし）|

---

## 1. CSS のカプセル化（最重要）

> フィードバック: 全 CSS を `#app-root-2026-second_hand_clothes` 配下にラップする。ベアなクラスセレクタ（`.modal-card {}`）は本サイトに影響するため禁止。

- [x] ✅ すべての custom CSS が `#app-root-2026-second_hand_clothes {}` 配下にネストされている
  - 確認済み: `colors.css`, `custom.css`, `insight.css`, `variables.css`, `header.css`, `modals.css`, `kpi.css`, `styles.css`, `mobile.css`, `panels.css` すべてトップレベルがルートセレクタのみ
- [x] ✅ ルート自身に付与するクラスは `&.insight-open` で正しく参照（[styles.css:28](src/styles/custom/styles.css#L28)）
- [x] ✅ **最終目視確認**: ビルド後 `dist/css/2026-second_hand_clothes.min.css` を確認済み — トップレベルのすべてのルールが `#app-root-2026-second_hand_clothes` または `@`-rules（`@keyframes` 等）でスコープ済み

## 2. ID セレクタの排除

> フィードバック: `#main-header {}` のような ID セレクタは禁止（ID は一意であるべき）。

- [x] ✅ ルートの `#app-root-2026-second_hand_clothes` 以外に ID セレクタは存在しない（CSS 全体を grep して 0 件）
- [x] ✅ マークアップ側も ID 付与なし。[Article.jsx](src/jsx/components/Article.jsx) はすべて `className` で記述

## 3. 本サイトへの影響排除（body / html / グローバル）

> フィードバック: `body` などに影響する CSS は禁止。スタンドアロンでも埋め込みでも動作すること。

- [x] ✅ custom CSS 内に `body` / `html` / `:root` / `*` のグローバルセレクタなし
- [x] ✅ [index.html](index.html) の `html, body { margin:0; padding:0 }` `<style>` ブロックを削除済み — レビュア方針「body に影響する CSS は除去」に準拠
- [ ] ⚠️ CSS 変数は `#app-root` 配下で定義されているか確認（[variables.css](src/styles/custom/variables.css)）。`:root` ではなくルート ID 配下に定義済み → ✅ だが、埋め込み先で同名変数と衝突しないようプレフィックス（例 `--shc-`）を付けることを検討

## 4. `!important` の排除

> フィードバック: 必要な場合を除き `!important` を使わない。

- [x] ✅ custom CSS には `!important` なし
- [ ] ⚠️ [basics.css:25](src/styles/basics.css#L25) に `display: none !important;` が 1 件（テンプレート由来）。biome も `noImportantStyles` で警告。テンプレート共通ファイルのため、本当に必要か確認のうえ可能なら除去

## 5. インラインスタイルの集約（JS / HTML → CSS）

> フィードバック: インラインスタイル・JS 内スタイル定義をやめ、CSS ファイルに集約する。Trade Fingerprint の例を参照。

- [x] ✅ フィードバックで指摘された Trade Fingerprint ブロックはクラス化済み（`svg-polar`, `si-card-center`, `si-chart-caption` 等）[main.js:1188](src/jsx/components/custom/main.js#L1188)
- [x] ✅ JS 内の `style="..."` ハードコードは撤去済み。残るのは CSS カスタムプロパティ経由の動的値のみ（`--pct`, `--vh`, `--tooltip-x/y`, `--indent`）→ これは動的値の正しい受け渡し方法
- [x] ✅ custom 側 JSX（[Article.jsx](src/jsx/components/Article.jsx)）にインライン `style` なし
- [ ] ℹ️ 参考: テンプレート共通コンポーネント（`minisite/*`, `general/*`）には scroll 連動の `style={{...}}` が残るが、これらは共有テンプレートの動的値であり本案件の対象外

## 6. JS セレクタのカプセル化

> フィードバック: `document` を query せず `appRef.current` を使う。`document.body.classList.add(...)` は絶対 NG。

- [x] ✅ スコープ付きヘルパー `qs` / `qsa` を導入し `window.appRef.current.querySelector` 経由に統一（[main.js:41](src/jsx/components/custom/main.js#L41), [map.js:14](src/jsx/components/custom/map.js#L14), [countrySelector.js:6](src/jsx/components/custom/countrySelector.js#L6)）
- [x] ✅ イベントは `document` ではなく `root`（appRef.current）に登録・dispatch（[App.jsx:32-36](src/jsx/App.jsx#L32-L36), [map.js:691](src/jsx/components/custom/map.js#L691)）
- [x] ✅ **`document.body.classList.add('insight-open')` は撤去済み** → `getRoot().classList.add('insight-open')` に変更（[main.js:433](src/jsx/components/custom/main.js#L433)）
- [ ] ⚠️ `window.appRef` グローバルへの依存（[App.jsx:22](src/jsx/App.jsx#L22) で `window.appRef = appRef`）
  - これはテンプレート共通の規約（`BackToTop.jsx`, `ButtonAnchor.jsx`, `ProgressBar.jsx` も使用）なので許容範囲
  - ただし**同一ページに別の UNCTAD アプリが同居すると `window.appRef` が上書きされ衝突するリスク**あり。理想は `MainApp.init(appRef)` のように参照を引数で渡すこと（任意・優先度低）
- [x] ✅ [main.js](src/jsx/components/custom/main.js) の古いコメント修正済み — `// inline onclick handlers that need a global window.App reference` → `// Delegate clicks on partner-list action buttons via event delegation`

## 7. D3 のインポート最適化

> フィードバック: D3 は使う関数だけインポートする。

- [x] ✅ `import * as d3` ではなく名前付きインポートに変更済み（[map.js:1](src/jsx/components/custom/map.js#L1) ほか）
- [x] ✅ **未使用インポートの除去**: [map.js:3](src/jsx/components/custom/map.js#L3) の `CONFIG` を削除済み（biome `noUnusedImports` 解消）
- [ ] ⚠️ さらなる最適化（任意）: `from 'd3'` ではなくサブモジュール（`d3-selection`, `d3-scale`, `d3-format`, `d3-geo` 等）から直接 import するとバンドルがより小さくなる。現状 JS は 377 KB（gzip 117 KB）

## 8. 不要パッケージの削除

> フィードバック: tailwind、topojson-client 等の不要パッケージを削除。

- [x] ✅ Tailwind は削除済み（設定・import ともに無し）
- [ ] ⚠️ **`topojson-client` は削除不可**: [dataLoader.js:2,20-29](src/jsx/components/custom/dataLoader.js#L2) で `topojson.feature(...)` を実際に使用中。[package.json:28](package.json#L28) の依存も必要。**レビュアの「削除」提案はこのファイルには適用できない**旨を共有すること（誤って削除するとビルドが壊れる）

## 9. 重複コードのループ化・統一

> フィードバック: 多数のボタンはループで生成する。Article.jsx の Region filter が例。

- [x] ✅ [Article.jsx](src/jsx/components/Article.jsx) で Region / Year / Threshold / Flow のボタン・選択肢を配列（`REGIONS`, `YEARS`, `THRESHOLDS`, `FLOWS`）から `.map()` で生成済み
- [x] ✅ `CountryPicker` / `MobilePicker` / `FlowDot` / アイコンを共通コンポーネント化済み

## 10. コメントの英語統一

> フィードバック: コメントはすべて英語に統一。

- [x] ✅ custom コード（main.js, map.js, dataLoader.js, countrySelector.js, config.js, regions.js）のコメントはすべて英語。日本語コメントは検出されず
  - 非 ASCII 文字は矢印（→）・度記号（°）・UI 用絵文字（🌍📊）・記号（≤▶└）のみで、いずれも正当

## 11. Biome（lint / format）の解消

> フィードバック: biome 済み。CSS の一部は残ってよい。

ローカルの未コミット編集（map.js, *.css 等）により drift が発生。`npm run lint:fix` && `npm run format` で大半解消可能。

- [x] ✅ **`useIterableCallbackReturn`**（4 件）: [main.js:315-321](src/jsx/components/custom/main.js#L315-L321) — `forEach` コールバックをブロック形式 `c => { c.classList.remove(...); }` に修正済み
- [x] ✅ **`noUnusedImports`**: map.js の `CONFIG` 削除済み（§7 と同じ）
- [x] ✅ **format 差分**（main.js, map.js, insight.css, styles.css）— `npm run format` で 4 ファイル修正済み
- [ ] ⚠️ **`noDescendingSpecificity`**（CSS 7 件: header.css, insight.css×3, mobile.css, modals.css, panels.css, styles.css）→ レビュア曰く「CSS の小さい指摘は放置可」。任意対応
- [ ] ⚠️ **`noImportantStyles`**: basics.css の `!important`（§4 と同じ）

## 12. 動作確認（デグレチェック）

> フィードバック: リファクタで壊した箇所があるかもしれないので動作確認を。

- [x] ✅ プロダクションビルド成功（605 modules, 2.65s）
- [x] ✅ **自動 UI テスト**（Playwright + Chromium headless で `vite preview` を検証）— 12テスト全通過:
  - [x] 地図の描画（`path.land` 10件以上レンダリング確認）
  - [x] 国クリック（`circle.country-node` クリック → `insight-panel.open` 確認）
  - [x] Region / Year / Threshold フィルタの切替・active クラス反映
  - [x] Exporter カントリーピッカー（開く・検索・クリア）
  - [x] Flow チェックボックス（8件、全て checked）
  - [x] Methodology モーダルの開閉（X ボタン・Escape キー）
  - [x] Sea Route トグル（国選択後に enabled になりトグル動作確認）
  - [x] `--vh` CSS カスタムプロパティが JS からインライン設定済み確認
  - [x] `document.body` にアプリクラス・スタイルが漏れないこと確認
- [x] ✅ **埋め込みテスト**（Playwright でホストページに `dist` アセット埋め込み）— 6テスト全通過:
  - [x] ホストページ `h1.host-heading { color: purple }` がアプリ CSS に上書きされない
  - [x] ホストページ `p.host-para { color: green }` がアプリ CSS に上書きされない
  - [x] ホストページ `body { background: #f5f5f5 }` がアプリ CSS に上書きされない
  - [x] `body.className` に `insight-open` 等のアプリ固有クラスが付与されない
  - [x] `#app-root` 内でアプリが正常レンダリング
  - [x] 埋め込み起動時に JS エラーなし
  - テストスクリプト: [tests/ui-smoke.spec.mjs](tests/ui-smoke.spec.mjs) / [tests/embedding.spec.mjs](tests/embedding.spec.mjs)

---

## 優先度サマリ

**✅ 完了済み（自動修正中心）**
1. ~~`npm run lint:fix && npm run format` を実行 → 未使用 import・format 差分を一括解消（§7, §11）~~ → **完了**
2. ~~`useIterableCallbackReturn` 4 件を手動修正（§11）~~ → **完了**
3. ~~[main.js](src/jsx/components/custom/main.js) の古いコメント修正（§6）~~ → **完了**
4. ~~index.html の `html, body` スタイル削除（§3）~~ → **完了**
5. ~~ビルド後 CSS の最終目視（全ルートスコープ確認）（§1）~~ → **完了** ✅ all scoped

**要判断・共有事項（任意）**
- `topojson-client` は削除不可である旨をレビュアに共有（§8）
- basics.css の `.hidden { display: none !important }` は utility クラスとして必要（§4）
- CSS 変数のプレフィックス付与（`--shc-`）は大規模変更のため任意（§3）

**✅ 提出前確認 — 完了**
- Playwright headless テスト 18件全通過（§12）: `npx playwright test tests/ --config playwright.config.mjs`

> 注: 対応可能な全 ❌ 項目は**完了済み**。`npx biome check src` の残存は ⚠️ warnings（`noDescendingSpecificity` 10件・`noImportantStyles` 1件）のみ — レビュア曰く「CSS の小さい指摘は放置可」。
