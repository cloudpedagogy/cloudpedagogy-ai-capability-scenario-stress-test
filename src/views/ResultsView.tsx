import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import DomainBars from "../components/DomainBars";
import SignalBadge from "../components/SignalBadge";
import type { DiagnosticInput, DomainKey } from "../domain/model";
import { DOMAINS } from "../domain/model";
import type { StressResult } from "../engine/stressAnalysis";
import { downloadReport } from "../engine/export";

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
          <div style={{ textAlign: "right" }}>
            <div className="pill" style={{ marginBottom: "8px" }}>
              {result.overallStress} stress · {result.band} · Avg {result.averageScore}/4
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{generatedAt}</div>
          </div>
        </div>
      </header>

      {/* Resilience Score & Scenario Intro */}
      <div className="grid2" style={{ gridTemplateColumns: "1fr 340px" }}>
        <Card title="Scenario Analysis">
          <div style={{ paddingBottom: "8px" }}>
            <div className="kicker">Active Scenario</div>
            <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "8px" }}>{result.scenario.title}</div>
            <div className="secondary" style={{ lineHeight: 1.6, fontSize: "0.95rem" }}>
              {result.scenario.description}
            </div>
          </div>
          <div className="muted" style={{ marginTop: "16px", fontSize: "0.85rem", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
            Note: Results are scenario-based simulations, not predictive audit or compliance outputs.
          </div>
        </Card>

        {(() => {
          const resilienceLabel = result.resilienceScore >= 80 ? "Robust" : result.resilienceScore >= 60 ? "Stable" : result.resilienceScore >= 40 ? "Stressed" : "Critical";
          const resilienceColor = result.resilienceScore >= 60 ? "#111" : result.resilienceScore >= 40 ? "#d97706" : "#dc2626";
          return (
            <div style={{ borderLeft: `4px solid ${resilienceColor}` }}>
              <Card title="Scenario Resilience Index">
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ fontSize: "3rem", fontWeight: 800, color: resilienceColor, lineHeight: 1 }}>{result.resilienceScore}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 600, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{resilienceLabel}</div>
                  <p className="muted" style={{ marginTop: "12px", fontSize: "0.85rem" }}>
                    Institutional stability indicator under this specific scenario.
                  </p>
                </div>
              </Card>
            </div>
          );
        })()}
      </div>

      <Card title="Baseline capability profile">
        <DomainBars scores={input.scores} />
      </Card>

      <Card title="Domain Impact Matrix">
        <p className="muted" style={{ marginBottom: "20px" }}>
          Primary analytical view showing how capability holds up under pressure.
        </p>
        <div className="impactScroll" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Domain</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Baseline</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Pressure</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Stability</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.domainImpacts.map((d) => (
                <tr key={d.key} style={{ borderBottom: "1px solid #f0f0f0", background: d.isFragile ? "#fff5f5" : "transparent" }}>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ fontWeight: 600 }}>{d.label}</div>
                    <div className="muted" style={{ fontSize: "11px" }}>{domainDescription(d.key)}</div>
                  </td>
                  <td style={{ padding: "16px 8px" }}>{d.baseline}/4</td>
                  <td style={{ padding: "16px 8px" }}>
                    <span className={`badge badge--${d.pressure.toLowerCase()}`} style={{ fontSize: "10px" }}>{d.pressure}</span>
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    {d.residualStability.toFixed(1)}
                    {(() => {
                      const drop = d.baseline - d.residualStability;
                      let impact = "Low Impact";
                      let color = "#10b981";
                      if (drop > 1.0) { impact = "High Impact"; color = "#ef4444"; }
                      else if (drop >= 0.5) { impact = "Moderate Impact"; color = "#f59e0b"; }
                      
                      return (
                        <div style={{ fontSize: "9px", fontWeight: 700, color: color, textTransform: "uppercase", marginTop: "4px" }}>
                          {impact}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: "10px", 
                      textTransform: "uppercase",
                      color: d.status === "Fragile" ? "#dc2626" : d.status === "Stressed" ? "#d97706" : "#4b5563"
                    }}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <Card title="Export / Report Generation">
        <p className="muted">
          Generate governance-ready reports for committee review, institutional QA, or programme documentation.
        </p>

        <div className="actions actions--between" style={{ marginTop: "24px" }}>
          <button className="btn" onClick={props.onBack}>
            Back to setup
          </button>

          <div className="actions">
            <button className="btn" onClick={copyToClipboard}>
              {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Error" : "Copy to Clipboard"}
            </button>
            <button className="btn" onClick={() => downloadReport(input, result, "json")}>
              Download JSON
            </button>
            <button className="btn" onClick={() => downloadReport(input, result, "markdown")}>
              Download Markdown Report
            </button>
            <button className="btn btn--primary" onClick={() => window.print()}>
              Print PDF
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
