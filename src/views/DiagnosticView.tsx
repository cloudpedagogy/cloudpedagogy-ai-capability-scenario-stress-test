import { useMemo, useState } from "react";
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

  if (stage === "results" && result) {
    return <ResultsView input={buildInput()} result={result} onBack={() => setStage("input")} />;
  }

  return (
    <div className="stack">
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
        <p className="muted" style={{ marginTop: 0 }}>
          These are reflective estimates. Use them to support discussion — not to “get the right number”.
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
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

      <Card title="Scenario selection (choose one plausible or strategically relevant scenario)">
        <div className="checks">
          {SCENARIOS.map((s) => {
            const active = s.id === scenarioId;
            return (
              <label key={s.id} className="check" style={{ alignItems: "flex-start" }}>
                <input
                  type="radio"
                  name="scenario"
                  checked={active}
                  onChange={() => setScenarioId(s.id)}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>{s.title}</div>
                  <div className="muted" style={{ lineHeight: 1.45, marginTop: 4 }}>
                    {s.description}
                  </div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    <strong>Key stressors:</strong>
                    <ul style={{ marginTop: 6 }}>
                      {s.stressors.map((x) => (
                        <li key={x}>{x}</li>
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
        <p className="muted" style={{ marginTop: 0 }}>
          Used to tune stress signals — still reflective.
        </p>

        <div className="checks">
          <label className="check">
            <input
              type="checkbox"
              checked={signals.highStakesUse}
              onChange={() => toggleSignal("highStakesUse")}
            />
            <div>High-stakes use (assessment, consequential decisions, clinical, admissions, etc.)</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.publicFacing}
              onChange={() => toggleSignal("publicFacing")}
            />
            <div>Public-facing outputs (published externally or used with external stakeholders)</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.sensitiveData}
              onChange={() => toggleSignal("sensitiveData")}
            />
            <div>Sensitive / confidential data involved</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.vendorReliance}
              onChange={() => toggleSignal("vendorReliance")}
            />
            <div>Heavy reliance on a single vendor/toolchain</div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={signals.unclearOwnership}
              onChange={() => toggleSignal("unclearOwnership")}
            />
            <div>Unclear ownership/accountability for AI-supported work</div>
          </label>
        </div>
      </Card>

      <Card title="Programme coverage estimates (optional)">
        <p className="muted" style={{ marginTop: 0 }}>
          Include rough coverage estimates (0–100%) to detect structural imbalance under stress.
        </p>

        <label className="check" style={{ marginTop: 8 }}>
          <input
            type="checkbox"
            checked={coverageEnabled}
            onChange={() => setCoverageEnabled((v) => !v)}
          />
          <div>Enable coverage estimates</div>
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
                      Approximate proportion of attention/learning/practice in this domain.
                    </div>
                  </div>
                  <div className="domainRow__right">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={v}
                      onChange={(e) => setCoverageValue(d.key, Number(e.target.value))}
                      style={{ width: 110 }}
                    />
                    <span className="muted">%</span>
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
    </div>
  );
}
