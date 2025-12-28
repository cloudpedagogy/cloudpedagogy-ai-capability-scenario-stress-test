import type { DomainKey, DiagnosticInput } from "../domain/model";
import { DOMAINS, bandForAverage } from "../domain/model";
import type { Scenario } from "../domain/scenarios";

export type PressureLevel = "Low" | "Medium" | "High";
export type SignalLevel = "Info" | "Watch" | "Concern";

export type StressSignal = {
  id: string;
  level: SignalLevel;
  title: string;
  rationale: string;
  relatedDomains: DomainKey[];
  prompts: string[];
  stabilisers: string[];
};

export type StressResult = {
  scenario: Scenario;
  pressure: Record<DomainKey, PressureLevel>;
  overallStress: "Low" | "Moderate" | "High";
  summary: {
    strengths: string[];
    vulnerabilities: string[];
    stabilisers: string[];
  };
  signals: StressSignal[];
  averageScore: number;
  band: string;
};

function avgScore(scores: Record<DomainKey, number>): number {
  const vals = DOMAINS.map((d) => scores[d.key] ?? 0);
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / vals.length) * 100) / 100;
}

function spread(scores: Record<DomainKey, number>): number {
  const vals = DOMAINS.map((d) => scores[d.key] ?? 0);
  return Math.max(...vals) - Math.min(...vals);
}

function isHighExposure(input: DiagnosticInput): boolean {
  const s = input.signals;
  return Boolean(s.highStakesUse || s.publicFacing || s.sensitiveData);
}

function pressureMapForScenario(scenario: Scenario): Record<DomainKey, PressureLevel> {
  const map = {} as Record<DomainKey, PressureLevel>;
  const high = new Set<DomainKey>(scenario.pressureDomains);

  for (const d of DOMAINS) {
    map[d.key] = high.has(d.key) ? "High" : "Low";
  }

  // Gentle “Medium” lift (simple heuristic) to avoid binary feel.
  const liftIf = (k: DomainKey) => {
    if (map[k] !== "High") map[k] = "Medium";
  };

  if (high.has("governance") || high.has("ethics")) liftIf("awareness");
  if (high.has("practice") || high.has("coagency")) liftIf("governance");
  if (high.has("governance") || high.has("ethics") || high.has("awareness")) liftIf("renewal");

  return map;
}

function makeSignal(partial: Omit<StressSignal, "id">, idx: number): StressSignal {
  return { id: `sig_${idx}_${partial.level.toLowerCase()}`, ...partial };
}

export function runStressTest(input: DiagnosticInput, scenario: Scenario): StressResult {
  const pressure = pressureMapForScenario(scenario);

  const averageScore = avgScore(input.scores);
  const band = bandForAverage(averageScore);
  const sp = spread(input.scores);
  const hiExposure = isHighExposure(input);

  const strengths: string[] = [];
  const vulnerabilities: string[] = [];
  const stabilisers: string[] = [];

  for (const d of DOMAINS) {
    const score = input.scores[d.key] ?? 0;
    if (score >= 3) strengths.push(`${d.label} (score ${score}/4)`);
    if (score <= 1) vulnerabilities.push(`${d.label} (score ${score}/4)`);
  }

  if (averageScore >= 2.5) stabilisers.push("A generally developing-to-established baseline supports adaptation under change.");
  if ((input.scores.governance ?? 0) >= 3) stabilisers.push("Governance strength improves defensibility when conditions shift.");
  if ((input.scores.awareness ?? 0) >= 3) stabilisers.push("Strong orientation reduces misuse and unrealistic expectations under stress.");
  if ((input.scores.renewal ?? 0) >= 3) stabilisers.push("Renewal practices support learning, recovery, and resilience after disruption.");

  const signals: StressSignal[] = [];

  const lowInHighPressure = DOMAINS
    .filter((d) => pressure[d.key] === "High" && (input.scores[d.key] ?? 0) <= 1)
    .map((d) => d.key);

  const lowAny = DOMAINS.filter((d) => (input.scores[d.key] ?? 0) <= 1).map((d) => d.key);

  if (lowInHighPressure.length > 0) {
    signals.push(
      makeSignal(
        {
          level: "Concern",
          title: "Low capability in domains under high scenario pressure",
          rationale:
            "This scenario places high demands on specific capability domains. Where baseline capability is still emerging, work can become fragile: small missteps may create outsized downstream impact.",
          relatedDomains: lowInHighPressure,
          prompts: [
            "Where would this scenario show up first in our workflow?",
            "What would fail or become contested if conditions changed quickly?",
            "What is the smallest stabilising step we could introduce before scaling use?",
          ],
          stabilisers: [
            "Add a lightweight review checkpoint for high-impact outputs in this scenario.",
            "Clarify ownership: who approves, who reviews, who is accountable when things go wrong?",
          ],
        },
        signals.length
      )
    );
  }

  if (sp >= 3) {
    signals.push(
      makeSignal(
        {
          level: "Concern",
          title: "Capability imbalance becomes more visible under stress",
          rationale:
            `Your baseline scores vary widely (spread = ${sp}). Under change scenarios, uneven capability often shows up as “innovation outpacing governance”, or “awareness without reliable practice”.`,
          relatedDomains: (lowAny.slice(0, 4) as DomainKey[]),
          prompts: [
            "Which domain is currently carrying the most load — and is that sustainable?",
            "Where are people improvising because the system lacks guidance or structure?",
            "If you strengthened just one weak domain, which would reduce the most downstream risk?",
          ],
          stabilisers: [
            "Pick one weak domain and agree a 30-day stabiliser: an artefact, checkpoint, or shared practice.",
            "Make one assumption explicit (in writing) that this scenario challenges.",
          ],
        },
        signals.length
      )
    );
  } else if (sp === 2) {
    signals.push(
      makeSignal(
        {
          level: "Watch",
          title: "Moderate imbalance may create friction under change",
          rationale:
            `Your baseline scores show some variation (spread = ${sp}). This may be manageable now, but scenarios often amplify weak links.`,
          relatedDomains: (lowAny.slice(0, 3) as DomainKey[]),
          prompts: [
            "Where does capability feel uneven across teams or modules?",
            "What relies on informal workarounds rather than shared practice?",
            "What would be a small stabiliser you could pilot next month?",
          ],
          stabilisers: [
            "Agree a shared minimum practice for one pressured area (e.g., documentation, review, role clarity).",
          ],
        },
        signals.length
      )
    );
  }

  if (hiExposure) {
    const ethics = input.scores.ethics ?? 0;
    const gov = input.scores.governance ?? 0;

    if (ethics <= 1 || gov <= 1) {
      signals.push(
        makeSignal(
          {
            level: "Concern",
            title: "Exposure under high-stakes, public-facing, or sensitive-data conditions",
            rationale:
              "You’ve indicated high exposure conditions. When ethics and governance capability are still emerging, the organisation is more exposed to harm, reputational risk, and contested decisions — especially under change.",
            relatedDomains: ["ethics", "governance"],
            prompts: [
              "What are the current ‘red lines’ (non-negotiables) for AI use — and are they shared and documented?",
              "Where does accountability sit today (named role), and where is it ambiguous?",
              "What review step could you introduce before outputs are used externally or in consequential decisions?",
            ],
            stabilisers: [
              "Introduce a lightweight pre-use check for external or high-stakes outputs (even a one-page checklist).",
              "Maintain a short decision log: why AI was used, what was checked, who approved.",
            ],
          },
          signals.length
        )
      );
    }
  }

  const renewal = input.scores.renewal ?? 0;
  if (pressure.renewal === "High" && renewal <= 1) {
    signals.push(
      makeSignal(
        {
          level: "Concern",
          title: "Learning and recovery capacity may be insufficient under disruption",
          rationale:
            "This scenario increases the need for learning loops, review cycles, and institutional memory. With renewal capability still emerging, teams can repeat mistakes or struggle to recover after change.",
          relatedDomains: ["renewal"],
          prompts: [
            "Where do we currently capture lessons learned — and who actually reads them?",
            "How would we know quickly that something has gone wrong under this scenario?",
            "What is one lightweight review cycle we could introduce (monthly/quarterly) without bureaucracy?",
          ],
          stabilisers: [
            "Create a single shared log: ‘What we tried / what we learned / what changed’.",
            "Add a short retrospective step after major AI-supported decisions or outputs.",
          ],
        },
        signals.length
      )
    );
  }

  const cov = input.coverage ?? {};
  const covValues = Object.values(cov).filter((v) => typeof v === "number") as number[];
  if (covValues.length >= 3) {
    const max = Math.max(...covValues);
    const min = Math.min(...covValues);
    const covSpread = Math.round((max - min) * 100) / 100;

    if (covSpread >= 40) {
      signals.push(
        makeSignal(
          {
            level: "Watch",
            title: "Coverage may be uneven across the programme/system under stress",
            rationale:
              `Your optional coverage estimates vary significantly (spread ≈ ${covSpread}%). Under scenario pressure, neglected domains often become visible through failure, friction, or contestation.`,
            relatedDomains: DOMAINS.map((d) => d.key),
            prompts: [
              "Which domains are ‘assumed’ rather than taught or practiced?",
              "Where do people learn governance/ethics/renewal informally — and is that reliable?",
              "What is one small structural change that would increase coverage of a neglected domain?",
            ],
            stabilisers: [
              "Add one explicit touchpoint for a neglected domain (a short activity, checkpoint, or artefact).",
            ],
          },
          signals.length
        )
      );
    }
  }

  const concernCount = signals.filter((s) => s.level === "Concern").length;
  const watchCount = signals.filter((s) => s.level === "Watch").length;

  let overallStress: "Low" | "Moderate" | "High" = "Low";
  if (concernCount >= 2 || (concernCount >= 1 && lowInHighPressure.length >= 2)) overallStress = "High";
  else if (concernCount === 1 || watchCount >= 2) overallStress = "Moderate";

  if (signals.length === 0) {
    signals.push(
      makeSignal(
        {
          level: "Info",
          title: "No major stress signals triggered",
          rationale:
            "Based on the inputs provided, this scenario does not surface strong stress patterns. Use this result to confirm assumptions and decide what evidence would strengthen confidence.",
          relatedDomains: scenario.pressureDomains,
          prompts: [
            "What evidence would we want before scaling under this scenario?",
            "Which assumptions might still be wrong even if capability looks balanced?",
          ],
          stabilisers: ["Run a short tabletop exercise: walk one real workflow through this scenario."],
        },
        signals.length
      )
    );
  }

  return {
    scenario,
    pressure,
    overallStress,
    summary: {
      strengths: strengths.slice(0, 3),
      vulnerabilities: vulnerabilities.slice(0, 3),
      stabilisers: stabilisers.slice(0, 3),
    },
    signals,
    averageScore,
    band,
  };
}
