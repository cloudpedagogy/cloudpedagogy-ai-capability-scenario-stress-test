import { describe, it, expect } from "vitest";
import { analyseGapsAndRisk } from "../engine/analysis";
import type { DiagnosticInput } from "../domain/model";

describe("Diagnostic Analysis (analyseGapsAndRisk)", () => {
  const baseInput: DiagnosticInput = {
    orgName: "Sample Institution",
    contextNotes: "Faculty review",
    scores: {
      awareness: 3,
      coagency: 3,
      practice: 3,
      ethics: 3,
      governance: 3,
      renewal: 3,
    },
    signals: {
      highStakesUse: false,
      publicFacing: false,
      sensitiveData: false,
      vendorReliance: false,
      unclearOwnership: false,
    },
  };

  it("calculates balanced profile without severe risk signals", () => {
    const res = analyseGapsAndRisk(baseInput);
    expect(res.averageScore).toBe(3);
    expect(res.band).toBe("Established");
    expect(res.domainStats).toHaveLength(6);
    expect(res.signals.length).toBeGreaterThan(0);
  });

  it("triggers low-floor signal when any domain <= 1", () => {
    const res = analyseGapsAndRisk({
      ...baseInput,
      scores: {
        ...baseInput.scores,
        ethics: 1,
      },
    });
    const lowFloorSig = res.signals.find((s) => s.id === "low-floor");
    expect(lowFloorSig).toBeDefined();
    expect(lowFloorSig?.level).toBe("Concern");
  });

  it("triggers imbalance signal when spread >= 2", () => {
    const res = analyseGapsAndRisk({
      ...baseInput,
      scores: {
        awareness: 4,
        coagency: 2,
        practice: 3,
        ethics: 2,
        governance: 2,
        renewal: 2,
      },
    });
    const imbalanceSig = res.signals.find((s) => s.id === "imbalance");
    expect(imbalanceSig).toBeDefined();
  });
});
