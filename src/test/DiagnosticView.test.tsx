import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiagnosticView from "../views/DiagnosticView";

describe("DiagnosticView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
  });

  it("renders initial form state correctly", () => {
    render(<DiagnosticView onRestart={vi.fn()} />);

    expect(screen.getByText("Stress-Test Setup")).toBeInTheDocument();
    expect(screen.getByDisplayValue("My team / organisation")).toBeInTheDocument();
    expect(screen.getByText("Awareness & Orientation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run stress-test/i })).toBeInTheDocument();
  });

  it("allows editing text fields, signals, and scenario selection", async () => {
    const user = userEvent.setup();
    render(<DiagnosticView onRestart={vi.fn()} />);

    const orgInput = screen.getByDisplayValue("My team / organisation");
    await user.clear(orgInput);
    await user.type(orgInput, "Faculty of Medicine");
    expect(screen.getByDisplayValue("Faculty of Medicine")).toBeInTheDocument();

    const notesInput = screen.getByPlaceholderText(/e.g., programme team/i);
    await user.type(notesInput, "Clinical teaching group");
    expect(screen.getByDisplayValue("Clinical teaching group")).toBeInTheDocument();

    const highStakesCheckbox = screen.getByLabelText(/High-stakes use/i);
    expect(highStakesCheckbox).not.toBeChecked();
    await user.click(highStakesCheckbox);
    expect(highStakesCheckbox).toBeChecked();
  });

  it("advances to ResultsView when Run button is clicked", async () => {
    const user = userEvent.setup();
    render(<DiagnosticView onRestart={vi.fn()} />);

    const runBtn = screen.getByRole("button", { name: /Run stress-test/i });
    await user.click(runBtn);

    expect(screen.getByText("Stress-Test Results")).toBeInTheDocument();
    expect(screen.getByText(/Active Scenario/i)).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("handles valid JSON file import and updates all fields", async () => {
    const validJson = JSON.stringify({
      metadata: {
        organisation: "Imported University",
        context: "Faculty of Computing",
        capability_notes: "Strong workshops completed",
        governance_notes: "Clear approvals process",
      },
      capabilities: {
        scores: {
          awareness: 4,
          coagency: 3,
          practice: 4,
          ethics: 3,
          governance: 3,
          renewal: 4,
        },
      },
      context_flags: {
        high_stakes_use: true,
        public_facing: true,
        sensitive_data: false,
        vendor_reliance: true,
        unclear_ownership: false,
      },
    });

    const file = new File([validJson], "diagnostic.json", { type: "application/json" });
    const { container } = render(<DiagnosticView onRestart={vi.fn()} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Imported University")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Faculty of Computing")).toBeInTheDocument();
      expect(screen.getByLabelText(/High-stakes use/i)).toBeChecked();
      expect(screen.getByLabelText(/Public-facing outputs/i)).toBeChecked();
    });
  });

  it("rejects invalid JSON file import and safely preserves existing state", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const invalidJson = JSON.stringify({
      metadata: {
        organisation: "Should Not Overwrite",
      },
      capabilities: {
        scores: {
          awareness: 5, // invalid > 4!
          coagency: 2,
          practice: 2,
          ethics: 2,
          governance: 2,
          renewal: 2,
        },
      },
    });

    const file = new File([invalidJson], "invalid.json", { type: "application/json" });
    const { container } = render(<DiagnosticView onRestart={vi.fn()} />);

    // Existing state is "My team / organisation"
    expect(screen.getByDisplayValue("My team / organisation")).toBeInTheDocument();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });

    // Existing state was NOT overwritten!
    expect(screen.getByDisplayValue("My team / organisation")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Should Not Overwrite")).not.toBeInTheDocument();
  });
});
