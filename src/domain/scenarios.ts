import type { DomainKey } from "./model";

export type Scenario = {
  id: string;
  title: string;
  description: string;
  stressors: string[];
  pressureDomains: DomainKey[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "rapid-assessment-uptake",
    title: "Rapid AI uptake in assessment",
    description:
      "AI tools are adopted quickly across assessment and feedback practices, outpacing shared guidance and policy.",
    stressors: [
      "Inconsistent practice across staff",
      "Academic integrity pressure",
      "Tool use racing ahead of governance",
    ],
    pressureDomains: ["awareness", "coagency", "practice", "ethics", "governance"],
  },
  {
    id: "regulatory-tightening",
    title: "Regulatory tightening or audit scrutiny",
    description:
      "External regulators, accreditors, or auditors increase scrutiny of AI-supported practices and documentation.",
    stressors: [
      "Need for defensible documentation",
      "Policy and approval gaps exposed",
      "Increased demand for transparency",
    ],
    pressureDomains: ["awareness", "ethics", "governance"],
  },
  {
    id: "public-incident",
    title: "Public incident or reputational shock",
    description:
      "A publicised incident raises concerns about AI use, fairness, or decision-making, increasing scrutiny and expectations.",
    stressors: ["Media and stakeholder scrutiny", "Loss of trust", "Pressure to justify decisions"],
    pressureDomains: ["ethics", "governance", "awareness", "renewal"],
  },
  {
    id: "vendor-disruption",
    title: "Vendor disruption or model withdrawal",
    description:
      "A key AI provider changes pricing, removes features, or withdraws a service, creating operational disruption.",
    stressors: ["Operational disruption", "Hidden vendor lock-in revealed", "Contingency planning gaps"],
    pressureDomains: ["practice", "governance", "renewal"],
  },
  {
    id: "loss-of-champion",
    title: "Loss of a key AI champion",
    description:
      "A highly capable individual leaves, exposing reliance on informal knowledge and workarounds.",
    stressors: ["Tacit knowledge loss", "Brittle processes", "Capability not embedded institutionally"],
    pressureDomains: ["renewal", "coagency", "awareness", "governance"],
  },
  {
    id: "agentic-shift",
    title: "Shift towards agentic AI workflows",
    description:
      "AI systems begin acting with greater autonomy across workflows and decision support, increasing oversight demands.",
    stressors: ["Role clarity challenges", "Oversight and monitoring gaps", "Delegation boundaries unclear"],
    pressureDomains: ["coagency", "governance", "ethics", "practice"],
  },
];

export function getScenarioById(id: string | null | undefined): Scenario | undefined {
  if (!id) return undefined;
  return SCENARIOS.find((s) => s.id === id);
}
