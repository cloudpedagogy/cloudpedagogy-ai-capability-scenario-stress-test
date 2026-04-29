export type DomainKey =
  | "awareness"
  | "coagency"
  | "practice"
  | "ethics"
  | "governance"
  | "renewal";

export type Domain = {
  key: DomainKey;
  label: string;
  description: string;
};

export const DOMAINS: Domain[] = [
  {
    key: "awareness",
    label: "Awareness & Orientation",
    description: "Shared understanding, boundaries, risks, and realistic expectations of AI in context.",
  },
  {
    key: "coagency",
    label: "Human–AI Co-Agency",
    description: "Role clarity, partnership practices, prompting as collaboration, and human judgement in the loop.",
  },
  {
    key: "practice",
    label: "Applied Practice & Innovation",
    description: "Practical use in workflows, iteration, experimentation, and responsible improvement of practice.",
  },
  {
    key: "ethics",
    label: "Ethics, Equity & Impact",
    description: "Fairness, inclusion, harm reduction, transparency, and attention to downstream impacts.",
  },
  {
    key: "governance",
    label: "Decision-Making & Governance",
    description: "Accountability, approvals, oversight, policy alignment, and decision hygiene.",
  },
  {
    key: "renewal",
    label: "Reflection, Learning & Renewal",
    description: "Ongoing learning, review cycles, capability renewal, and institutional memory.",
  },
];

export type CapabilityBand = "Emerging" | "Developing" | "Established" | "Leading";

export type DiagnosticInput = {
  orgName: string;
  contextNotes: string;

  // Domain scores 0–4 (reflective)
  scores: Record<DomainKey, number>;

  // Optional “programme mapping” style distribution signals (0–100)
  // These are NOT required; they let the diagnostic interpret imbalance patterns.
  coverage?: Partial<Record<DomainKey, number>>;

  // A few high-level checkboxes to enrich interpretation (still reflective, not evaluative)
  signals: {
    highStakesUse: boolean; // AI in assessment, decisions, admissions, clinical, etc.
    publicFacing: boolean; // outputs published or used externally
    sensitiveData: boolean; // personal / special category / confidential
    vendorReliance: boolean; // heavy reliance on one platform or tool chain
    unclearOwnership: boolean; // unclear accountability/role responsibility
  };

  // Standardised capability and governance fields
  capabilityNotes?: string;
  governanceNotes?: string;
};

export const clampScore = (n: number) => Math.max(0, Math.min(4, n));

export function bandForAverage(avg: number): CapabilityBand {
  if (avg < 1.25) return "Emerging";
  if (avg < 2.5) return "Developing";
  if (avg < 3.5) return "Established";
  return "Leading";
}
