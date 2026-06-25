import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect } from "vitest";
import { WeightSlider } from "../constraints/WeightSlider";

it("renders 5 step buttons", () => {
  render(<WeightSlider value={3} onChange={vi.fn()} />);
  expect(screen.getAllByRole("button")).toHaveLength(5);
});

it("renders Low, Mid, and High anchor labels", () => {
  render(<WeightSlider value={3} onChange={vi.fn()} />);
  expect(screen.getByText("Low")).toBeInTheDocument();
  expect(screen.getByText("Mid")).toBeInTheDocument();
  expect(screen.getByText("High")).toBeInTheDocument();
});

it("calls onChange with 1 when the first step is clicked", async () => {
  const onChange = vi.fn();
  render(<WeightSlider value={3} onChange={onChange} />);
  await userEvent.click(screen.getAllByRole("button")[0]);
  expect(onChange).toHaveBeenCalledWith(1);
});

it("calls onChange with 5 when the last step is clicked", async () => {
  const onChange = vi.fn();
  render(<WeightSlider value={1} onChange={onChange} />);
  await userEvent.click(screen.getAllByRole("button")[4]);
  expect(onChange).toHaveBeenCalledWith(5);
});

it("calls onChange with the correct middle value", async () => {
  const onChange = vi.fn();
  render(<WeightSlider value={1} onChange={onChange} />);
  await userEvent.click(screen.getAllByRole("button")[2]); // step 3
  expect(onChange).toHaveBeenCalledWith(3);
});
