import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect } from "vitest";
import { DayToggle } from "../constraints/DayToggle";

it("renders Mon through Fri buttons", () => {
  render(<DayToggle selected={[]} onChange={vi.fn()} />);
  for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  }
});

it("clicking an unselected day adds it to the selection", async () => {
  const onChange = vi.fn();
  render(<DayToggle selected={[]} onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Mon" }));
  expect(onChange).toHaveBeenCalledWith(["Monday"]);
});

it("clicking an already-selected day removes it", async () => {
  const onChange = vi.fn();
  render(<DayToggle selected={["Monday", "Wednesday"]} onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Mon" }));
  expect(onChange).toHaveBeenCalledWith(["Wednesday"]);
});

it("in multi-select, multiple days can be selected", async () => {
  const onChange = vi.fn();
  render(<DayToggle selected={["Monday"]} onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Fri" }));
  expect(onChange).toHaveBeenCalledWith(["Monday", "Friday"]);
});

it("in single mode, clicking a day replaces the entire selection", async () => {
  const onChange = vi.fn();
  render(<DayToggle selected={["Monday"]} onChange={onChange} single />);
  await userEvent.click(screen.getByRole("button", { name: "Tue" }));
  expect(onChange).toHaveBeenCalledWith(["Tuesday"]);
});
