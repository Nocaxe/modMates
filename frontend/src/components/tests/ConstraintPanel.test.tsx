import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect } from "vitest";
import { useState, useEffect } from "react";
import { ConstraintPanel } from "../constraints/ConstraintPanel";
import type { Constraint } from "../../types/constraints";

// Wraps ConstraintPanel with the state management that OptimiserPage provides
function ControlledConstraintPanel({
  onChange,
}: {
  onChange?: (cs: Constraint[]) => void;
}) {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  useEffect(() => {
    onChange?.(constraints);
  }, [constraints, onChange]);
  return (
    <ConstraintPanel constraints={constraints} onConstraintsChange={setConstraints} />
  );
}

it("shows empty state when there are no constraints", () => {
  render(<ControlledConstraintPanel />);
  expect(screen.getByText("No constraints yet.")).toBeInTheDocument();
});

it("opens the add menu when the Add button is clicked", async () => {
  render(<ControlledConstraintPanel />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  expect(
    screen.getByText("No lessons before a given time"),
  ).toBeInTheDocument();
  expect(screen.getByText("No lessons after a given time")).toBeInTheDocument();
});

it("closes the menu after selecting a constraint type", async () => {
  render(<ControlledConstraintPanel />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  await userEvent.click(screen.getByText("No lessons before a given time"));
  expect(
    screen.queryByText("No lessons before a given time"),
  ).not.toBeInTheDocument();
});

it("renders a constraint row after adding a constraint", async () => {
  render(<ControlledConstraintPanel />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  await userEvent.click(screen.getByText("No lessons before a given time"));
  expect(screen.queryByText("No constraints yet.")).not.toBeInTheDocument();
  expect(screen.getByText("Constraint type: Soft")).toBeInTheDocument();
});

it("hides a once-only type from the menu after it is added", async () => {
  render(<ControlledConstraintPanel />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  await userEvent.click(screen.getByText("No lessons before a given time"));
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  expect(
    screen.queryByText("No lessons before a given time"),
  ).not.toBeInTheDocument();
});

it("allows blocked_slot to be added more than once", async () => {
  render(<ControlledConstraintPanel />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  await userEvent.click(screen.getByText("Block a recurring time window"));
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  expect(screen.getByText("Block a recurring time window")).toBeInTheDocument();
});

it("calls onChange with the constraint payload when a constraint is added", async () => {
  const onChange = vi.fn();
  render(<ControlledConstraintPanel onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  await userEvent.click(screen.getByText("No lessons before a given time"));
  expect(onChange).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ type: "earliest_start", kind: "soft" }),
    ]),
  );
});

it("removes the constraint row when the × button is clicked", async () => {
  render(<ControlledConstraintPanel />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  await userEvent.click(screen.getByText("No lessons before a given time"));
  await userEvent.click(screen.getByTitle("Remove constraint"));
  expect(screen.getByText("No constraints yet.")).toBeInTheDocument();
});

it("closes the menu when clicking outside", async () => {
  render(<ControlledConstraintPanel />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  expect(
    screen.getByText("No lessons before a given time"),
  ).toBeInTheDocument();
  await userEvent.click(document.body);
  expect(
    screen.queryByText("No lessons before a given time"),
  ).not.toBeInTheDocument();
});
