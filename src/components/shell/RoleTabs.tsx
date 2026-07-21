import { useDemo } from "../../state/DemoStore";
import type { DemoRole } from "../../types";

const LABELS: { id: DemoRole; label: string }[] = [
  { id: "staff", label: "スタッフ" },
  { id: "manager", label: "店長" },
  { id: "owner", label: "経営" },
];

export function RoleTabs() {
  const { role, setRole } = useDemo();
  return (
    <nav className="roleTabs" aria-label="ロール切替">
      {LABELS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={role === t.id ? "active" : undefined}
          onClick={() => setRole(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
