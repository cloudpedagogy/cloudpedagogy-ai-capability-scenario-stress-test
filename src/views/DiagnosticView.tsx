import { useMemo, useState, useRef } from "react";
import Card from "../components/Card";
import type { DiagnosticInput, DomainKey } from "../domain/model";
import { DOMAINS } from "../domain/model";
import ResultsView from "./ResultsView";
import { SCENARIOS, getScenarioById } from "../domain/scenarios";
import { runStressTest, type StressResult } from "../engine/stressAnalysis";

type Stage = "input" | "results";

const SCALE_LABELS: Record<number, string> = {
  0: "Not present",
  1: "Emerging",
  2: "Developing",
  3: "Established",
  4: "Leading",
};

export default function DiagnosticView(props: { onRestart: () => void }) {
  const [stage, setStage] = useState<Stage>("input");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgName, setOrgName] = useState<string>("My team / organisation");
  const [contextNotes, setContextNotes] = useState<string>("");

  const [scores, setScores] = useState<Record<DomainKey, number>>({
    awareness: 2,
    coagency: 2,
    practice: 2,
    ethics: 2,
    governance: 2,
    renewal: 2,
  });

  const [signals, setSignals] = useState({
    highStakesUse: false,
    publicFacing: false,
    sensitiveData: false,
    vendorReliance: false,
    unclearOwnership: false,
  });

  const [coverageEnabled, setCoverageEnabled] = useState(false);
  const [coverage, setCoverage] = useState<Record<DomainKey, number>>({
    awareness: 50,
    coagency: 50,
    practice: 50,
    ethics: 50,
    governance: 50,
    renewal: 50,
  });

  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0]?.id ?? "");
  const selectedScenario = useMemo(() => getScenarioById(scenarioId), [scenarioId]);

  const [capabilityNotes, setCapabilityNotes] = useState<string>("");
  const [governanceNotes, setGovernanceNotes] = useState<string>("");
  const [notesExpanded, setNotesExpanded] = useState(false);

  const [result, setResult] = useState<StressResult | null>(null);

  function setScore(key: DomainKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSignal(key: keyof typeof signals) {
    setSignals((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setCoverageValue(key: DomainKey, value: number) {
    setCoverage((prev) => ({ ...prev, [key]: value }));
  }

  function buildInput(): DiagnosticInput {
    return {
      orgName,
      contextNotes,
      scores,
      signals,
      coverage: coverageEnabled ? coverage : undefined,
      capabilityNotes,
      governanceNotes,
    };
  }

  function onRun() {
    const input = buildInput();
    if (!selectedScenario) return;
    const r = runStressTest(input, selectedScenario);
    setResult(r);
    setStage("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.metadata?.organisation) setOrgName(json.metadata.organisation);
        if (json.metadata?.context) setContextNotes(json.metadata.context);
        if (json.capabilities?.scores) {
          const newScores = { ...scores };
          Object.keys(json.capabilities.scores).forEach((k) => {
            if (k in newScores) newScores[k as DomainKey] = json.capabilities.scores[k];
          });
          setScores(newScores);
        }
        if (json.context_flags) {
          setSignals({
            highStakesUse: !!json.context_flags.high_stakes_use,
            publicFacing: !!json.context_flags.public_facing,
            sensitiveData: !!json.context_flags.sensitive_data,
            vendorReliance: !!json.context_flags.vendor_reliance,
            unclearOwnership: !!json.context_flags.unclear_ownership,
          });
        }
        if (json.capabilityNotes) setCapabilityNotes(json.capabilityNotes);
        if (json.governanceNotes) setGovernanceNotes(json.governanceNotes);
      } catch (err) {
        console.error("Failed to parse JSON file:", err);
        alert("Failed to load JSON file.");
      }
    };
    reader.readAsText(file);
  }

  if (stage === "results" && result) {
    return <ResultsView input={buildInput()} result={result} onBack={() => setStage("input")} />;
  }

  return (
    <div className="stack">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Stress-Test Setup</h1>
          <p className="secondary" style={{ marginTop: "4px" }}>Provide baseline capability scores and select a scenario to analyze fragility.</p>
        </div>
        <div>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            Load from Diagnostic JSON
          </button>
        </div>
      </header>

      <Card title="Context">
        <div className="grid2">
          <div className="field">
            <div className="field__label">Team / organisation name</div>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="field">
            <div className="field__label">Notes (optional)</div>
            <input
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="e.g., programme team, public service unit, research group..."
            />
          </div>
        </div>
      </Card>

      <Card title="Baseline capability profile (0–4)">
        <p className="muted">
          These are reflective estimates. Use them to support discussion — not to “get the right number”.
        </p>
        <p className="muted">
          If completing this as a team, agree scores through discussion rather than averaging individual views.
        </p>

        <div className="domainTable">
          {DOMAINS.map((d) => {
            const v = scores[d.key] ?? 0;
            return (
              <div key={d.key} className="domainRow">
                <div>
                  <div className="domainRow__label">{d.label}</div>
                  <div className="domainRow__desc">{d.description}</div>
                </div>
                <div className="domainRow__right">
                  <select value={v} onChange={(e) => setScore(d.key, Number(e.target.value))}>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} — {SCALE_LABELS[n]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Scenario selection">
        <div className="checks">
          {SCENARIOS.map((s) => {
            const active = s.id === scenarioId;
            return (
              <label key={s.id} className="check">
                <input
                  type="radio"
                  name="scenario"
                  checked={active}
                  onChange={() => setScenarioId(s.id)}
                />
                <div>
                  <div className="card__title" style={{ fontSize: "1.1rem" }}>{s.title}</div>
                  <div className="secondary" style={{ marginTop: "6px", fontSize: "0.95rem" }}>
                    {s.description}
                  </div>
                  <div className="muted" style={{ marginTop: "12px", fontSize: "0.85rem" }}>
                    <strong style={{ color: "#111" }}>Key stressors:</strong>
                    <ul style={{ marginTop: "6px" }}>
                      {s.stressors.map((x) => (
                        <li key={x} style={{ fontSize: "0.85rem" }}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      <Card title="Context signals (optional)">
        <p className="muted">
          Used to tune stress signals — still reflective.
        </p>

        <div className="checks">
          <label className="check">
            <input
              type="checkbox"
              checked={signals.highStakesUse}
              onChange={() => toggleSignal("highStakesUse")}
            />
            <div className="secondary">High-stakes use (assessment, consequential decisions, clinical, admissions, etc.)</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.publicFacing}
              onChange={() => toggleSignal("publicFacing")}
            />
            <div className="secondary">Public-facing outputs (published externally or used with external stakeholders)</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.sensitiveData}
              onChange={() => toggleSignal("sensitiveData")}
            />
            <div className="secondary">Sensitive / confidential data involved</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.vendorReliance}
              onChange={() => toggleSignal("vendorReliance")}
            />
            <div className="secondary">Heavy reliance on a single vendor/toolchain</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.unclearOwnership}
              onChange={() => toggleSignal("unclearOwnership")}
            />
            <div className="secondary">Unclear ownership/accountability for AI-supported work</div>
          </label>
        </div>
      </Card>

      <Card title="Programme coverage estimates (optional)">
        <p className="muted">
          Include rough coverage estimates (0–100%) to detect structural imbalance under stress.
        </p>

        <label className="check" style={{ marginTop: "12px" }}>
          <input
            type="checkbox"
            checked={coverageEnabled}
            onChange={() => setCoverageEnabled((v) => !v)}
          />
          <div className="secondary" style={{ fontWeight: 500 }}>Enable coverage estimates</div>
        </label>

        {coverageEnabled && (
          <div className="domainTable">
            {DOMAINS.map((d) => {
              const v = coverage[d.key] ?? 0;
              return (
                <div key={d.key} className="domainRow">
                  <div>
                    <div className="domainRow__label">{d.label}</div>
                    <div className="domainRow__desc">
                      Approximate proportion of attention/practice in this domain.
                    </div>
                  </div>
                  <div className="domainRow__right">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={v}
                      onChange={(e) => setCoverageValue(d.key, Number(e.target.value))}
                      style={{ width: "90px" }}
                    />
                    <span className="muted" style={{ marginLeft: "8px" }}>%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="actions actions--between">
        <button className="btn" onClick={props.onRestart}>
          Back
        </button>
        <button className="btn btn--primary" onClick={onRun} disabled={!selectedScenario}>
          Run stress-test
        </button>
      </div>

      {/* Lightweight capability and governance layer */}
      {/* Optional, non-blocking, and does not alter core workflow */}
      <div style={{ marginTop: "40px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <button 
          className="btn btn--small" 
          onClick={() => setNotesExpanded(!notesExpanded)}
          style={{ marginBottom: "12px", background: "none", border: "1px solid var(--line)", color: "var(--secondary)" }}
        >
          {notesExpanded ? "− Hide" : "+ Add"} Capability & Governance Notes (Optional)
        </button>

        {notesExpanded && (
          <div className="stack" style={{ gap: "16px", marginTop: "12px" }}>
            <div className="field">
              <div className="field__label" style={{ fontSize: "0.8rem", color: "var(--secondary)" }}>Capability Notes</div>
              <textarea 
                value={capabilityNotes}
                onChange={(e) => setCapabilityNotes(e.target.value)}
                placeholder="How is AI capability developed through this work?"
                style={{ minHeight: "80px", fontSize: "0.9rem", width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "4px" }}
              />
            </div>
            <div className="field">
              <div className="field__label" style={{ fontSize: "0.8rem", color: "var(--secondary)" }}>Governance Notes</div>
              <textarea 
                value={governanceNotes}
                onChange={(e) => setGovernanceNotes(e.target.value)}
                placeholder="Assumptions, risks, or human review notes..."
                style={{ minHeight: "80px", fontSize: "0.9rem", width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "4px" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
