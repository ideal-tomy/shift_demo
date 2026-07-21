import { useState } from "react";
import { estimatePayroll } from "../lib/assignment/proposeDraft";
import { RoiPaybackCta } from "../components/RoiPaybackCta";
import { Sheet } from "../components/Sheet";
import { TimeCounter } from "../components/TimeCounter";
import { titleLabel } from "../lib/staffLabels";
import { useDemo } from "../state/DemoStore";
import type { ScaleMode } from "../types";

type Proposal = {
  id: string;
  title: string;
  body: string;
  staffId?: string;
  actionAbsence?: boolean;
};

export function OwnerView() {
  const d = useDemo();
  const advice = d.scenarioEvents.find((e) => e.type === "advice");
  const absence = d.scenarioEvents.find((e) => e.type === "absence");
  const takahashi = d.staff.find((s) => s.name.includes("高橋"));
  const [openStore, setOpenStore] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);

  const proposals: Proposal[] = [];
  if (absence && !d.absenceResolved) {
    const storeName =
      d.stores.find((s) => s.id === absence.store_id)?.name ?? "横浜西口店";
    proposals.push({
      id: "absence",
      title: `AI提案：${storeName}、スタッフ欠勤未対応について`,
      body:
        absence.trigger ??
        "欠勤連絡への代替配置が未完了です。候補提示から打診まで店長面で完結できます。",
      actionAbsence: true,
    });
  }
  if (takahashi) {
    proposals.push({
      id: "overtime",
      title: `AI提案：${takahashi.name}（${titleLabel(takahashi)}）の残業時間超過について`,
      body: "当週の労働時間が上限に接近しています。配置見直しまたはシフト削減を検討してください。",
      staffId: takahashi.id,
    });
  }
  if (advice) {
    proposals.push({
      id: "advice",
      title: "AI提案：横浜西口店、土曜ディナーの戦力偏りについて",
      body: `${advice.insight}\n${advice.advice}`,
    });
  }

  return (
    <div className="viewBody ownerView">
      <TimeCounter emphasize />

      <RoiPaybackCta />

      <section className="ownerSection">
        <h3 className="ownerSectionTitle">AI提案</h3>
        <div className="proposalList">
          {proposals.map((p) => (
            <button
              key={p.id}
              type="button"
              className="proposalCard"
              onClick={() => setActiveProposal(p)}
            >
              {p.title}
            </button>
          ))}
        </div>
      </section>

      <div className="kpiGrid ownerKpiDesktop">
        <div className="kpi">
          <div className="k">想定人件費（当週）</div>
          <div className="v tnum">¥{d.payroll.toLocaleString("ja-JP")}</div>
        </div>
        <div className="kpi">
          <div className="k">人件費率</div>
          <div className="v tnum">{d.laborRate}%</div>
        </div>
        <div className="kpi">
          <div className="k">労基アラート</div>
          <div className="v tnum">{d.laborAlerts.length}</div>
        </div>
      </div>

      <section className="ownerSection">
        <h3 className="ownerSectionTitle">店舗</h3>
        <div className="storeAccordion">
          {d.stores.map((s) => {
            const pay = estimatePayroll(d.shifts, d.staff, s.id);
            const alerts = d.laborAlerts.filter((a) => {
              const st = d.staff.find((x) => x.id === a.staff_id);
              return st?.store_id === s.id;
            }).length;
            const open = openStore === s.id;
            const needs = alerts > 0 || (absence?.store_id === s.id && !d.absenceResolved);
            return (
              <div key={s.id} className="accItem">
                <button
                  type="button"
                  className="accHead"
                  onClick={() => setOpenStore(open ? null : s.id)}
                >
                  <span>{s.name}</span>
                  <span className="accMeta">
                    {needs ? <span className="needDot" /> : null}
                    <span className="tnum">{open ? "−" : "+"}</span>
                  </span>
                </button>
                {open ? (
                  <div className="accBody">
                    <p className="note ownerDesktopOnly tnum">
                      人件費 ¥{pay.toLocaleString("ja-JP")}・アラート {alerts}
                    </p>
                    <p className="note">
                      {alerts > 0
                        ? `要確認アラート ${alerts}件`
                        : "特に問題なし"}
                    </p>
                    <button
                      type="button"
                      className="ghostBtn"
                      style={{ width: "100%", marginTop: 8 }}
                      onClick={() => {
                        d.setStoreId(s.id);
                        d.setRole("manager");
                      }}
                    >
                      店長面で開く
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="ownerSection">
        <button
          type="button"
          className="accHead demoToggle"
          onClick={() => setDemoOpen((v) => !v)}
        >
          <span>デモ設定</span>
          <span className="tnum">{demoOpen ? "−" : "+"}</span>
        </button>
        {demoOpen ? (
          <div className="card">
            <p className="note">店舗スケール（操作は同じ）</p>
            <div className="chipRow">
              {([1, 3, 8] as ScaleMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`chip${d.scaleMode === m ? " active" : ""}`}
                  onClick={() => d.setScaleMode(m)}
                >
                  {m === 3 ? "3店舗（商談基本）" : `${m}店舗`}
                </button>
              ))}
            </div>
            {d.scaleMode === 8 ? (
              <p className="note scaleGenNote">
                追加55名はデモ用の生成名です。操作は同じで、候補だけ増えます
              </p>
            ) : (
              <p className="note">
                商談は基本3店舗・実名25名。8店舗は「増えても同じ操作」の証明用
              </p>
            )}
            <p className="note tnum">
              スタッフ {d.staffTotal} / 店舗 {d.stores.length} / 候補{" "}
              {d.helpPoolCount}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                className="textCtrl"
                style={{ flex: 1 }}
                placeholder="店名"
                value={d.addStoreName}
                onChange={(e) => d.setAddStoreName(e.target.value)}
              />
              <button
                type="button"
                className="primaryBtn"
                onClick={d.addCustomStore}
              >
                追加
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {activeProposal ? (
        <Sheet
          title={activeProposal.title}
          onClose={() => setActiveProposal(null)}
          footer={
            <div className="sheetFooterCol">
              {activeProposal.staffId ? (
                <button
                  type="button"
                  className="primaryBtn"
                  style={{ width: "100%" }}
                  onClick={() => {
                    const id = activeProposal.staffId!;
                    setActiveProposal(null);
                    d.openProfile(id);
                  }}
                >
                  人物を見る
                </button>
              ) : null}
              {activeProposal.actionAbsence ? (
                <button
                  type="button"
                  className="primaryBtn"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setActiveProposal(null);
                    d.openAbsenceFromOwner();
                  }}
                >
                  店長面で対応
                </button>
              ) : null}
              <button
                type="button"
                className="ghostBtn"
                style={{ width: "100%" }}
                onClick={() => setActiveProposal(null)}
              >
                閉じる
              </button>
            </div>
          }
        >
          <p style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>
            {activeProposal.body}
          </p>
          <p className="note">シナリオ層（ライブAIではありません）</p>
        </Sheet>
      ) : null}
    </div>
  );
}
