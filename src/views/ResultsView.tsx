import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import DomainBars from "../components/DomainBars";
import SignalBadge from "../components/SignalBadge";
import type { DiagnosticInput, DomainKey } from "../domain/model";
import { DOMAINS } from "../domain/model";
import type { StressResult } from "../engine/stressAnalysis";

const FRAMEWORK_EDITION = "CloudPedagogy AI Capability Framework (2026 Edition)";

function domainLabel(key: DomainKey): string {
  return DOMAINS.find((d) => d.key === key)?.label ?? key;
}

function domainDescription(key: DomainKey): string {
  return DOMAINS.find((d) => d.key === key)?.description ?? "";
}

function nowTimestampUTC(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

function whyThisMattersText(related: DomainKey[], scenarioTitle: string): string {
  const labels = related.map(domainLabel);
  if (labels.length === 0) {
    return `This signal connects to multiple capability domains under the scenario “${scenarioTitle}”. Use it to prompt discussion about where the system is strong, fragile, or under-supported.`;
  }
  if (labels.length === 1) {
    return `This signal is primarily about ${labels[0]} under the scenario “${scenarioTitle}”. Weakness here can create downstream fragility even when other areas look strong.`;
  }
  if (labels.length === 2) {
    return `This signal sits at the intersection of ${labels[0]} and ${labels[1]} under the scenario “${scenarioTitle}”. Tensions here often show up as “it works in practice, but it isn’t defensible” (or the reverse).`;
  }
  return `This signal spans several domains (${labels.slice(0, 3).join(", ")}${labels.length > 3 ? "…" : ""}) under the scenario “${scenarioTitle}”. Multi-domain signals usually indicate a system-level pattern rather than a single fix.`;
}

function buildExportText(input: DiagnosticInput, result: StressResult, generatedAt: string): string {
  const lines: string[] = [];

  lines.push("CloudPedagogy — Scenario Stress-Test");
  lines.push("-----------------------------------");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Framework: ${FRAMEWORK_EDITION}`);
  lines.push("");

  lines.push(`Organisation/Team: ${input.orgName}${input.contextNotes ? ` — ${input.contextNotes}` : ""}`);
  lines.push(`Scenario: ${result.scenario.title}`);
  lines.push(`Overall stress profile: ${result.overallStress}`);
  lines.push(`Baseline band: ${result.band}`);
  lines.push(`Baseline average score: ${result.averageScore}/4`);
  lines.push("");

  lines.push("Baseline domain scores (0–4):");
  for (const d of DOMAINS) {
    const score = input.scores[d.key] ?? 0;
    lines.push(`- ${d.label}: ${score}/4`);
  }
  lines.push("");

  lines.push("Scenario pressure (Low/Medium/High):");
  for (const d of DOMAINS) {
    lines.push(`- ${d.label}: ${result.pressure[d.key]}`);
  }
  lines.push("");

  if (input.coverage && Object.keys(input.coverage).length > 0) {
    lines.push("Optional coverage estimates (0–100%):");
    for (const d of DOMAINS) {
      const v = input.coverage[d.key];
      if (typeof v === "number") lines.push(`- ${d.label}: ${v}%`);
    }
    lines.push("");
  }

  lines.push("Stress signals (for discussion):");
  result.signals.forEach((sig, idx) => {
    lines.push("");
    lines.push(`${idx + 1}. [${sig.level}] ${sig.title}`);
    lines.push(`   Rationale: ${sig.rationale}`);
    if (sig.relatedDomains?.length) lines.push(`   Related domains: ${sig.relatedDomains.map(domainLabel).join("; ")}`);
    lines.push("   Discussion prompts:");
    sig.prompts.forEach((p) => lines.push(`   - ${p}`));
    if (sig.stabilisers?.length) {
      lines.push("   Small stabilisers to consider:");
      sig.stabilisers.forEach((s) => lines.push(`   - ${s}`));
    }
  });

  lines.push("");
  lines.push("Note: This output is reflective and exploratory. It is not a prediction, compliance audit, risk register, or automated decision system.");

  return lines.join("\n");
}

export default function ResultsView(props: {
  input: DiagnosticInput;
  result: StressResult;
  onBack: () => void;
}) {
  const { input, result } = props;

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});
  const [generatedAt] = useState<string>(() => nowTimestampUTC());

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const sig of result.signals) {
      if (sig.level === "Concern") initial[sig.id] = true;
    }
    setOpenWhy(initial);
  }, [result]);

  const exportText = useMemo(() => buildExportText(input, result, generatedAt), [input, result, generatedAt]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1600);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = exportText;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopyStatus("copied");
        window.setTimeout(() => setCopyStatus("idle"), 1600);
      } catch {
        setCopyStatus("error");
        window.setTimeout(() => setCopyStatus("idle"), 2000);
      }
    }
  }

  function toggleWhy(id: string) {
    setOpenWhy((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="stack">
      <header>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>Stress-Test Results</h1>
            <p className="secondary" style={{ marginTop: "4px" }}>
              <strong>{input.orgName}</strong>
              {input.contextNotes ? ` — ${input.contextNotes}` : ""}
            </p>
          </div>
          <div className="pill">
            {result.overallStress} stress · {result.band} · Avg {result.averageScore}/4
          </div>
        </div>
      </header>

      <Card
        title="Scenario Analysis"
        right={<span className="muted" style={{ fontSize: "var(--font-size-meta)" }}>{generatedAt}</span>}
      >
        <div style={{ paddingBottom: "8px" }}>
          <div className="kicker">Active Scenario</div>
          <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "8px" }}>{result.scenario.title}</div>
          <div className="secondary" style={{ lineHeight: 1.6, fontSize: "0.95rem" }}>
            {result.scenario.description}
          </div>
        </div>
        
        <div className="muted" style={{ marginTop: "16px", fontSize: "0.85rem", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          Framework: {FRAMEWORK_EDITION}
        </div>
      </Card>

      <Card title="Baseline capability profile">
        <DomainBars scores={input.scores} />
      </Card>

      <Card title="Scenario pressure by domain">
        <p className="muted">
          Pressure reflects scenario demands — it does not change your baseline scores.
        </p>
        <div className="domainTable" style={{ gridTemplateColumns: "1fr", gap: "8px" }}>
          {DOMAINS.map((d) => (
            <div key={d.key} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", padding: "8px 0" }}>
              <span className="secondary" style={{ fontWeight: 500 }}>{d.label}</span>
              <span className="muted">{result.pressure[d.key]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Stress signals (for discussion)">
        <div className="signals">
          {result.signals.map((s) => {
            const isOpen = !!openWhy[s.id];
            const related = (s.relatedDomains ?? []) as DomainKey[];

            return (
              <div key={s.id} className="signal">
                <div className="signal__head">
                  <SignalBadge level={s.level} />
                  <div className="signal__title">{s.title}</div>
                </div>

                <p className="signal__rationale">{s.rationale}</p>

                <div className="signal__meta">
                  {related.length > 0 ? (
                    <div className="metaPills">
                      {related.map((dk) => (
                        <span key={dk} className="metaPill">
                          {domainLabel(dk)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">Related domains: not specified</span>
                  )}

                  <button className="btn btn--small" onClick={() => toggleWhy(s.id)}>
                    {isOpen ? "Hide rationale" : "Why this matters"}
                  </button>
                </div>

                {isOpen && (
                  <div className="whyPanel">
                    <div className="whyPanel__lead">{whyThisMattersText(related, result.scenario.title)}</div>

                    {related.length > 0 && (
                      <>
                        <div className="kicker">Domain context</div>
                        <ul className="whyList">
                          {related.map((dk) => (
                            <li key={dk}>
                              <strong>{domainLabel(dk)}:</strong>{" "}
                              <span className="secondary">{domainDescription(dk)}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="kicker">Guided discussion</div>
                        <ul className="whyList">
                          <li>
                            Ask: <strong>“Where would this show up first under this scenario?”</strong>
                          </li>
                          <li>
                            Ask: <strong>“What would break or become contested?”</strong>
                          </li>
                          <li>
                            Agree one: <strong>evidence to collect</strong> or a <strong>small stabiliser</strong> before scaling.
                          </li>
                        </ul>
                      </>
                    )}
                  </div>
                )}

                <div className="kicker">Discussion prompts</div>
                <ul className="whyList" style={{ paddingLeft: "16px" }}>
                  {s.prompts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>

                {s.stabilisers?.length > 0 && (
                  <>
                    <div className="kicker">Small stabilisers to consider</div>
                    <ul className="whyList" style={{ paddingLeft: "16px" }}>
                      {s.stabilisers.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Export / use">
        <p className="muted">
          Tip: copy/paste the scenario summary and signals into committee papers, QA notes, workshop minutes, or programme documentation.
        </p>

        <div className="actions actions--between" style={{ marginTop: "24px" }}>
          <button className="btn" onClick={props.onBack}>
            Back to setup
          </button>

          <div className="actions">
            <button className="btn" onClick={copyToClipboard}>
              {copyStatus === "copied" ? "Copied ✓" : copyStatus === "error" ? "Copy failed" : "Copy summary"}
            </button>
            <button className="btn btn--primary" onClick={() => window.print()}>
              Print report
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
