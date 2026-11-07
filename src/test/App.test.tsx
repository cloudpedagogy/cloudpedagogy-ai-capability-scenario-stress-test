import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("App End-to-End User Journeys & Architecture", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
    window.print = vi.fn();
  });

  it("renders IntroView initially with brand, navigation, and start button", () => {
    render(<App />);

    expect(screen.getByText("CloudPedagogy")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Scenario Stress-Test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start stress-test/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Restart/i })).toBeInTheDocument();
  });

  it("completes full representative end-to-end journey", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Start from IntroView
    const startBtn = screen.getByRole("button", { name: /Start stress-test/i });
    await user.click(startBtn);

    // 2. Setup View is displayed
    expect(screen.getByText("Stress-Test Setup")).toBeInTheDocument();

    // 3. Edit organization name
    const orgInput = screen.getByDisplayValue("My team / organisation");
    await user.clear(orgInput);
    await user.type(orgInput, "E2E University");

    // 4. Run scenario stress test
    const runBtn = screen.getByRole("button", { name: /Run stress-test/i });
    await user.click(runBtn);

    // 5. Results View is displayed with calculated metrics
    expect(screen.getByText("Stress-Test Results")).toBeInTheDocument();
    expect(screen.getByText("E2E University")).toBeInTheDocument();
    expect(screen.getByText("Domain Impact Matrix")).toBeInTheDocument();

    // 6. Navigate back to setup
    const backBtn = screen.getByRole("button", { name: /Back to setup/i });
    await user.click(backBtn);
    expect(screen.getByText("Stress-Test Setup")).toBeInTheDocument();
    expect(screen.getByDisplayValue("E2E University")).toBeInTheDocument();

    // 7. Click Restart in header to return to intro
    const restartBtn = screen.getByRole("button", { name: /Restart/i });
    await user.click(restartBtn);
    expect(screen.getByRole("button", { name: /Start stress-test/i })).toBeInTheDocument();
  });

  it("preserves stateless architecture (no localStorage or sessionStorage usage)", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const sessionStorageSpy = vi.spyOn(sessionStorage, "setItem");

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Start stress-test/i }));
    await user.click(screen.getByRole("button", { name: /Run stress-test/i }));

    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
  });

  it("handles multi-run stress tests with changed scores and scenarios without stale state", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Start
    await user.click(screen.getByRole("button", { name: /Start stress-test/i }));

    // Run first test (default: Rapid AI uptake in assessment, all scores = 2)
    await user.click(screen.getByRole("button", { name: /Run stress-test/i }));

    // Verify Run 1 results
    expect(screen.getByText("Stress-Test Results")).toBeInTheDocument();
    expect(screen.getByText("Rapid AI uptake in assessment")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument(); // initial resilience score (6.5 / 24 * 100)

    // Toggle local UI control in ResultsView
    const toggleBtns = screen.getAllByRole("button", { name: /Hide rationale|Why this matters/i });
    expect(toggleBtns.length).toBeGreaterThan(0);
    const initialText = toggleBtns[0].textContent;
    await user.click(toggleBtns[0]);
    expect(toggleBtns[0].textContent).not.toBe(initialText);

    // Return to diagnostic setup
    await user.click(screen.getByRole("button", { name: /Back to setup/i }));
    expect(screen.getByText("Stress-Test Setup")).toBeInTheDocument();

    // Change capability scores (Awareness & Co-Agency from 2 to 4)
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "4");
    await user.selectOptions(selects[1], "4");

    // Select a different scenario: Regulatory tightening or audit scrutiny
    const scenarioRadio = screen.getByRole("radio", { name: /Regulatory tightening or audit scrutiny/i });
    await user.click(scenarioRadio);

    // Run second stress test
    await user.click(screen.getByRole("button", { name: /Run stress-test/i }));

    // Confirm that the displayed results reflect the latest inputs
    expect(screen.getByText("Stress-Test Results")).toBeInTheDocument();
    expect(screen.getByText("Regulatory tightening or audit scrutiny")).toBeInTheDocument();
    expect(screen.queryByText("Rapid AI uptake in assessment")).not.toBeInTheDocument();

    // Verify resilience score updated to reflect higher inputs (27 -> 51)
    expect(screen.queryByText("27")).not.toBeInTheDocument();
    expect(screen.getByText("51")).toBeInTheDocument();

    // Verify local UI controls function properly on second run
    const updatedToggleBtns = screen.getAllByRole("button", { name: /Hide rationale|Why this matters/i });
    expect(updatedToggleBtns.length).toBeGreaterThan(0);
    const updatedInitialText = updatedToggleBtns[0].textContent;
    await user.click(updatedToggleBtns[0]);
    expect(updatedToggleBtns[0].textContent).not.toBe(updatedInitialText);
  });
});
