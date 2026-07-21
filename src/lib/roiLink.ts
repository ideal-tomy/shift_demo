const ROI_PARAMS = {
  kit: "shift-management",
  industry: "other",
  cat: "dashboard",
  from: "shift-minatoya",
} as const;

/** roi-simulator への導線URL。未設定時は null（CTA非表示）。 */
export function getRoiSimulatorUrl(): string | null {
  const raw = import.meta.env.VITE_ROI_SIMULATOR_URL?.trim();
  if (!raw) return null;

  const origin = raw.replace(/\/+$/, "");
  const q = new URLSearchParams(ROI_PARAMS);
  return `${origin}/?${q.toString()}`;
}
