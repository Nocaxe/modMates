import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { SolutionPicker } from "../SolutionPicker";
import type { RankedSolution } from "../../api/optimise";

const SOLUTIONS: RankedSolution[] = [
  { selection: { CS2040S: { Lecture: "1" } }, score: 0.9 },
  { selection: { CS2040S: { Lecture: "2" } }, score: 0.6 },
  { selection: { CS2040S: { Lecture: "3" } }, score: 0.2 },
];

it("renders nothing when there are no solutions", () => {
  const { container } = render(
    <SolutionPicker solutions={[]} selectedIndex={0} onSelect={vi.fn()} />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("renders nothing when there is only one solution", () => {
  const { container } = render(
    <SolutionPicker solutions={[SOLUTIONS[0]]} selectedIndex={0} onSelect={vi.fn()} />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("renders a summary line with the solution count", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={0} onSelect={vi.fn()} />);
  expect(
    screen.getByText("3 ranked timetables found — select one to apply it."),
  ).toBeInTheDocument();
});

it("renders one numbered button per solution", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={0} onSelect={vi.fn()} />);
  expect(screen.getByText("#1")).toBeInTheDocument();
  expect(screen.getByText("#2")).toBeInTheDocument();
  expect(screen.getByText("#3")).toBeInTheDocument();
});

it("shows the rounded score percentage for each solution", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={0} onSelect={vi.fn()} />);
  expect(screen.getByText("90%")).toBeInTheDocument();
  expect(screen.getByText("60%")).toBeInTheDocument();
  expect(screen.getByText("20%")).toBeInTheDocument();
});

it("applies a green badge for scores at or above 0.8", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={0} onSelect={vi.fn()} />);
  expect(screen.getByText("90%")).toHaveClass("bg-green-100", "text-green-800");
});

it("applies a yellow badge for scores between 0.5 and 0.8", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={0} onSelect={vi.fn()} />);
  expect(screen.getByText("60%")).toHaveClass("bg-yellow-100", "text-yellow-800");
});

it("applies a red badge for scores below 0.5", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={0} onSelect={vi.fn()} />);
  expect(screen.getByText("20%")).toHaveClass("bg-red-100", "text-red-700");
});

it("treats a score of exactly 0.8 as the green threshold", () => {
  const solutions: RankedSolution[] = [
    { selection: {}, score: 0.8 },
    { selection: {}, score: 0 },
  ];
  render(<SolutionPicker solutions={solutions} selectedIndex={0} onSelect={vi.fn()} />);
  expect(screen.getByText("80%")).toHaveClass("bg-green-100");
});

it("treats a score of exactly 0.5 as the yellow threshold", () => {
  const solutions: RankedSolution[] = [
    { selection: {}, score: 0.5 },
    { selection: {}, score: 0.9 },
  ];
  render(<SolutionPicker solutions={solutions} selectedIndex={0} onSelect={vi.fn()} />);
  expect(screen.getByText("50%")).toHaveClass("bg-yellow-100");
});

it("highlights the button matching selectedIndex", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={1} onSelect={vi.fn()} />);
  expect(screen.getByText("#2").closest("button")).toHaveClass("border-blue-500");
});

it("does not highlight buttons that are not selected", () => {
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={1} onSelect={vi.fn()} />);
  expect(screen.getByText("#1").closest("button")).not.toHaveClass("border-blue-500");
  expect(screen.getByText("#3").closest("button")).not.toHaveClass("border-blue-500");
});

it("calls onSelect with the index of the clicked solution", async () => {
  const onSelect = vi.fn();
  render(<SolutionPicker solutions={SOLUTIONS} selectedIndex={0} onSelect={onSelect} />);
  await userEvent.click(screen.getByText("#3").closest("button")!);
  expect(onSelect).toHaveBeenCalledWith(2);
});
