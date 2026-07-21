# シフト管理デモ — ROI Mapping（草案）

> **目的**  
> デモが語る削減ストーリーと `roi-simulator` の初期値・URL を一致させる契約書。  
> 試算ロジックはデモ側に持たない。配線手順の正本は  
> [`roi-simulator/docs/demo-roi-integration-playbook.md`](../../roi-simulator/docs/demo-roi-integration-playbook.md)。

**ステータス:** 確定  
**関連:** [`shift_demo_definition.md`](./shift_demo_definition.md) / [`implementation-plan.md`](./implementation-plan.md) / [`40_シフト管理デモ_要件定義書.md`](../40_シフト管理デモ_要件定義書.md)

---

## 1. URL 契約

```text
{VITE_ROI_SIMULATOR_URL}/?brand=ideal&kit=shift-management&industry=other&cat=dashboard&from=shift-minatoya
```

| パラメータ | 値 | 理由 |
|---|---|---|
| `brand` | `ideal` | みなと屋デモは ideal ブランドで投資回収を開く |
| `kit` | `shift-management` | 既存 kit。新規 JSON は作らない（突合・微調整のみ） |
| `industry` | `other` | 飲食専用 preset なし。CS の restaurant パックと同様に `other` |
| `cat` | `dashboard` | 経営面・タイムカウンター締めが体験ピーク。管理・経営カテゴリと一致 |
| `from` | `shift-minatoya` | リード追跡用。ブランド「みなと屋」とデモを紐づけ |

- 開き方: **別タブ**（`target="_blank"`）。`embed=1` は使わない
- 環境変数: `VITE_ROI_SIMULATOR_URL`（**オリジンのみ**。例 `https://roi-simulator-eta.vercel.app`）。`?brand=` は env に付けない（`roiLink.ts` が付与）
- 未設定時: CTA 非表示

### 入口 UX（roi-simulator 側・`?kit=` 入場）

| 挙動 | 内容 |
|---|---|
| ヒーロー | `shift-management.json` の `hero`（飲食・シフト向け文言）。業種カテゴリの generic 文言は使わない |
| 自動スクロール | マウント後、見積質問（ウィザード）へスクロール |
| 非表示 | 業界ピッカー／キット切替バー（デモ直リンクを最短にする） |

他デモも同じパターンで、各 kit JSON に `hero: { eyebrow, title, lead }` を足す。

---

## 2. CTA 表示タイミング

| 優先 | 場所 | トリガー | 種別 |
|---|---|---|---|
| 主 | 経営面（タイムカウンター直下） | シーン6相当の締め後、または経営タブ表示時かつカウンターが累計を持った後 | Workflow 完了型に近い |
| 副 | 店長面・設定／デモ説明シート末尾 | Adoption 導線（商談で「金額感」を先に聞きたいとき） | 常時可 |

商談5分台本の締め（要件 §7-5）直後に主 CTA が出ることを推奨。

---

## 3. デモが証明する数字（正本）

要件・台本からの削減ストーリー。シミュレーターの defaults はこれに寄せる。

| デモ内の見せ方 | 数値 | ROI への使い方 |
|---|---|---|
| タイムカウンター | 今月のシフト業務 **22時間 → 2時間** | `people × cases × minutes` の Before が約 22h/月になるよう defaults を組む。削減率 ≈ **(22−2)/22 ≈ 91%** → 商談用 default は **80**（hint 上限付近。極端な楽観を避ける） |
| 欠勤対応 Before | 電話10件・約40分 | `other`（年間）の説明に接続。単発ではなく月数回×店舗で年額化 |
| 店舗スケール | 1 → 3 → 8 / スタッフ 25 → 80 | kit 質問 `staff` の s/m/l と口頭説明を一致（見積係数）。ROI 工数 defaults 自体は「組む担当」側 |

サンプルデータの基本モード: **3店舗・25名**（`41_みなと屋_サンプルデータ.json`）。

---

## 4. 既存 kit との突合

正本ファイル: [`roi-simulator/src/data/kits/shift-management.json`](../../roi-simulator/src/data/kits/shift-management.json)

### 4.1 現状 defaults（kit 記載）

| キー | 確定値 | メモ |
|---|---|---|
| `people` | **3** | 基本モード3店舗＝店長3人 |
| `cases` | **5** | `3×5×90分≈22.5h` でタイムカウンターと一致 |
| `minutes` | **90** | 維持 |
| `reduction` | **80** | hint 上限付近 |
| `wage` | 3000 | 維持 |
| `other` | 1,200,000 | 維持 |

### 4.2 質問セット（そのまま利用可）

| id | デモ体験との対応 |
|---|---|
| `customize` | UI ブランド（炭火シグネチャ等）の作り込み度 |
| `staff` | 店舗トグル 25名 / 80名 ↔ s・m・l |
| `rules` | F-02 制約（希望・スキル・労基）の複雑さ |
| `deadline` | 導入スケジュール |
| `notify` | F-04 通知（任意問） |
| `hr_link` | 勤怠連携（デモ Won't。見積の不確実性用） |
| `roles` | スタッフ／店長／経営の権限分け（デモの3面と一致） |

**Phase 0 判断:** 専用 kit の新規作成は不要。defaults（と必要ならラベル文言）の微調整のみ。

---

## 5. やらないこと（再掲）

- デモ内に投資回収の計算式を持たない
- iframe / postMessage で金額を埋め込まない
- タイムカウンターの円換算をデモ側で独自実装しない（語るのは時間。金額は simulator）

---

## 6. Phase 0 チェックリスト

- [x] 本 Mapping の URL 4パラメータを確定
- [x] `shift-management.json` の `roi.defaults` を §4.1 推奨に更新
- [x] プレイブック「デモ別マッピング」表に `shift_demo` 行を追加
- [x] Demo Definition § ROI / 実装 PLAN と矛盾がないことを確認
