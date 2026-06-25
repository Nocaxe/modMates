import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect } from "vitest";
import { ConstraintRow } from "../constraints/ConstraintRow";
import type { Constraint } from "../../types/constraints";

const soft: Constraint = {
  id: "test-id",
  type: "earliest_start",
  kind: "soft",
  weight: 3,
  time: "0900",
};

const hard: Constraint = { ...soft, kind: "hard" };

it("renders the constraint label", () => {
  render(
    <ConstraintRow
      constraint={soft}
      onUpdate={vi.fn()}
      onToggleKind={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.getByText("Earliest start")).toBeInTheDocument();
});

it('shows "Constraint type: Soft" for a soft constraint', () => {
  render(
    <ConstraintRow
      constraint={soft}
      onUpdate={vi.fn()}
      onToggleKind={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.getByText("Constraint type: Soft")).toBeInTheDocument();
});

it('shows "Constraint type: Hard" for a hard constraint', () => {
  render(
    <ConstraintRow
      constraint={hard}
      onUpdate={vi.fn()}
      onToggleKind={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.getByText("Constraint type: Hard")).toBeInTheDocument();
});

it("calls onToggleKind when the kind toggle is clicked", async () => {
  const onToggleKind = vi.fn();
  render(
    <ConstraintRow
      constraint={soft}
      onUpdate={vi.fn()}
      onToggleKind={onToggleKind}
      onRemove={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByText("Constraint type: Soft"));
  expect(onToggleKind).toHaveBeenCalledOnce();
});

it("calls onRemove when the × button is clicked", async () => {
  const onRemove = vi.fn();
  render(
    <ConstraintRow
      constraint={soft}
      onUpdate={vi.fn()}
      onToggleKind={vi.fn()}
      onRemove={onRemove}
    />,
  );
  await userEvent.click(screen.getByTitle("Remove constraint"));
  expect(onRemove).toHaveBeenCalledOnce();
});

it("shows WeightSlider only for soft constraints", () => {
  const { rerender } = render(
    <ConstraintRow
      constraint={soft}
      onUpdate={vi.fn()}
      onToggleKind={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.getByText("Priority")).toBeInTheDocument();

  rerender(
    <ConstraintRow
      constraint={hard}
      onUpdate={vi.fn()}
      onToggleKind={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.queryByText("Priority")).not.toBeInTheDocument();
});

it("renders the correct config for each constraint type", () => {
  const cases: Array<{ constraint: Constraint; expectedText: string }> = [
    {
      constraint: { ...soft, type: "earliest_start", time: "0900" },
      expectedText: "No lessons before",
    },
    {
      constraint: { ...soft, type: "latest_end", time: "1800" },
      expectedText: "No lessons after",
    },
    {
      constraint: { ...soft, type: "free_days_count", count: 1 },
      expectedText: "At least",
    },
    {
      constraint: { ...soft, type: "specific_free_days", days: ["Monday"] },
      expectedText: "Keep these days free",
    },
    {
      constraint: {
        ...soft,
        type: "blocked_slot",
        day: "Monday",
        startTime: "1400",
        endTime: "1600",
      },
      expectedText: "to",
    },
    {
      constraint: {
        ...soft,
        type: "lunch_break",
        startTime: "1200",
        endTime: "1400",
        duration: 60,
      },
      expectedText: "Free window",
    },
    {
      constraint: { ...soft, type: "max_consecutive", hours: 3 },
      expectedText: "consecutive hours",
    },
  ];

  for (const { constraint, expectedText } of cases) {
    const { unmount } = render(
      <ConstraintRow
        constraint={constraint}
        onUpdate={vi.fn()}
        onToggleKind={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText(expectedText)).toBeInTheDocument();
    unmount();
  }
});
