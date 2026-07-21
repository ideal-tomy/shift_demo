import { useMemo } from "react";
import {
  findCell,
  getDemand,
  hoursForStaff,
  requiredCount,
} from "../lib/assignment/proposeDraft";
import { ProposeReasonSheet } from "../components/ProposeReasonSheet";
import { RoiPaybackCta } from "../components/RoiPaybackCta";
import { Sheet } from "../components/Sheet";
import { TimeCounter } from "../components/TimeCounter";
import { WeekGrid } from "../components/WeekGrid";
import { titleLabel } from "../lib/staffLabels";
import { useDemo } from "../state/DemoStore";

export function ManagerView() {
  const d = useDemo();

  const store = d.stores.find((s) => s.id === d.storeId);
  const slots = d.timeSlots.filter(
    (s) => store?.has_late_slot || s.id !== "late",
  );

  const storeAlerts = d.laborAlerts.filter((a) => {
    const st = d.staff.find((x) => x.id === a.staff_id);
    return st?.store_id === d.storeId;
  });

  const selected = d.selectedCell
    ? findCell(
        d.shifts,
        d.selectedCell.store_id,
        d.selectedCell.date,
        d.selectedCell.slot,
      )
    : undefined;

  const demandForSelected =
    d.selectedCell && store
      ? getDemand(
          d.demandTemplates,
          d.selectedCell.store_id,
          d.dayTypes[d.selectedCell.date],
          d.selectedCell.slot,
        )
      : {};

  const candidateRole =
    Object.keys(demandForSelected)[0] ??
    selected?.assignments[0]?.role ??
    "フロア";

  const candidates = useMemo(
    () =>
      d.staff
        .filter((s) => s.store_id === d.storeId)
        .filter((s) => s.roles.includes(candidateRole))
        .map((s) => ({
          s,
          hours: hoursForStaff(d.shifts, s.id),
        }))
        .sort((a, b) => b.s.skill_level - a.s.skill_level),
    [d.staff, d.storeId, d.shifts, candidateRole],
  );

  const hasProposed = d.shifts.some(
    (s) => s.store_id === d.storeId && s.status !== "draft",
  );
  const absence = d.scenarioEvents.find((e) => e.type === "absence");
  const absenceStore = d.stores.find((s) => s.id === absence?.store_id);
  const absenceSlotLabel =
    d.timeSlots.find((t) => t.id === absence?.slot)?.label ?? absence?.slot;
  const absenceRoleLabel = (() => {
    if (!absence) return "フロア";
    const cell = findCell(
      d.shifts,
      absence.store_id,
      absence.date,
      absence.slot,
    );
    return (
      cell?.assignments.find((a) => a.staff_id === absence.staff_id)?.role ??
      "フロア"
    );
  })();

  return (
    <div className="viewBody hasBottomBar">
      <div className="stickyHead">
        <select
          className="selectCtrl"
          value={d.storeId}
          onChange={(e) => d.setStoreId(e.target.value)}
          aria-label="店舗"
        >
          {d.stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="ringStat">
          提出{" "}
          <strong className="tnum">
            {d.submittedCount}/{d.staffTotal}
          </strong>
        </div>
        {d.notifications.length > 0 ? (
          <div className="ringStat">
            確認{" "}
            <strong className="tnum">
              {d.ackCount}/{d.notifications.length}
            </strong>
          </div>
        ) : null}
      </div>

      <TimeCounter />

      {d.liveLog.length > 0 ? (
        <div className="liveLogWrap">
          <ul className="liveLog">
            {d.liveLog.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {d.proposeReason ? (
            <button
              type="button"
              className="ghostBtn reasonBtn"
              onClick={() => d.setReasonOpen(true)}
            >
              この案の理由
            </button>
          ) : null}
        </div>
      ) : null}

      <WeekGrid
        mode="manager"
        week={d.week}
        slots={slots}
        cellInfo={(date, slotId) => {
          const dayType = d.dayTypes[date];
          const demand = getDemand(
            d.demandTemplates,
            d.storeId,
            dayType,
            slotId,
          );
          const need = requiredCount(demand);
          if (need === 0) return null;
          const cell = findCell(d.shifts, d.storeId, date, slotId);
          const filled = cell?.assignments.length ?? 0;
          const key = `${d.storeId}|${date}|${slotId}`;
          const reveal =
            d.visibleShiftKeys == null
              ? true
              : d.visibleShiftKeys.has(key);
          return {
            filled,
            need,
            short: filled < need,
            alertDot: storeAlerts.some((a) =>
              cell?.assignments.some((x) => x.staff_id === a.staff_id),
            ),
            reveal,
          };
        }}
        onCell={(date, slotId) =>
          d.setSelectedCell({
            store_id: d.storeId,
            date,
            slot: slotId,
          })
        }
      />

      {storeAlerts.length > 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>労基</h3>
          <ul className="alertList">
            {storeAlerts.slice(0, 4).map((a) => (
              <li key={a.message} className={a.level}>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => d.openProfile(a.staff_id)}
                >
                  {a.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {absence && hasProposed && !d.absenceResolved ? (
        <div className="card">
          <h3>欠勤連絡</h3>
          <p className="note">{absence.trigger}</p>
          <button
            type="button"
            className="dangerBtn"
            style={{ marginTop: 10, width: "100%" }}
            onClick={() => {
              d.setShuffleMode(false);
              d.setAbsenceOpen(true);
            }}
          >
            代替を探す
          </button>
        </div>
      ) : null}

      {d.absenceResolved ? (
        <div className="card">
          <h3>欠勤対応完了</h3>
        </div>
      ) : null}

      {d.confirmedOnce ? <RoiPaybackCta /> : null}

      <div className="bottomBar">
        <button
          type="button"
          className="primaryBtn"
          disabled={d.proposing}
          onClick={d.runPropose}
        >
          {d.proposing ? "作成中…" : "最適案を作る"}
        </button>
        <button
          type="button"
          className="ghostBtn"
          disabled={!hasProposed || d.proposing}
          onClick={d.confirmAndNotify}
        >
          確定して通知
        </button>
      </div>

      {d.selectedCell && !d.placeStaffId ? (
        <Sheet
          title={`${d.selectedCell.date.slice(5)} / ${d.selectedCell.slot}`}
          note={`役割: ${candidateRole}`}
          onClose={() => d.setSelectedCell(null)}
        >
          {candidates.map(({ s, hours }) => (
            <div key={s.id} className="candidateRow">
              <button
                type="button"
                className="nameBtn"
                onClick={() => d.openProfile(s.id)}
              >
                <strong>{s.name}</strong>
                <span className="note">
                  {titleLabel(s)}・今週{hours.toFixed(0)}h
                </span>
              </button>
              <button
                type="button"
                onClick={() => d.setPlaceStaffId(s.id)}
              >
                選ぶ
              </button>
            </div>
          ))}
        </Sheet>
      ) : null}

      {d.selectedCell && d.placeStaffId ? (
        <Sheet
          title="配置先"
          note={
            d.staff.find((s) => s.id === d.placeStaffId)?.name ?? ""
          }
          onClose={() => d.setPlaceStaffId(null)}
          footer={
            <button
              type="button"
              className="ghostBtn"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => d.setPlaceStaffId(null)}
            >
              戻る
            </button>
          }
        >
          {d.placeTargets.map((t) => (
            <button
              key={`${t.store_id}-${t.date}-${t.slot}-${t.role}`}
              type="button"
              className="placeTargetBtn"
              onClick={() => d.placeAt(t)}
            >
              {t.label}
            </button>
          ))}
        </Sheet>
      ) : null}

      {d.absenceOpen ? (
        <Sheet
          title={d.shuffleMode ? "店舗間シャッフル" : "代替候補"}
          note={`候補 ${d.helpPoolCount}名${d.scaleMode === 8 ? "・8店舗" : ""}`}
          onClose={() => d.setAbsenceOpen(false)}
        >
          {d.absenceCandidates.length === 0 ? (
            <button
              type="button"
              className="primaryBtn"
              style={{ width: "100%" }}
              onClick={() => d.setShuffleMode(true)}
            >
              シャッフル提案を見る
            </button>
          ) : (
            d.absenceCandidates.map((c) => {
              const st = d.staff.find((s) => s.id === c.staff_id);
              const sending = d.approachingId === c.staff_id;
              return (
                <div key={c.staff_id} className="approachCard">
                  <button
                    type="button"
                    className="nameBtn"
                    onClick={() => d.openProfile(c.staff_id)}
                  >
                    <strong>
                      {st?.name ?? c.staff_id}（{st ? titleLabel(st) : ""}
                      ）に打診
                    </strong>
                    <span className="note">
                      {absence?.date.slice(5)} {absenceSlotLabel}・
                      {absenceStore?.name}・{absenceRoleLabel}
                    </span>
                    <span className="note">
                      {c.reason}
                      {c.crossStore ? "・他店から応援" : ""}
                    </span>
                    {c.shuffleNote ? (
                      <span className="note">{c.shuffleNote}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="primaryBtn approachSend"
                    disabled={Boolean(d.approachingId)}
                    onClick={() => d.applyAbsenceReplacement(c)}
                  >
                    {sending ? "送信中…" : "打診して送る"}
                  </button>
                </div>
              );
            })
          )}
          {!d.shuffleMode && d.absenceCandidates.length > 0 ? (
            <button
              type="button"
              className="ghostBtn"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => d.setShuffleMode(true)}
            >
              店舗間シャッフル
            </button>
          ) : null}
          <p className="note">デモ演出（実送信なし）</p>
        </Sheet>
      ) : null}

      <ProposeReasonSheet
        open={d.reasonOpen}
        reason={d.proposeReason}
        onClose={() => d.setReasonOpen(false)}
      />
    </div>
  );
}
