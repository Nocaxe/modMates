import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { JointOptimisePanel } from "../JointOptimisePanel";
import type { JointMemberResult } from "../../api/groups";

const MEMBER_WITH_CHANGES: JointMemberResult = {
  user_id: "alice-id",
  email: "alice@example.com",
  proposed_selection: { CS2040S: { Lecture: "02", Tutorial: "10" } },
  current_selection: { CS2040S: { Lecture: "01", Tutorial: "10" } },
  score: 0.9,
};

const MEMBER_NO_CHANGES: JointMemberResult = {
  user_id: "bob-id",
  email: "bob@example.com",
  proposed_selection: { CS1010: { Lecture: "01" } },
  current_selection: { CS1010: { Lecture: "01" } },
  score: 1.0,
};

it("shows the warning banner with member count and group name", () => {
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_WITH_CHANGES, MEMBER_NO_CHANGES]}
      groupName="CS Friends"
      onApply={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
  expect(
    screen.getByText(/This will update all 2 members of/),
  ).toBeInTheDocument();
  expect(screen.getByText("CS Friends")).toBeInTheDocument();
});

it("renders each member's email", () => {
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_WITH_CHANGES, MEMBER_NO_CHANGES]}
      groupName="Group"
      onApply={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
  expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  expect(screen.getByText("bob@example.com")).toBeInTheDocument();
});

it("shows 'No changes' for a member whose proposed selection matches their current selection", () => {
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_NO_CHANGES]}
      groupName="Group"
      onApply={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
  expect(screen.getByText("No changes")).toBeInTheDocument();
});

it("shows the old class, an arrow, and the new class for a changed lesson type", () => {
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_WITH_CHANGES]}
      groupName="Group"
      onApply={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
  expect(screen.getByText("01")).toBeInTheDocument();
  expect(screen.getByText("→")).toBeInTheDocument();
  expect(screen.getByText("02")).toBeInTheDocument();
});

it("marks the changed lesson row amber and the unchanged lesson row gray", () => {
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_WITH_CHANGES]}
      groupName="Group"
      onApply={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
  expect(
    screen.getByText("CS2040S Lecture").closest("div"),
  ).toHaveClass("text-amber-300");
  expect(
    screen.getByText("CS2040S Tutorial").closest("div"),
  ).toHaveClass("text-gray-500");
});

it("disables the Apply button when no member has changes", () => {
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_NO_CHANGES]}
      groupName="Group"
      onApply={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: /Apply for everyone/ }),
  ).toBeDisabled();
});

it("enables the Apply button when at least one member has changes", () => {
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_WITH_CHANGES]}
      groupName="Group"
      onApply={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: /Apply for everyone/ }),
  ).not.toBeDisabled();
});

it("calls onApply when the Apply button is clicked", async () => {
  const onApply = vi.fn();
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_WITH_CHANGES]}
      groupName="Group"
      onApply={onApply}
      onDismiss={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: /Apply for everyone/ }));
  expect(onApply).toHaveBeenCalledOnce();
});

it("calls onDismiss when the Discard button is clicked", async () => {
  const onDismiss = vi.fn();
  render(
    <JointOptimisePanel
      selectedSolution={[MEMBER_WITH_CHANGES]}
      groupName="Group"
      onApply={vi.fn()}
      onDismiss={onDismiss}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Discard" }));
  expect(onDismiss).toHaveBeenCalledOnce();
});
