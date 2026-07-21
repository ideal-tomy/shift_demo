import { Sheet } from "./Sheet";

export type ProposeReason = {
  filledSlots: number;
  shortSlots: number;
  wishFirst: number;
  laborSafe: number;
};

type Props = {
  open: boolean;
  reason: ProposeReason | null;
  onClose: () => void;
};

export function ProposeReasonSheet({ open, reason, onClose }: Props) {
  if (!open || !reason) return null;
  return (
    <Sheet title="この案の理由" onClose={onClose}>
      <ul className="reasonList">
        <li>
          充足した枠 <strong className="tnum">{reason.filledSlots}</strong>
        </li>
        <li>
          不足のまま残した枠{" "}
          <strong className="tnum">{reason.shortSlots}</strong>
          （勝手に埋めない）
        </li>
        <li>
          希望適合を優先した配置{" "}
          <strong className="tnum">{reason.wishFirst}</strong>
        </li>
        <li>
          上限接近を避けた割当{" "}
          <strong className="tnum">{reason.laborSafe}</strong>
        </li>
      </ul>
    </Sheet>
  );
}
