import { describe, it, expect } from "vitest";
import { runStressTest, type StressResult } from "../engine/stressAnalysis";
import type { DiagnosticInput } from "../domain/model";
import { SCENARIOS, getScenarioById } from "../domain/scenarios";

function makeInput(overrides?: Partial<DiagnosticInput>): DiagnosticInput {
  return {
    orgName: "Test Org",
    contextNotes: "Higher Education Unit",
    scores: {
      awareness: 2,
      coagency: 2,
      practice: 2,
      ethics: 2,
      governance: 2,
      renewal: 2,
    },
    signals: {
      highStakesUse: false,
      publicFacing: false,
      sensitiveData: false,
      vendorReliance: false,
      unclearOwnership: false,
    },
    capabilityNotes: "Test capability notes",
    governanceNotes: "Test governance notes",
    ...overrides,
  };
}

describe("Stress Analysis Engine", () => {
  const scenario = getScenarioById("rapid-assessment-uptake")!;

  it("calculates baseline average and band correctly", () => {
    const input = makeInput({
      scores: {
        awareness: 3,
        coagency: 3,
        practice: 3,
        ethics: 3,
        governance: 3,
        renewal: 3,
      },
    });
    const result = runStressTest(input, scenario);
    expect(result.averageScore).toBe(3);
    expect(result.band).toBe("Established");
  });

  it("calculates domain impacts using linear pressure weights", () => {
    // For rapid-assessment-uptake:
    // pressureDomains: ["awareness", "coagency", "practice", "ethics", "governance"] -> all High
    // renewal: not in pressureDomains, but liftIf: high has governance/ethics/awareness -> renewal is lifted to Medium
    const input = makeInput({
      scores: {
        awareness: 3,
        coagency: 2,
        practice: 4,
        ethics: 1,
        governance: 2,
        renewal: 2,
      },
    });
    const result = runStressTest(input, scenario);

    // awareness: baseline 3, High (weight 1.0) -> residualStability 2.0, baseline > 2 -> not fragile, Stressed
    const awarenessImpact = result.domainImpacts.find((d) => d.key === "awareness")!;
    expect(awarenessImpact.pressure).toBe("High");
    expect(awarenessImpact.residualStability).toBe(2.0);
    expect(awarenessImpact.isFragile).toBe(false);
    expect(awarenessImpact.status).toBe("Stressed");

    // coagency: baseline 2, High (weight 1.0) -> residualStability 1.0, baseline <= 2 & High -> Fragile
    const coagencyImpact = result.domainImpacts.find((d) => d.key === "coagency")!;
    expect(coagencyImpact.pressure).toBe("High");
    expect(coagencyImpact.residualStability).toBe(1.0);
    expect(coagencyImpact.isFragile).toBe(true);
    expect(coagencyImpact.status).toBe("Fragile");

    // ethics: baseline 1, High (weight 1.0) -> residualStability 0.0 (< 1.0) -> Fragile
    const ethicsImpact = result.domainImpacts.find((d) => d.key === "ethics")!;
    expect(ethicsImpact.pressure).toBe("High");
    expect(ethicsImpact.residualStability).toBe(0.0);
    expect(ethicsImpact.isFragile).toBe(true);
    expect(ethicsImpact.status).toBe("Fragile");

    // renewal: baseline 2, Medium (weight 0.5) -> residualStability 1.5, not High, stability >= 1.0 -> Stable
    const renewalImpact = result.domainImpacts.find((d) => d.key === "renewal")!;
    expect(renewalImpact.pressure).toBe("Medium");
    expect(renewalImpact.residualStability).toBe(1.5);
    expect(renewalImpact.isFragile).toBe(false);
    expect(renewalImpact.status).toBe("Stable");
  });

  it("calculates resilience score normalized to 0-100", () => {
    // If all scores are 4:
    // 5 High domains: 4 - 1.0 = 3.0 each = 15.0
    // 1 Medium domain: 4 - 0.5 = 3.5
    // Total stability = 18.5
    // Max possible stability = 6 * 4 = 24
    // Resilience score = round((18.5 / 24) * 100) = round(77.083) = 77
    const input = makeInput({
      scores: {
        awareness: 4,
        coagency: 4,
        practice: 4,
        ethics: 4,
        governance: 4,
        renewal: 4,
      },
    });
    const result = runStressTest(input, scenario);
    expect(result.resilienceScore).toBe(77);
  });

  it("handles boundary scores of all 0s correctly without negative stability", () => {
    const input = makeInput({
      scores: {
        awareness: 0,
        coagency: 0,
        practice: 0,
        ethics: 0,
        governance: 0,
        renewal: 0,
      },
    });
    const result = runStressTest(input, scenario);
    expect(result.averageScore).toBe(0);
    expect(result.resilienceScore).toBe(0);
    for (const d of result.domainImpacts) {
      expect(d.residualStability).toBe(0);
      expect(d.isFragile).toBe(true);
      expect(d.status).toBe("Fragile");
    }
    expect(result.overallStress).toBe("High");
  });

  describe("Signal generation & Overall Stress logic", () => {
    it("generates critical fragility signal when fragile domains exist", () => {
      const input = makeInput({
        scores: {
          awareness: 2,
          coagency: 2,
          practice: 2,
          ethics: 2,
          governance: 2,
          renewal: 2,
        },
      });
      const result = runStressTest(input, scenario);
      const fragilitySig = result.signals.find((s) => s.id.includes("concern") && s.title.includes("Critical fragility"));
      expect(fragilitySig).toBeDefined();
      expect(fragilitySig?.level).toBe("Concern");
      expect(fragilitySig?.relatedDomains.length).toBeGreaterThan(0);
    });

    it("triggers spread >= 3 concern signal for wide capability imbalance", () => {
      const sc = getScenarioById("vendor-disruption")!;
      // pressureDomains: practice, governance, renewal
      const input = makeInput({
        scores: {
          awareness: 4,
          coagency: 4,
          practice: 4,
          ethics: 1,
          governance: 3,
          renewal: 3,
        },
      });
      const result = runStressTest(input, sc);
      const imbalanceSig = result.signals.find((s) => s.title.includes("Capability imbalance becomes more visible"));
      expect(imbalanceSig).toBeDefined();
      expect(imbalanceSig?.level).toBe("Concern");
    });

    it("triggers spread === 2 watch signal for moderate capability imbalance", () => {
      const sc = getScenarioById("vendor-disruption")!;
      const input = makeInput({
        scores: {
          awareness: 3,
          coagency: 3,
          practice: 3,
          ethics: 1,
          governance: 3,
          renewal: 3,
        },
      });
      const result = runStressTest(input, sc);
      const imbalanceSig = result.signals.find((s) => s.title.includes("Moderate imbalance"));
      expect(imbalanceSig).toBeDefined();
      expect(imbalanceSig?.level).toBe("Watch");
    });

    it("triggers high-stakes exposure signal when high exposure and ethics/governance <= 1", () => {
      const sc = getScenarioById("regulatory-tightening")!;
      const input = makeInput({
        signals: {
          highStakesUse: true,
          publicFacing: false,
          sensitiveData: false,
          vendorReliance: false,
          unclearOwnership: false,
        },
        scores: {
          awareness: 3,
          coagency: 3,
          practice: 3,
          ethics: 1,
          governance: 3,
          renewal: 3,
        },
      });
      const result = runStressTest(input, sc);
      const exposureSig = result.signals.find((s) => s.title.includes("Exposure under high-stakes conditions"));
      expect(exposureSig).toBeDefined();
      expect(exposureSig?.level).toBe("Concern");
    });

    it("triggers renewal disruption signal when renewal is high pressure and baseline renewal <= 1", () => {
      const sc = getScenarioById("public-incident")!; // pressureDomains includes renewal
      const input = makeInput({
        scores: {
          awareness: 3,
          coagency: 3,
          practice: 3,
          ethics: 3,
          governance: 3,
          renewal: 1,
        },
      });
      const result = runStressTest(input, sc);
      const renewalSig = result.signals.find((s) => s.title.includes("Learning and recovery capacity may be insufficient"));
      expect(renewalSig).toBeDefined();
      expect(renewalSig?.level).toBe("Concern");
    });

    it("triggers coverage unevenness signal when coverage spread >= 40", () => {
      const input = makeInput({
        coverage: {
          awareness: 80,
          coagency: 20,
          practice: 50,
        },
      });
      const result = runStressTest(input, scenario);
      const covSig = result.signals.find((s) => s.title.includes("Coverage may be uneven"));
      expect(covSig).toBeDefined();
      expect(covSig?.level).toBe("Watch");
    });

    it("outputs info signal when no major stress signals are triggered", () => {
      // Scenario with low pressure or high baseline scores across all pressured domains
      const sc = getScenarioById("vendor-disruption")!;
      const input = makeInput({
        scores: {
          awareness: 3,
          coagency: 3,
          practice: 4,
          ethics: 3,
          governance: 4,
          renewal: 4,
        },
      });
      const result = runStressTest(input, sc);
      expect(result.overallStress).toBe("Low");
      const infoSig = result.signals.find((s) => s.id.includes("info") && s.level === "Info");
      expect(infoSig).toBeDefined();
    });

    it("evaluates overallStress correctly: High vs Moderate vs Low", () => {
      // High: concernCount >= 2
      const highStressResult: StressResult = runStressTest(
        makeInput({
          scores: {
            awareness: 1,
            coagency: 1,
            practice: 1,
            ethics: 1,
            governance: 1,
            renewal: 1,
          },
        }),
        scenario
      );
      expect(highStressResult.overallStress).toBe("High");
    });
  });

  describe("All 6 canonical scenarios can be evaluated", () => {
    it.each(SCENARIOS)("runs stress test for scenario %s", (sc) => {
      const input = makeInput();
      const result = runStressTest(input, sc);
      expect(result.scenario.id).toBe(sc.id);
      expect(result.domainImpacts).toHaveLength(6);
      expect(result.resilienceScore).toBeGreaterThanOrEqual(0);
      expect(result.resilienceScore).toBeLessThanOrEqual(100);
      expect(["Low", "Moderate", "High"]).toContain(result.overallStress);
    });
  });
});
