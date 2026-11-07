import { DOMAINS, type DomainKey } from "../domain/model";

export type ValidatedDiagnosticSignals = {
  highStakesUse: boolean;
  publicFacing: boolean;
  sensitiveData: boolean;
  vendorReliance: boolean;
  unclearOwnership: boolean;
};

export type ValidatedDiagnosticPayload = {
  orgName?: string;
  contextNotes?: string;
  scores: Record<DomainKey, number>;
  signals?: ValidatedDiagnosticSignals;
  capabilityNotes?: string;
  governanceNotes?: string;
};

export type ImportValidationResult =
  | { success: true; data: ValidatedDiagnosticPayload }
  | { success: false; error: string };

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

const REQUIRED_DOMAINS: DomainKey[] = DOMAINS.map((d) => d.key);

/**
 * Validates and normalizes diagnostic JSON exported by cloudpedagogy-ai-capability-gaps-risk
 * or legacy compatible tools.
 *
 * Requirements:
 * - Reject invalid payloads safely (do not overwrite current state on failure).
 * - Reject scores that are negative, > 4, NaN, non-finite, missing, or wrong type.
 * - Accept boundary scores 0 and 4.
 * - Preserve metadata, capabilities, risk_profile, context_flags compatibility without data loss.
 */
export function validateDiagnosticJson(raw: unknown): ImportValidationResult {
  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { success: false, error: "Malformed JSON: Failed to parse input string." };
    }
  }

  if (!isRecord(parsed)) {
    return { success: false, error: "Invalid payload: Root must be a JSON object." };
  }

  // 1. Locate scores object
  const capabilities = isRecord(parsed.capabilities) ? parsed.capabilities : undefined;
  const rawScores = capabilities && isRecord(capabilities.scores)
    ? capabilities.scores
    : isRecord(parsed.scores)
      ? parsed.scores
      : undefined;

  if (!rawScores) {
    return {
      success: false,
      error: "Invalid payload: Missing capability scores (expected capabilities.scores).",
    };
  }

  // 2. Validate all 6 domain scores
  const validatedScores: Partial<Record<DomainKey, number>> = {};

  for (const domain of REQUIRED_DOMAINS) {
    if (!(domain in rawScores)) {
      return {
        success: false,
        error: `Invalid capability scores: Missing required domain '${domain}'.`,
      };
    }

    const val = rawScores[domain];

    if (typeof val !== "number" || !Number.isFinite(val)) {
      return {
        success: false,
        error: `Invalid score for domain '${domain}': Expected a finite number, received ${typeof val === "number" ? String(val) : typeof val}.`,
      };
    }

    if (val < 0 || val > 4) {
      return {
        success: false,
        error: `Invalid score for domain '${domain}': Value ${val} is out of expected range 0–4.`,
      };
    }

    validatedScores[domain] = val;
  }

  // 3. Extract metadata
  const metadata = isRecord(parsed.metadata) ? parsed.metadata : undefined;

  const orgName = typeof metadata?.organisation === "string"
    ? metadata.organisation
    : typeof metadata?.orgName === "string"
      ? metadata.orgName
      : typeof parsed.orgName === "string"
        ? parsed.orgName
        : undefined;

  const contextNotes = typeof metadata?.context === "string"
    ? metadata.context
    : typeof metadata?.contextNotes === "string"
      ? metadata.contextNotes
      : typeof parsed.contextNotes === "string"
        ? parsed.contextNotes
        : undefined;

  const capabilityNotes = typeof metadata?.capability_notes === "string"
    ? metadata.capability_notes
    : typeof metadata?.capabilityNotes === "string"
      ? metadata.capabilityNotes
      : typeof parsed.capabilityNotes === "string"
        ? parsed.capabilityNotes
        : undefined;

  const governanceNotes = typeof metadata?.governance_notes === "string"
    ? metadata.governance_notes
    : typeof metadata?.governanceNotes === "string"
      ? metadata.governanceNotes
      : typeof parsed.governanceNotes === "string"
        ? parsed.governanceNotes
        : undefined;

  // 4. Extract context flags / signals
  const contextFlags = isRecord(parsed.context_flags)
    ? parsed.context_flags
    : isRecord(parsed.signals)
      ? parsed.signals
      : isRecord(parsed.contextFlags)
        ? parsed.contextFlags
        : undefined;

  let signals: ValidatedDiagnosticSignals | undefined;
  if (contextFlags) {
    signals = {
      highStakesUse: Boolean(contextFlags.high_stakes_use ?? contextFlags.highStakesUse),
      publicFacing: Boolean(contextFlags.public_facing ?? contextFlags.publicFacing),
      sensitiveData: Boolean(contextFlags.sensitive_data ?? contextFlags.sensitiveData),
      vendorReliance: Boolean(contextFlags.vendor_reliance ?? contextFlags.vendorReliance),
      unclearOwnership: Boolean(contextFlags.unclear_ownership ?? contextFlags.unclearOwnership),
    };
  }

  return {
    success: true,
    data: {
      orgName,
      contextNotes,
      scores: validatedScores as Record<DomainKey, number>,
      signals,
      capabilityNotes,
      governanceNotes,
    },
  };
}
