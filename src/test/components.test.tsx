import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Card from "../components/Card";
import DomainBars from "../components/DomainBars";
import SignalBadge from "../components/SignalBadge";

describe("Components", () => {
  describe("Card", () => {
    it("renders children, title, and right slot", () => {
      render(
        <Card title="Test Title" right={<span>Extra Action</span>}>
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Extra Action")).toBeInTheDocument();
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("renders without title or right slot", () => {
      render(
        <Card>
          <div>Simple Card</div>
        </Card>
      );
      expect(screen.getByText("Simple Card")).toBeInTheDocument();
    });
  });

  describe("SignalBadge", () => {
    it("renders Concern badge with correct css class", () => {
      const { container } = render(<SignalBadge level="Concern" />);
      expect(screen.getByText("Concern")).toBeInTheDocument();
      expect(container.querySelector(".badge--concern")).toBeInTheDocument();
    });

    it("renders Watch badge with correct css class", () => {
      const { container } = render(<SignalBadge level="Watch" />);
      expect(screen.getByText("Watch")).toBeInTheDocument();
      expect(container.querySelector(".badge--watch")).toBeInTheDocument();
    });

    it("renders Info badge with correct css class", () => {
      const { container } = render(<SignalBadge level="Info" />);
      expect(screen.getByText("Info")).toBeInTheDocument();
      expect(container.querySelector(".badge--info")).toBeInTheDocument();
    });
  });

  describe("DomainBars", () => {
    it("renders bars for all 6 domains with corresponding labels and percentages", () => {
      const scores = {
        awareness: 4,
        coagency: 2,
        practice: 1,
        ethics: 3,
        governance: 0,
        renewal: 2,
      };
      render(<DomainBars scores={scores} />);

      expect(screen.getByText("Awareness & Orientation")).toBeInTheDocument();
      expect(screen.getByText("4/4")).toBeInTheDocument();
      expect(screen.getByText("Strong")).toBeInTheDocument();

      expect(screen.getByText("Ethics, Equity & Impact")).toBeInTheDocument();
      expect(screen.getByText("3/4")).toBeInTheDocument();

      expect(screen.getByText("Decision-Making & Governance")).toBeInTheDocument();
      expect(screen.getByText("0/4")).toBeInTheDocument();
    });
  });
});
