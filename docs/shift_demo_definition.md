# 飲食店向けシフト管理デモ — Demo Definition

**Demo ID:** `shift-minatoya`  
**Demo Name:** シフト管理デモ（大衆酒場 みなと屋）  
**Brand ID:** `minatoya`  
**Repository:** `shift_demo`  
**Demo Type:** Dashboard / Workflow（3面ロール切替）  
**Requirement File:** [`../40_シフト管理デモ_要件定義書.md`](../40_シフト管理デモ_要件定義書.md)  
**Sample Data:** [`../41_みなと屋_サンプルデータ.json`](../41_みなと屋_サンプルデータ.json)  
**ROI Mapping:** [`roi-mapping.md`](./roi-mapping.md)  
**実装 PLAN:** [`implementation-plan.md`](./implementation-plan.md)

---

## 1. Demo Goal

### 証明すること

希望収集・割当下書き・通知回収・欠勤穴埋めまでをスマホ中心で通し、「集めて埋めて配る」が消え、担当者の仕事が編集と確定だけに戻ることを体験してもらう。あわせて店舗が増えても操作が変わらず候補だけ増えることを見せる。

### 理想状態

「AIは下書きまで。決めるのは店長。増えてもこのまま使える」

### 最重要価値

- 導入後の想像しやすさ
- 実務感
- 分かりやすさ（Before→消える→残るのは判断）

---

## 2. Common Core Integration

**Phase 1〜2 の核（F-02 最適案など）はフロントの決定的ロジック。AI に数字を作らせない（要件どおり）。**

| フェーズ | Core |
|---|---|
| P1〜P2（割当・編集・通知・欠勤候補提示） | **接続しない**（Sample / ローカル状態機械） |
| P3（F-08 AI進言） | `@axeon/ai-demo-core` 接続を検討。未接続時はシナリオ固定文 |

原則:

- Provider / Trial をデモ側で再実装しない（Core 接続時）
- 体験コード取得はデモに複製せず、`VITE_TRIAL_PORTAL_URL` → Studio `/admin/trial`
- 試算ロジックは `roi-simulator` に集約（デモは URL + CTA のみ）

---

## 3. Access Mode

| Mode | Phase | 用途 |
|---|---|---|
| sample | P1〜 | サンプルデータ再生。キー不要。商談の主経路 |
| byok / trial | P3 以降（任意） | F-08 進言を Live にする場合のみ |

Default: `sample`

---

## 4. UI / シナリオ

1アプリ + 上部ロール切替タブ（スタッフ / 店長 / 経営者）+ **StoryBar**（①提出 → ②最適案 → ③確定通知 → ④確認）。**商談主戦場はスマホ片手操作**（説明最小・次操作と完了が自然に分かる）。

**デモ主人公:** `stf01` 田中 悠斗（横浜西口店）。欠勤シナリオも同一。スタッフ／通知／欠勤で同じ顔を追う。初期表示はスタッフ面・主人公・3店舗。

| 面 | 主デバイス | 主機能 |
|---|---|---|
| スタッフ | スマホ | 週グリッド（今週/翌週）で希望を下書き → 下部「提出する」。確定後は通知確認。所属店を明示 |
| 店長 | スマホ | 週ビュー・最適案（積み上げ演出＋理由）・差し替え（選ぶ→配置先）・打診文脈明示・人物詳細 |
| 経営 | スマホ優先 | タイムカウンター → AI提案（件名型）→ 店舗アコーディオン。KPIはPCのみ |

### 体験の要点（UIUX作り込み後）

- 共通: `Sheet` / `StaffProfileSheet` / トースト。名前タップ＝人物、右ボタン＝アクション。`StoryBar` が次ロールへ誘導
- スタッフ: 即提出廃止。下書き件数バッジ付き「提出する」。所属店＋主人公バッジ
- 店長: 時給非表示、役職ラベル（`staffLabels`）。打診行に「誰へ・どの枠」を明示
- 経営: `AI進言` → `AI提案：…について`。スマホで想定人件費等のKPI非表示。8店舗は生成名注記付き（商談基本は3店舗・実名25名）

台本対応（要件 §7）: StoryBar ①〜④ ≒ 提出 → 最適案 → 確定通知 → 確認。体験ピーク後に投資回収 CTA（下記 §6）。

デザイントークン: DDデモ(31) 流用。シグネチャ `#C97B3D`（`--ember`）。タイムカウンターで共通。

---

## 5. Input / Output

### Input

- `41_みなと屋_サンプルデータ.json`（stores / staff / demand_templates / submissions / シナリオイベント）
- ユーザー操作（希望タップ、セル差し替え、欠勤フロー、店舗数トグル）

### Output（画面状態）

- 仮シフト / 確定シフト
- 通知・既読状況
- 労基アラート・給与プレビュー
- タイムカウンター累計
- （P3）AI提案カード（件名型）

### Adapter 方針

- 割当エンジン: デモ内モジュール（決定的）。Core に入れない
- シナリオ演出（欠勤LINE等）: fixture。本物のメッセージ送信はしない

---

## 6. ROI 連動

詳細の正本: [`roi-mapping.md`](./roi-mapping.md)  
手順の正本: [`roi-simulator/docs/demo-roi-integration-playbook.md`](../../roi-simulator/docs/demo-roi-integration-playbook.md)

- 正本アプリ: ワークスペース内 `roi-simulator`
- 環境変数: `VITE_ROI_SIMULATOR_URL`
- 遷移: `/?brand=ideal&kit=shift-management&industry=other&cat=dashboard&from=shift-minatoya`
- 主表示: 経営面・タイムカウンター直下（別タブ）
- 副表示: 店長面「確定して通知」成功後
- 未設定時: CTA 非表示（体験本体は不変）
- やらないこと: 試算ロジック複製 / iframe / postMessage
- 出口: 「見積もりを閉じる」→ 閲覧モード（業界選択可）。詳細はプレイブック §1.2

実装済み: `src/lib/roiLink.ts` / `src/components/RoiPaybackCta.tsx`

---

## 7. Demo 固有 Delta（Core に入れない）

- みなと屋ブランド・炭火シグネチャ・3面ロール UI
- シフト割当エンジン（必要役割→スキル→希望→人件費→労基）
- 店舗間シャッフル提案ロジック
- タイムカウンター演出
- サンプルデータとシナリオ固定イベント

---

## 8. 受け入れ条件（抜粋）

体験（要件より）:

- [ ] 提出1件で仮案が更新され、提出率リングが動く
- [ ] 「最適案を作る」が demand_templates を満たし、不足枠を空欄表示する
- [ ] 確定→各自通知→既読回収まで1フロー
- [ ] 欠勤→候補3名→差し替えが3タップ以内
- [ ] 店舗数トグルで操作手順が変わらない
- [ ] 労基アラートが編集中にリアルタイム点灯
- [ ] タイムカウンターが主要操作で加算され経営面に累計表示

ROI（プレイブック）:

- [ ] env 未設定 → CTA 非表示
- [ ] env 設定 → 指定タイミングで CTA 表示
- [ ] 別タブで `kit` / `industry` / `cat` / `from` が Mapping どおり
- [ ] `no-print` 付与

---

## 9. 実装 PLAN

詳細の正本: [`implementation-plan.md`](./implementation-plan.md)

体験と ROI は分離しない。Phase 0（契約）→ Phase 1（核）→ Phase 1.5（CTA）→ Phase 2 / 3。

---

## 10. 推奨ディレクトリ（実装着手時）

```text
shift_demo/
  40_シフト管理デモ_要件定義書.md
  41_みなと屋_サンプルデータ.json
  docs/
    roi-mapping.md              ← 本書と対
    shift_demo_definition.md    ← 本ファイル
  .env.example
  src/
    lib/roiLink.ts
    components/RoiPaybackCta.tsx
    ...
```

フレームワークはワークスペース他デモに合わせ **Vite + React** を既定とする。変更する場合は本 Definition の Access Mode / env 名だけ先に直す。
