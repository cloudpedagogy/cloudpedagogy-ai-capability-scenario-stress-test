import { DOMAINS, type DomainKey } from "../domain/model";

function getScoreLabel(val: number): string {
  if (val >= 3.1) return "Strong";
  if (val >= 1.6) return "Developing";
  return "Low";
}

export default function DomainBars(props: { scores: Record<DomainKey, number> }) {
  return (
    <div className="bars">
      {DOMAINS.map((d) => {
        const s = props.scores[d.key] ?? 0;
        const pct = Math.round((s / 4) * 100);
        const label = getScoreLabel(s);
        
        return (
          <div key={d.key} className="barrow">
            <div className="barrow__label">
              {d.label}
              <span className={`text-tiny semibold uppercase ml-2 ${
                label === "Low" ? "text-red" : label === "Strong" ? "text-green" : "text-muted"
              }`} style={{ fontSize: "9px" }}>
                {label}
              </span>
            </div>
            <div className="barrow__bar">
              <div className="barrow__fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="barrow__value">{s}/4</div>
          </div>
        );
      })}
    </div>
  );
}
