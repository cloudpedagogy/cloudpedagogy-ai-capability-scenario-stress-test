# PROJECT_SPEC: cloudpedagogy-ai-capability-scenario-stress-test

## 1. Repo Name
`cloudpedagogy-ai-capability-scenario-stress-test`

## 2. One-Sentence Purpose
An interactive simulator for testing the resilience of institutional capability profiles against dynamic stressors (e.g., rapid technological acceleration or staff turnover).

## 3. Problem the App Solves
Maturity assessments provide only a static snapshot; this tool helps institutions predict how their capability will "fail" or "flex" when faced with sudden environmental or technical pressures.

## 4. Primary User / Audience
Strategy planners, department heads, and workshop facilitators.

## 5. Core Role in the CloudPedagogy Ecosystem
The "Stress Layer"; projects stressors onto the static maturity data collected by other tools to identify "Breaking Points" in the capability profile.

## 6. Main Entities / Data Structures
- **Scenario**: A defined event with stressors and specific "Pressure Domains" (Awareness, Ethics, etc.).
- **DiagnosticInput**: A baseline profile (scores, signals) inherited from the `gaps-risk` data model.
- **DomainKey**: Standard 6 domains (Awareness, Coagency, Practice, Ethics, Governance, Renewal).

## 7. Main User Workflows
1. **Load Baseline**: Ingest or input a standard 6-domain capability profile.
2. **Select Scenario**: Choose from a library of stressors (e.g., "AI Tool Outage," "API Price Hike," "Policy Pivot").
3. **Simulate Impact**: Adjust domain scores based on the scenario constraints and pressures.
4. **Resilience Analysis**: Document findings and identify "Fragile Domains."

## 8. Current Features
- Library of predefined stressors/scenarios.
- Interactive pressure-domain mapping.
- Real-time score adjustment and impact visualization.
- Scenario-based reflection prompts.

## 9. Stubbed / Partial / Incomplete Features
- Robust data export logic is less mature than in the dedicated Dashboard apps.

## 10. Import / Export and Storage Model
- **Storage**: Stateless; designed for live workshop/simulation sessions.
- **Import**: Compatible with `DiagnosticInput` JSON payloads from the Gaps-Risk tool.

## 11. Relationship to Other CloudPedagogy Apps
Operates on the same 6-domain model as `ai-capability-assessment` and `gaps-risk`; acts as a "What-If" simulator for those diagnostics.

## 12. Potential Overlap or Duplication Risks
High overlap with `gaps-risk`; distinguished by its procedural focus on *scenarios* rather than static *risk signals*.

## 13. Distinctive Value of This App
Identifies *dynamic* failure modes—not just what is "weak," but what is "fragile" under specific pressure conditions.

## 14. Recommended Future Enhancements
(Inferred) Support for multi-user shared simulation state; automated "Resilience Score" calculation based on scenario outcomes.

## 15. Anything Unclear or Inferred from Repo Contents
The scenarios are listed as predefined, but the repo structure suggests an intended extension point for custom institutional stress-test logic.
