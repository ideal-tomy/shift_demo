import { getRoiSimulatorUrl } from "../lib/roiLink";

export function RoiPaybackCta() {
  const href = getRoiSimulatorUrl();
  if (!href) return null;

  return (
    <div className="roiPaybackCta no-print">
      <p className="roiPaybackCtaTitle">開発コストの回収にかかる期間の目安</p>
      <p className="roiPaybackCtaLead">
        質問に答えると、概算の開発費と投資回収の目安が出ます
      </p>
      <a
        className="roiPaybackCtaButton"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        投資回収の目安を見る
      </a>
    </div>
  );
}
