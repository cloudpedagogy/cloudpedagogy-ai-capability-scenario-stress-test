import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultsView from "../views/ResultsView";
import { runStressTest } from "../engine/stressAnalysis";
import { getScenarioById } from "../domain/scenarios";
import type { DiagnosticInput } from "../domain/model";

describe("ResultsView", () => {
  const scenario = getScenarioById("rapid-assessment-uptake")!;
  const input: DiagnosticInput = {
    orgName: "Global Learning Institute",
    contextNotes: "Faculty of Arts",
    scores: {
      awareness: 3,
      coagency: 2,
      practice: 3,
      ethics: 1,
      governance: 2,
      renewal: 2,
    },
    signals: {
      highStakesUse: true,
      publicFacing: false,
      sensitiveData: true,
      vendorReliance: false,
      unclearOwnership: false,
    },
    capabilityNotes: "Capability notes text",
    governanceNotes: "Governance notes text",
  };

  const result = runStressTest(input, scenario);

  beforeEach(() => {
    vi.restoreAllMocks();
    window.print = vi.fn();
  });

  it("renders scenario title, metrics, and domain impact matrix", () => {
    render(<ResultsView input={input} result={result} onBack={vi.fn()} />);

    expect(screen.getByText("Stress-Test Results")).toBeInTheDocument();
    expect(screen.getByText("Global Learning Institute")).toBeInTheDocument();
    expect(screen.getByText("Rapid AI uptake in assessment")).toBeInTheDocument();
    expect(screen.getByText(String(result.resilienceScore))).toBeInTheDocument();
    expect(screen.getByText("Domain Impact Matrix")).toBeInTheDocument();
    expect(screen.getAllByText("Awareness & Orientation").length).toBeGreaterThanOrEqual(1);
  });

  it("toggles signal rationale when clicking why this matters / hide rationale", async () => {
    const user = userEvent.setup();
    render(<ResultsView input={input} result={result} onBack={vi.fn()} />);

    // In this result with ethics=1 and highStakes, there are Concern signals that start open, and Watch/Info that start closed.
    const toggleButtons = screen.getAllByRole("button", { name: /Hide rationale|Why this matters/i });
    expect(toggleButtons.length).toBeGreaterThan(0);

    const firstBtn = toggleButtons[0];
    const initialText = firstBtn.textContent;
    await user.click(firstBtn);
    expect(firstBtn.textContent).not.toBe(initialText);
  });

  it("calls onBack when clicking 'Back to setup'", async () => {
    const user = userEvent.setup();
    const onBackMock = vi.fn();
    render(<ResultsView input={input} result={result} onBack={onBackMock} />);

    const backBtn = screen.getByRole("button", { name: /Back to setup/i });
    await user.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it("triggers window.print when clicking Print PDF", async () => {
    const user = userEvent.setup();
    render(<ResultsView input={input} result={result} onBack={vi.fn()} />);

    const printBtn = screen.getByRole("button", { name: /Print PDF/i });
    await user.click(printBtn);
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("copies summary text to clipboard when clicking Copy to Clipboard", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<ResultsView input={input} result={result} onBack={vi.fn()} />);

    const copyBtn = screen.getByRole("button", { name: /Copy to Clipboard/i });
    await user.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalled();
  });

  it("synchronises state and UI when result prop changes dynamically without unmounting", () => {
    const { rerender } = render(<ResultsView input={input} result={result} onBack={vi.fn()} />);

    expect(screen.getByText("Rapid AI uptake in assessment")).toBeInTheDocument();
    expect(screen.getByText(String(result.resilienceScore))).toBeInTheDocument();

    const scenario2 = getScenarioById("regulatory-tightening")!;
    const input2: DiagnosticInput = {
      ...input,
      scores: {
        ...input.scores,
        ethics: 4,
        governance: 4,
        awareness: 4,
      },
    };
    const result2 = runStressTest(input2, scenario2);

    rerender(<ResultsView input={input2} result={result2} onBack={vi.fn()} />);

    expect(screen.getByText("Regulatory tightening or audit scrutiny")).toBeInTheDocument();
    expect(screen.getByText(String(result2.resilienceScore))).toBeInTheDocument();
    expect(screen.queryByText("Rapid AI uptake in assessment")).not.toBeInTheDocument();
  });
});
