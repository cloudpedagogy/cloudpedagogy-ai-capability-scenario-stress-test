import { describe, it, expect } from "vitest";
import { DOMAINS, bandForAverage, clampScore, type DomainKey } from "../domain/model";
import { SCENARIOS, getScenarioById } from "../domain/scenarios";

describe("Domain Model", () => {
  it("defines the 6 canonical capability domains", () => {
    expect(DOMAINS).toHaveLength(6);
    const expectedKeys: DomainKey[] = [
      "awareness",
      "coagency",
      "practice",
      "ethics",
      "governance",
      "renewal",
    ];
    expect(DOMAINS.map((d) => d.key)).toEqual(expectedKeys);
    for (const domain of DOMAINS) {
      expect(domain.label).toBeTruthy();
      expect(domain.description).toBeTruthy();
    }
  });

  describe("bandForAverage", () => {
    it("classifies scores < 1.25 as Emerging", () => {
      expect(bandForAverage(0)).toBe("Emerging");
      expect(bandForAverage(1.0)).toBe("Emerging");
      expect(bandForAverage(1.24)).toBe("Emerging");
    });

    it("classifies scores 1.25 to < 2.5 as Developing", () => {
      expect(bandForAverage(1.25)).toBe("Developing");
      expect(bandForAverage(2.0)).toBe("Developing");
      expect(bandForAverage(2.49)).toBe("Developing");
    });

    it("classifies scores 2.5 to < 3.5 as Established", () => {
      expect(bandForAverage(2.5)).toBe("Established");
      expect(bandForAverage(3.0)).toBe("Established");
      expect(bandForAverage(3.49)).toBe("Established");
    });

    it("classifies scores >= 3.5 as Leading", () => {
      expect(bandForAverage(3.5)).toBe("Leading");
      expect(bandForAverage(3.8)).toBe("Leading");
      expect(bandForAverage(4.0)).toBe("Leading");
    });
  });

  describe("clampScore", () => {
    it("clamps scores within 0 to 4", () => {
      expect(clampScore(-1)).toBe(0);
      expect(clampScore(0)).toBe(0);
      expect(clampScore(2.5)).toBe(2.5);
      expect(clampScore(4)).toBe(4);
      expect(clampScore(5)).toBe(4);
    });
  });
});

describe("Scenarios", () => {
  it("defines the 6 canonical scenarios", () => {
    expect(SCENARIOS).toHaveLength(6);
    const expectedIds = [
      "rapid-assessment-uptake",
      "regulatory-tightening",
      "public-incident",
      "vendor-disruption",
      "loss-of-champion",
      "agentic-shift",
    ];
    expect(SCENARIOS.map((s) => s.id)).toEqual(expectedIds);

    for (const sc of SCENARIOS) {
      expect(sc.title).toBeTruthy();
      expect(sc.description).toBeTruthy();
      expect(sc.stressors.length).toBeGreaterThan(0);
      expect(sc.pressureDomains.length).toBeGreaterThan(0);
    }
  });

  describe("getScenarioById", () => {
    it("returns the scenario when given a valid ID", () => {
      const scenario = getScenarioById("rapid-assessment-uptake");
      expect(scenario).toBeDefined();
      expect(scenario?.title).toBe("Rapid AI uptake in assessment");
    });

    it("returns undefined for null, undefined, or empty string", () => {
      expect(getScenarioById(null)).toBeUndefined();
      expect(getScenarioById(undefined)).toBeUndefined();
      expect(getScenarioById("")).toBeUndefined();
      expect(getScenarioById("non-existent-id")).toBeUndefined();
    });
  });
});
