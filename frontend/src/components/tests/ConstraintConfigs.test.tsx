import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect, describe } from "vitest";
import { FreeDaysCountConfig } from "../constraints/configs/FreeDaysCountConfig";
import { SpecificFreeDaysConfig } from "../constraints/configs/SpecificFreeDaysConfig";
import { BlockedSlotConfig } from "../constraints/configs/BlockedSlotConfig";
import { LunchBreakConfig } from "../constraints/configs/LunchBreakConfig";
import { MaxConsecutiveConfig } from "../constraints/configs/MaxConsecutiveConfig";
import { EarliestStartConfig } from "../constraints/configs/EarliestStartConfig";
import { LatestEndConfig } from "../constraints/configs/LatestEndConfig";
import type {
  FreeDaysCountConstraint,
  SpecificFreeDaysConstraint,
  BlockedSlotConstraint,
  LunchBreakConstraint,
  MaxConsecutiveConstraint,
  EarliestStartConstraint,
  LatestEndConstraint,
} from "../../types/constraints";

const base = { id: "x", kind: "soft" as const, weight: 3 };

describe("EarliestStartConfig", () => {
  it('renders "No lessons before" label', () => {
    const c: EarliestStartConstraint = {
      ...base,
      type: "earliest_start",
      time: "0900",
    };
    render(<EarliestStartConfig c={c} onChange={vi.fn()} />);
    expect(screen.getByText("No lessons before")).toBeInTheDocument();
  });

  it("calls onChange with the new time when the select changes", async () => {
    const onChange = vi.fn();
    const c: EarliestStartConstraint = {
      ...base,
      type: "earliest_start",
      time: "0800",
    };
    render(<EarliestStartConfig c={c} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "1000");
    expect(onChange).toHaveBeenCalledWith({ time: "1000" });
  });
});

describe("LatestEndConfig", () => {
  it('renders "No lessons after" label', () => {
    const c: LatestEndConstraint = {
      ...base,
      type: "latest_end",
      time: "1800",
    };
    render(<LatestEndConfig c={c} onChange={vi.fn()} />);
    expect(screen.getByText("No lessons after")).toBeInTheDocument();
  });

  it("only shows options from 12:00 PM onward", () => {
    const c: LatestEndConstraint = {
      ...base,
      type: "latest_end",
      time: "1800",
    };
    render(<LatestEndConfig c={c} onChange={vi.fn()} />);
    expect(
      screen.queryByRole("option", { name: "11:30 AM" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "12:00 PM" }),
    ).toBeInTheDocument();
  });
});

describe("FreeDaysCountConfig", () => {
  it("renders buttons for 1 through 4", () => {
    const c: FreeDaysCountConstraint = {
      ...base,
      type: "free_days_count",
      count: 1,
    };
    render(<FreeDaysCountConfig c={c} onChange={vi.fn()} />);
    for (const n of [1, 2, 3, 4]) {
      expect(
        screen.getByRole("button", { name: String(n) }),
      ).toBeInTheDocument();
    }
  });

  it('shows singular "free day" when count is 1', () => {
    const c: FreeDaysCountConstraint = {
      ...base,
      type: "free_days_count",
      count: 1,
    };
    render(<FreeDaysCountConfig c={c} onChange={vi.fn()} />);
    expect(screen.getByText("free day")).toBeInTheDocument();
  });

  it('shows plural "free days" when count is greater than 1', () => {
    const c: FreeDaysCountConstraint = {
      ...base,
      type: "free_days_count",
      count: 3,
    };
    render(<FreeDaysCountConfig c={c} onChange={vi.fn()} />);
    expect(screen.getByText("free days")).toBeInTheDocument();
  });

  it("calls onChange with the selected count", async () => {
    const onChange = vi.fn();
    const c: FreeDaysCountConstraint = {
      ...base,
      type: "free_days_count",
      count: 1,
    };
    render(<FreeDaysCountConfig c={c} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onChange).toHaveBeenCalledWith({ count: 3 });
  });
});

describe("SpecificFreeDaysConfig", () => {
  it("shows a warning when no days are selected", () => {
    const c: SpecificFreeDaysConstraint = {
      ...base,
      type: "specific_free_days",
      days: [],
    };
    render(<SpecificFreeDaysConfig c={c} onChange={vi.fn()} />);
    expect(screen.getByText("Select at least one day.")).toBeInTheDocument();
  });

  it("hides the warning when at least one day is selected", () => {
    const c: SpecificFreeDaysConstraint = {
      ...base,
      type: "specific_free_days",
      days: ["Monday"],
    };
    render(<SpecificFreeDaysConfig c={c} onChange={vi.fn()} />);
    expect(
      screen.queryByText("Select at least one day."),
    ).not.toBeInTheDocument();
  });

  it("calls onChange when a day is toggled", async () => {
    const onChange = vi.fn();
    const c: SpecificFreeDaysConstraint = {
      ...base,
      type: "specific_free_days",
      days: [],
    };
    render(<SpecificFreeDaysConfig c={c} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Mon" }));
    expect(onChange).toHaveBeenCalledWith({ days: ["Monday"] });
  });
});

describe("BlockedSlotConfig", () => {
  it("shows a validation error when end time equals start time", () => {
    const c: BlockedSlotConstraint = {
      ...base,
      type: "blocked_slot",
      day: "Monday",
      startTime: "1400",
      endTime: "1400",
    };
    render(<BlockedSlotConfig c={c} onChange={vi.fn()} />);
    expect(
      screen.getByText("End time must be after start time."),
    ).toBeInTheDocument();
  });

  it("hides the validation error when end time is after start time", () => {
    const c: BlockedSlotConstraint = {
      ...base,
      type: "blocked_slot",
      day: "Monday",
      startTime: "1400",
      endTime: "1600",
    };
    render(<BlockedSlotConfig c={c} onChange={vi.fn()} />);
    expect(
      screen.queryByText("End time must be after start time."),
    ).not.toBeInTheDocument();
  });
});

describe("MaxConsecutiveConfig", () => {
  it("renders buttons for 2 through 6 hours", () => {
    const c: MaxConsecutiveConstraint = {
      ...base,
      type: "max_consecutive",
      hours: 3,
    };
    render(<MaxConsecutiveConfig c={c} onChange={vi.fn()} />);
    for (const h of [2, 3, 4, 5, 6]) {
      expect(
        screen.getByRole("button", { name: String(h) }),
      ).toBeInTheDocument();
    }
  });

  it("calls onChange with the selected hours", async () => {
    const onChange = vi.fn();
    const c: MaxConsecutiveConstraint = {
      ...base,
      type: "max_consecutive",
      hours: 3,
    };
    render(<MaxConsecutiveConfig c={c} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "5" }));
    expect(onChange).toHaveBeenCalledWith({ hours: 5 });
  });
});

describe("LunchBreakConfig", () => {
  const lunchBreak: LunchBreakConstraint = {
    ...base,
    type: "lunch_break",
    startTime: "1200",
    endTime: "1400",
    duration: 60,
  };

  it("renders duration option buttons", () => {
    render(<LunchBreakConfig c={lunchBreak} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "30m" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "60m" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90m" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "120m" })).toBeInTheDocument();
  });

  it("calls onChange with the selected duration", async () => {
    const onChange = vi.fn();
    render(<LunchBreakConfig c={lunchBreak} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "90m" }));
    expect(onChange).toHaveBeenCalledWith({ duration: 90 });
  });
});
