import { formatHoursPair } from "../lib/timeCounter";
import { useDemo } from "../state/DemoStore";

export function TimeCounter({ emphasize = false }: { emphasize?: boolean }) {
  const { timeSavedMin } = useDemo();
  const { before, after } = formatHoursPair(timeSavedMin);
  return (
    <div className="timeCounter" data-emphasize={emphasize ? "1" : undefined}>
      <p className="label">今月のシフト業務</p>
      <p className="value tnum">
        {before}
        <span>時間</span>→{after}
        <span>時間</span>
      </p>
    </div>
  );
}
