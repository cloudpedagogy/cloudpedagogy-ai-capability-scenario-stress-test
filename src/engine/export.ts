import type { DiagnosticInput } from "../domain/model";

import type { StressResult } from "./stressAnalysis";

/**
 * Generates a structured JSON snapshot for reporting.
 */
export function generateStressReportJson(input: DiagnosticInput, result: StressResult) {
  const exportData = {
    metadata: {
      organisation: input.orgName,
      context: input.contextNotes,
      timestamp: new Date().toISOString(),
      scenario: result.scenario.title,
      framework: "CloudPedagogy AI Capability Framework (2026 Edition)",
      capabilityNotes: input.capabilityNotes,
      governanceNotes: input.governanceNotes
    },
    metrics: {
      resilience_score: result.resilienceScore,
      overall_stress: result.overallStress,
      baseline_average: result.averageScore,
      baseline_band: result.band
    },
    impact_matrix: result.domainImpacts.map(d => ({
      domain: d.label,
      baseline: d.baseline,
      pressure: d.pressure,
      residual_stability: d.residualStability,
      status: d.status,
      is_fragile: d.isFragile
    })),
    signals: result.signals.map(s => ({
      level: s.level,
      title: s.title,
      rationale: s.rationale,
      related_domains: s.relatedDomains,
      prompts: s.prompts,
      stabilisers: s.stabilisers
    }))
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Generates a governance-ready Markdown report.
 */
export function generateStressReportMarkdown(input: DiagnosticInput, result: StressResult) {
  const lines: string[] = [];

  lines.push(`# Scenario Stress-Test Report: ${result.scenario.title}`);
  lines.push(`**Organisation:** ${input.orgName}`);
  if (input.contextNotes) lines.push(`**Context:** ${input.contextNotes}`);
  lines.push(`**Generated:** ${new Date().toUTCString()}`);
  lines.push("");

  lines.push("## Executive Summary");
  lines.push(`- **Scenario Resilience Score:** ${result.resilienceScore}/100`);
  lines.push(`- **Overall Stress Profile:** ${result.overallStress}`);
  lines.push(`- **Baseline average:** ${result.averageScore}/4 (${result.band})`);
  lines.push("");

  if (input.capabilityNotes || input.governanceNotes) {
    lines.push("## Capability & Governance");
    if (input.capabilityNotes) {
      lines.push("### Capability Notes");
      lines.push(input.capabilityNotes);
      lines.push("");
    }
    if (input.governanceNotes) {
      lines.push("### Governance Notes");
      lines.push(input.governanceNotes);
      lines.push("");
    }
  }

  lines.push("## Domain Impact Matrix");
  lines.push("| Domain | Baseline | Pressure | Stability | Status |");
  lines.push("| :--- | :---: | :---: | :---: | :--- |");
  result.domainImpacts.forEach(d => {
    lines.push(`| ${d.label} | ${d.baseline} | ${d.pressure} | ${d.residualStability} | ${d.isFragile ? "**Fragile**" : d.status} |`);
  });
  lines.push("");

  lines.push("## Stress Signals & Analysis");
  result.signals.forEach((s, i) => {
    lines.push(`### ${i + 1}. [${s.level}] ${s.title}`);
    lines.push(`**Rationale:** ${s.rationale}`);
    if (s.stabilisers?.length) {
      lines.push("**Proposed Stabilisers:**");
      s.stabilisers.forEach(x => lines.push(`- ${x}`));
    }
    lines.push("");
  });

  lines.push("## Discussion Prompts for Governance");
  lines.push("> Use these prompts to explore institutional assumptions and mitigation strategies.");
  lines.push("");
  result.signals.forEach(s => {
    if (s.prompts?.length) {
      lines.push(`### ${s.title}`);
      s.prompts.forEach(p => lines.push(`- ${p}`));
      lines.push("");
    }
  });

  lines.push("---");
  lines.push("*Note: This report is a scenario-based simulation and does not constitute a predictive audit or compliance output.*");

  return lines.join("\n");
}

export function downloadReport(input: DiagnosticInput, result: StressResult, type: "json" | "markdown") {
  const content = type === "json" 
    ? generateStressReportJson(input, result) 
    : generateStressReportMarkdown(input, result);
  
  const blob = new Blob([content], { type: type === "json" ? "application/json" : "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const filename = `stress-test-${result.scenario.id}-${input.orgName.toLowerCase().replace(/\s+/g, "-")}.${type === "json" ? "json" : "md"}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
