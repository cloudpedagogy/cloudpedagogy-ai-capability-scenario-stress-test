import { describe, it, expect, vi } from "vitest";
import { generateStressReportJson, generateStressReportMarkdown, downloadReport } from "../engine/export";
import { runStressTest } from "../engine/stressAnalysis";
import { getScenarioById } from "../domain/scenarios";
import type { DiagnosticInput } from "../domain/model";

function makeInput(overrides?: Partial<DiagnosticInput>): DiagnosticInput {
  return {
    orgName: "Acme University",
    contextNotes: "Faculty of Science",
    scores: {
      awareness: 3,
      coagency: 2,
      practice: 3,
      ethics: 2,
      governance: 1,
      renewal: 2,
    },
    signals: {
      highStakesUse: true,
      publicFacing: false,
      sensitiveData: true,
      vendorReliance: false,
      unclearOwnership: true,
    },
    capabilityNotes: "Developing institutional guidelines",
    governanceNotes: "Quarterly review committee planned",
    ...overrides,
  };
}

describe("Export Engine", () => {
  const scenario = getScenarioById("rapid-assessment-uptake")!;
  const input = makeInput();
  const result = runStressTest(input, scenario);

  describe("generateStressReportJson", () => {
    it("serializes stress report with metadata, metrics, impact_matrix, and signals", () => {
      const jsonStr = generateStressReportJson(input, result);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.organisation).toBe("Acme University");
      expect(parsed.metadata.context).toBe("Faculty of Science");
      expect(parsed.metadata.scenario).toBe("Rapid AI uptake in assessment");
      expect(parsed.metadata.framework).toBe("CloudPedagogy AI Capability Framework (2026 Edition)");
      expect(parsed.metadata.capabilityNotes).toBe("Developing institutional guidelines");
      expect(parsed.metadata.governanceNotes).toBe("Quarterly review committee planned");
      expect(parsed.metadata.timestamp).toBeDefined();

      expect(parsed.metrics).toBeDefined();
      expect(parsed.metrics.resilience_score).toBe(result.resilienceScore);
      expect(parsed.metrics.overall_stress).toBe(result.overallStress);
      expect(parsed.metrics.baseline_average).toBe(result.averageScore);
      expect(parsed.metrics.baseline_band).toBe(result.band);

      expect(parsed.impact_matrix).toHaveLength(6);
      for (const item of parsed.impact_matrix) {
        expect(item.domain).toBeTruthy();
        expect(typeof item.baseline).toBe("number");
        expect(typeof item.pressure).toBe("string");
        expect(typeof item.residual_stability).toBe("number");
        expect(typeof item.status).toBe("string");
        expect(typeof item.is_fragile).toBe("boolean");
      }

      expect(parsed.signals.length).toBeGreaterThan(0);
      for (const sig of parsed.signals) {
        expect(sig.level).toBeTruthy();
        expect(sig.title).toBeTruthy();
        expect(sig.rationale).toBeTruthy();
        expect(Array.isArray(sig.related_domains)).toBe(true);
        expect(Array.isArray(sig.prompts)).toBe(true);
      }
    });
  });

  describe("generateStressReportMarkdown", () => {
    it("generates markdown report with title, executive summary, tables, and notes", () => {
      const md = generateStressReportMarkdown(input, result);

      expect(md).toContain(`# Scenario Stress-Test Report: ${scenario.title}`);
      expect(md).toContain(`**Organisation:** ${input.orgName}`);
      expect(md).toContain(`**Context:** ${input.contextNotes}`);
      expect(md).toContain("## Executive Summary");
      expect(md).toContain(`- **Scenario Resilience Score:** ${result.resilienceScore}/100`);
      expect(md).toContain(`- **Overall Stress Profile:** ${result.overallStress}`);
      expect(md).toContain("## Capability & Governance");
      expect(md).toContain(input.capabilityNotes!);
      expect(md).toContain(input.governanceNotes!);
      expect(md).toContain("## Domain Impact Matrix");
      expect(md).toContain("| Domain | Baseline | Pressure | Stability | Status |");
      expect(md).toContain("## Stress Signals & Analysis");
      expect(md).toContain("## Discussion Prompts for Governance");
    });
  });

  describe("downloadReport", () => {
    it("creates an anchor element and triggers download for json and markdown", () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test");
      const mockRevokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      const clickSpy = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        const el = origCreateElement(tag);
        if (tag === "a") {
          el.click = clickSpy;
        }
        return el;
      });

      downloadReport(input, result, "json");
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test");

      downloadReport(input, result, "markdown");
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });
  });
});
