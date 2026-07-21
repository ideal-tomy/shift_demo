# シフト管理デモ（大衆酒場 みなと屋）

希望収集・最適案・確定通知・欠勤対応・経営ダッシュボードまでを1アプリのロール切替で体験します。

## 起動

```bash
cd shift_demo
npm install
npm run dev
```

投資回収 CTA を出す場合（別ターミナルで `roi-simulator` も起動）:

```bash
# .env.local
VITE_ROI_SIMULATOR_URL=http://localhost:5173
```

遷移先: `/?kit=shift-management&industry=other&cat=dashboard&from=shift-minatoya`

## ドキュメント

- [要件](./40_シフト管理デモ_要件定義書.md)
- [Demo Definition](./docs/shift_demo_definition.md)
- [実装 PLAN](./docs/implementation-plan.md)
- [ROI Mapping](./docs/roi-mapping.md)

## 注意

- 割当はフロントの決定的ロジックです（AI に数字を作らせません）
- 欠勤の打診・LINE風通知・AI進言はシナリオ演出です
- `@axeon/ai-demo-core` は未接続です
