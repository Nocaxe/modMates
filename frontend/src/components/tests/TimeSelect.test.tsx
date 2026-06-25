import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect } from "vitest";
import { TimeSelect } from "../constraints/TimeSelect";

it("renders an option for 8:00 AM", () => {
  render(<TimeSelect value="0800" onChange={vi.fn()} />);
  expect(screen.getByRole("option", { name: "8:00 AM" })).toBeInTheDocument();
});

it("renders an option for 12:00 PM", () => {
  render(<TimeSelect value="1200" onChange={vi.fn()} />);
  expect(screen.getByRole("option", { name: "12:00 PM" })).toBeInTheDocument();
});

it("renders an option for 1:00 PM", () => {
  render(<TimeSelect value="1300" onChange={vi.fn()} />);
  expect(screen.getByRole("option", { name: "1:00 PM" })).toBeInTheDocument();
});

it("max prop excludes times after the cutoff", () => {
  render(<TimeSelect value="0800" onChange={vi.fn()} max="0900" />);
  expect(
    screen.queryByRole("option", { name: "9:30 AM" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "8:00 AM" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "9:00 AM" })).toBeInTheDocument();
});

it("min prop excludes times before the cutoff", () => {
  render(<TimeSelect value="1200" onChange={vi.fn()} min="1200" />);
  expect(
    screen.queryByRole("option", { name: "11:30 AM" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "12:00 PM" })).toBeInTheDocument();
});

it("calls onChange with the selected time value", async () => {
  const onChange = vi.fn();
  render(<TimeSelect value="0800" onChange={onChange} />);
  await userEvent.selectOptions(screen.getByRole("combobox"), "0900");
  expect(onChange).toHaveBeenCalledWith("0900");
});
