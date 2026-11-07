import { describe, it, expect } from "vitest";
import { validateDiagnosticJson } from "../engine/importDiagnostic";

describe("validateDiagnosticJson (Phase 3 & Phase 4)", () => {
  // Representative fixture directly from cloudpedagogy-ai-capability-gaps-risk commit b9e77ab7a06bb2a89df9e26f6ed71bb97f145dd8
  const validUpstreamFixture = {
    metadata: {
      organisation: "Department of Education & Technology",
      context: "Postgraduate programme steering group",
      capability_notes: "Iterative staff workshops completed across semester 1",
      governance_notes: "Ethical review panel meets monthly",
      timestamp: "2026-11-07T12:00:00.000Z",
      framework: "CloudPedagogy AI Capability Framework (2026 Edition)",
    },
    capabilities: {
      overall_band: "Developing",
      average_score: 2.33,
      scores: {
        awareness: 3,
        coagency: 2,
        practice: 3,
        ethics: 2,
        governance: 2,
        renewal: 2,
      },
      ranked_gaps: [
        { domain: "Ethics, Equity & Impact", severity: 2 },
        { domain: "Human–AI Co-Agency", severity: 2 },
      ],
    },
    risk_profile: {
      priorities: [
        {
          title: "Ethics/Governance exposure under high-stakes conditions",
          weight: 8,
          level: "Concern",
          rationale: "High stakes conditions identified.",
          related_domains: ["ethics", "governance"],
        },
      ],
      all_signals: [
        {
          id: "ethics-gov-exposure",
          title: "Ethics/Governance exposure under high-stakes conditions",
          weight: 8,
          level: "Concern",
        },
      ],
    },
    context_flags: {
      high_stakes_use: true,
      public_facing: false,
      sensitive_data: true,
      vendor_reliance: false,
      unclear_ownership: true,
    },
  };

  describe("Phase 3: Upstream Gaps & Risk Compatibility", () => {
    it("successfully imports valid upstream export fixture without data loss", () => {
      const result = validateDiagnosticJson(validUpstreamFixture);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.orgName).toBe("Department of Education & Technology");
      expect(result.data.contextNotes).toBe("Postgraduate programme steering group");
      expect(result.data.capabilityNotes).toBe("Iterative staff workshops completed across semester 1");
      expect(result.data.governanceNotes).toBe("Ethical review panel meets monthly");

      expect(result.data.scores).toEqual({
        awareness: 3,
        coagency: 2,
        practice: 3,
        ethics: 2,
        governance: 2,
        renewal: 2,
      });

      expect(result.data.signals).toEqual({
        highStakesUse: true,
        publicFacing: false,
        sensitiveData: true,
        vendorReliance: false,
        unclearOwnership: true,
      });
    });

    it("parses valid JSON string representation of upstream export", () => {
      const jsonStr = JSON.stringify(validUpstreamFixture);
      const result = validateDiagnosticJson(jsonStr);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.orgName).toBe("Department of Education & Technology");
      expect(result.data.scores.awareness).toBe(3);
    });

    it("preserves compatibility with legitimate historical exports", () => {
      const legacyFixture = {
        orgName: "Legacy Academy",
        contextNotes: "Historical cohort",
        capabilityNotes: "Legacy capability note",
        governanceNotes: "Legacy governance note",
        scores: {
          awareness: 1,
          coagency: 2,
          practice: 3,
          ethics: 2,
          governance: 1,
          renewal: 1,
        },
        signals: {
          highStakesUse: true,
          publicFacing: true,
          sensitiveData: false,
          vendorReliance: true,
          unclearOwnership: false,
        },
      };

      const result = validateDiagnosticJson(legacyFixture);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.orgName).toBe("Legacy Academy");
      expect(result.data.contextNotes).toBe("Historical cohort");
      expect(result.data.capabilityNotes).toBe("Legacy capability note");
      expect(result.data.governanceNotes).toBe("Legacy governance note");
      expect(result.data.scores.awareness).toBe(1);
      expect(result.data.signals?.publicFacing).toBe(true);
    });
  });

  describe("Phase 4: Import Validation Defects & Boundary Handling", () => {
    it("accepts valid boundary scores of 0 and 4", () => {
      const boundaryFixture = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            awareness: 0,
            coagency: 4,
            practice: 0,
            ethics: 4,
            governance: 0,
            renewal: 4,
          },
        },
      };

      const result = validateDiagnosticJson(boundaryFixture);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.scores.awareness).toBe(0);
      expect(result.data.scores.coagency).toBe(4);
      expect(result.data.scores.practice).toBe(0);
      expect(result.data.scores.ethics).toBe(4);
      expect(result.data.scores.governance).toBe(0);
      expect(result.data.scores.renewal).toBe(4);
    });

    it("rejects negative scores", () => {
      const payload = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            ...validUpstreamFixture.capabilities.scores,
            ethics: -0.5,
          },
        },
      };

      const result = validateDiagnosticJson(payload);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("ethics");
      expect(result.error).toContain("out of expected range 0–4");
    });

    it("rejects scores greater than 4", () => {
      const payload = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            ...validUpstreamFixture.capabilities.scores,
            practice: 4.5,
          },
        },
      };

      const result = validateDiagnosticJson(payload);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("practice");
      expect(result.error).toContain("out of expected range 0–4");
    });

    it("rejects NaN values", () => {
      const payload = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            ...validUpstreamFixture.capabilities.scores,
            awareness: Number.NaN,
          },
        },
      };

      const result = validateDiagnosticJson(payload);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("awareness");
      expect(result.error).toContain("finite number");
    });

    it("rejects non-finite values (+Infinity, -Infinity)", () => {
      const payloadPositiveInf = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            ...validUpstreamFixture.capabilities.scores,
            governance: Number.POSITIVE_INFINITY,
          },
        },
      };
      const resultPos = validateDiagnosticJson(payloadPositiveInf);
      expect(resultPos.success).toBe(false);

      const payloadNegInf = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            ...validUpstreamFixture.capabilities.scores,
            governance: Number.NEGATIVE_INFINITY,
          },
        },
      };
      const resultNeg = validateDiagnosticJson(payloadNegInf);
      expect(resultNeg.success).toBe(false);
    });

    it("rejects missing domains", () => {
      const incompleteScores: Record<string, number> = {
        awareness: 2,
        coagency: 2,
        practice: 2,
        // ethics is missing!
        governance: 2,
        renewal: 2,
      };

      const payload = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: incompleteScores,
        },
      };

      const result = validateDiagnosticJson(payload);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Missing required domain 'ethics'");
    });

    it("rejects incorrect field types (e.g. string, boolean, null for score)", () => {
      const payloadWithStringScore = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            ...validUpstreamFixture.capabilities.scores,
            ethics: "3" as unknown as number,
          },
        },
      };
      const res1 = validateDiagnosticJson(payloadWithStringScore);
      expect(res1.success).toBe(false);

      const payloadWithNullScore = {
        ...validUpstreamFixture,
        capabilities: {
          ...validUpstreamFixture.capabilities,
          scores: {
            ...validUpstreamFixture.capabilities.scores,
            ethics: null as unknown as number,
          },
        },
      };
      const res2 = validateDiagnosticJson(payloadWithNullScore);
      expect(res2.success).toBe(false);
    });

    it("rejects malformed JSON strings safely", () => {
      const malformedJson = "{ invalid json: 123";
      const result = validateDiagnosticJson(malformedJson);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Malformed JSON");
    });

    it("rejects non-object root structures (arrays, primitives, null)", () => {
      expect(validateDiagnosticJson(null).success).toBe(false);
      expect(validateDiagnosticJson([]).success).toBe(false);
      expect(validateDiagnosticJson("plain text").success).toBe(false);
      expect(validateDiagnosticJson(12345).success).toBe(false);
    });

    it("rejects payloads missing capability scores entirely", () => {
      const noScores = {
        metadata: { organisation: "Empty Org" },
      };
      const result = validateDiagnosticJson(noScores);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Missing capability scores");
    });
  });
});
