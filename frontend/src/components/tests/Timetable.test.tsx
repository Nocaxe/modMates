import { render, screen, act, fireEvent } from "@testing-library/react";
import { vi, it, expect, beforeEach, afterEach } from "vitest";
import TimetableUI from "../../components/Timetable";
import type { TimetableData } from "../../api/timetable";

const { mockUseAuth, mockGetTimetable, mockSaveTimetable } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockGetTimetable: vi.fn(),
  mockSaveTimetable: vi.fn(),
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../../api/timetable", () => ({
  getTimetable: mockGetTimetable,
  saveTimetable: mockSaveTimetable,
}));

const LS_KEY = "modmates-timetable";
const TEST_SESSION = { access_token: "test-token" };

const ALL_MODULES = ["CS2103T", "CS2040S", "CS2101", "MA2001", "CS3230"];

const FULL_DEFAULT_SELECTION = {
  CS2103T: { Lecture: "1", Tutorial: "01" },
  CS2040S: { Lecture: "1", Tutorial: "01", Laboratory: "01" },
  CS2101: { "Sectional Teaching": "01" },
  MA2001: { Lecture: "1", Tutorial: "01" },
  CS3230: { Lecture: "1", Tutorial: "01" },
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  mockUseAuth.mockReturnValue({ session: null });
  mockGetTimetable.mockResolvedValue({ selection: {}, locked: [] });
  mockSaveTimetable.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// Rendering

it("renders all day abbreviations", () => {
  render(<TimetableUI />);
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
    expect(screen.getByText(day)).toBeInTheDocument();
  }
});

it("renders hour labels from 08:00 to 20:00", () => {
  render(<TimetableUI />);
  expect(screen.getByText("08:00")).toBeInTheDocument();
  expect(screen.getByText("20:00")).toBeInTheDocument();
});

it("renders all module codes in the default view", () => {
  render(<TimetableUI />);
  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

// localStorage: loading

it("falls back to default selection when localStorage is empty", () => {
  render(<TimetableUI />);
  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

it("reads saved selection from localStorage on mount", () => {
  const saved = {
    selection: FULL_DEFAULT_SELECTION,
    locked: [],
  };
  localStorage.setItem(LS_KEY, JSON.stringify(saved));

  render(<TimetableUI />);

  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

it("reads locked state from localStorage on mount", () => {
  const saved = {
    selection: FULL_DEFAULT_SELECTION,
    locked: ["MA2001|Lecture"],
  };
  localStorage.setItem(LS_KEY, JSON.stringify(saved));

  render(<TimetableUI />);

  expect(
    screen.getByRole("button", { name: "Unlock slot" }),
  ).toBeInTheDocument();
});

// localStorage: saving

it("writes timetable to localStorage on initial render", async () => {
  render(<TimetableUI />);
  await act(async () => {});

  const raw = localStorage.getItem(LS_KEY);
  expect(raw).not.toBeNull();
  const parsed = JSON.parse(raw!) as TimetableData;
  expect(parsed).toHaveProperty("selection");
  expect(parsed).toHaveProperty("locked");
  expect(Array.isArray(parsed.locked)).toBe(true);
});

it("persists locked state to localStorage after locking a slot", async () => {
  render(<TimetableUI />);
  await act(async () => {});

  const lockButtons = screen.getAllByRole("button", { name: "Lock slot" });
  fireEvent.click(lockButtons[0]);

  const raw = localStorage.getItem(LS_KEY);
  const parsed = JSON.parse(raw!) as TimetableData;
  expect(parsed.locked.length).toBeGreaterThan(0);
});

// API: GET timetable

it("does not call getTimetable when there is no session", async () => {
  mockUseAuth.mockReturnValue({ session: null });
  render(<TimetableUI />);
  await act(async () => {});

  expect(mockGetTimetable).not.toHaveBeenCalled();
});

it("calls getTimetable with the access token when authenticated", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  render(<TimetableUI />);
  await act(async () => {});

  expect(mockGetTimetable).toHaveBeenCalledWith("test-token");
});

it("applies selection and locked state from API when it returns non-empty data", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  mockGetTimetable.mockResolvedValue({
    selection: FULL_DEFAULT_SELECTION,
    locked: ["CS2103T|Lecture"],
  });

  render(<TimetableUI />);
  await act(async () => {});

  expect(
    screen.getByRole("button", { name: "Unlock slot" }),
  ).toBeInTheDocument();
});

it("does not update state when API returns an empty selection", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  mockGetTimetable.mockResolvedValue({ selection: {}, locked: [] });

  render(<TimetableUI />);
  await act(async () => {});

  expect(
    screen.queryByRole("button", { name: "Unlock slot" }),
  ).not.toBeInTheDocument();
});

it("renders with defaults when getTimetable throws", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  mockGetTimetable.mockRejectedValue(new Error("Network error"));

  render(<TimetableUI />);
  await act(async () => {});

  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

// API: PUT (debounced save)

it("does not call saveTimetable before the debounce window elapses", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  render(<TimetableUI />);
  await act(async () => {});

  act(() => {
    vi.advanceTimersByTime(999);
  });

  expect(mockSaveTimetable).not.toHaveBeenCalled();
});

it("calls saveTimetable with the token and data after 1000ms debounce", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  render(<TimetableUI />);
  await act(async () => {});

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(mockSaveTimetable).toHaveBeenCalledWith(
    "test-token",
    expect.objectContaining({
      selection: expect.any(Object) as Record<string, Record<string, string>>,
      locked: expect.any(Array) as string[],
    }),
  );
});

it("does not call saveTimetable even after debounce when not authenticated", async () => {
  mockUseAuth.mockReturnValue({ session: null });
  render(<TimetableUI />);
  await act(async () => {});

  act(() => {
    vi.advanceTimersByTime(2000);
  });

  expect(mockSaveTimetable).not.toHaveBeenCalled();
});

// Lock toggling

it("changes lock button label to Unlock slot after clicking Lock slot", async () => {
  render(<TimetableUI />);
  await act(async () => {});

  const lockButton = screen.getAllByRole("button", { name: "Lock slot" })[0];
  fireEvent.click(lockButton);

  expect(
    screen.getByRole("button", { name: "Unlock slot" }),
  ).toBeInTheDocument();
});

it("reverts Unlock slot back to Lock slot when clicked again", async () => {
  render(<TimetableUI />);
  await act(async () => {});

  const lockButton = screen.getAllByRole("button", { name: "Lock slot" })[0];
  fireEvent.click(lockButton);

  const unlockButton = screen.getByRole("button", { name: "Unlock slot" });
  fireEvent.click(unlockButton);

  expect(
    screen.queryByRole("button", { name: "Unlock slot" }),
  ).not.toBeInTheDocument();
});
