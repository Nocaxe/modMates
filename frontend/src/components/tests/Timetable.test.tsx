import { render, screen, act, fireEvent } from "@testing-library/react";
import { useState, useEffect } from "react";
import { vi, it, expect, beforeEach, afterEach } from "vitest";
import TimetableUI, { type Module, type SelectionState } from "../../components/Timetable";
import { BottomPanel } from "../../components/BottomPanel";
import { getTimetable, saveTimetable, type TimetableData } from "../../api/timetable";
import { useAuth } from "../../contexts/AuthContext";

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

// Mirrors OptimiserPage's state management so tests can pass only `modules`
function TimetableWrapper({ modules = [] }: { modules?: Module[] }) {
  const { session } = useAuth();
  const [selection, setSelection] = useState<SelectionState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return (raw ? (JSON.parse(raw) as TimetableData) : null)?.selection ?? {};
    } catch {
      return {};
    }
  });
  const [locked, setLocked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return new Set((raw ? (JSON.parse(raw) as TimetableData) : null)?.locked ?? []);
    } catch {
      return new Set();
    }
  });
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) return;
    getTimetable(session.access_token)
      .then((data: TimetableData) => {
        if (Object.keys(data.selection).length > 0) {
          setSelection(data.selection);
          setLocked(new Set(data.locked));
        }
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    const data: TimetableData = {
      selection,
      locked: [...locked],
      skipped: [...skipped],
      modules: modules.map((m) => m.code),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    if (!session) return;
    const timer = setTimeout(() => {
      saveTimetable(session.access_token, data).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [selection, locked, skipped, modules, session]);

  return (
    <>
      <TimetableUI
        modules={modules}
        selection={selection}
        locked={locked}
        skipped={skipped}
        onSelectionChange={setSelection}
      />
      <BottomPanel
        modules={modules}
        locked={locked}
        onLockedChange={setLocked}
        skipped={skipped}
        onSkippedChange={setSkipped}
        onAddModule={() => {}}
        onRemoveModule={() => {}}
      />
    </>
  );
}

const ALL_MODULES = ["CS2103T", "CS2040S", "CS2101", "MA2001", "CS3230"];

const MOCK_MODULES: Module[] = [
  {
    code: "CS2103T",
    title: "Software Engineering",
    lessons: {
      Lecture: {
        slots: [{ classNo: "1", day: "Friday", start: 960, end: 1080, venue: "iCube Aud" }],
      },
      Tutorial: {
        slots: [{ classNo: "01", day: "Wednesday", start: 600, end: 660, venue: "COM1-0210" }],
      },
    },
  },
  {
    code: "CS2040S",
    title: "Data Structures and Algorithms",
    lessons: {
      Lecture: {
        slots: [{ classNo: "1", day: "Tuesday", start: 600, end: 720, venue: "LT19" }],
      },
      Tutorial: {
        slots: [{ classNo: "01", day: "Thursday", start: 540, end: 600, venue: "COM1-0210" }],
      },
      Laboratory: {
        slots: [{ classNo: "01", day: "Monday", start: 720, end: 840, venue: "COM1-B111" }],
      },
    },
  },
  {
    code: "CS2101",
    title: "Effective Communication for Computing Professionals",
    lessons: {
      "Sectional Teaching": {
        slots: [{ classNo: "01", day: "Monday", start: 600, end: 720, venue: "COM1-0201" }],
      },
    },
  },
  {
    code: "MA2001",
    title: "Linear Algebra I",
    lessons: {
      Lecture: {
        slots: [{ classNo: "1", day: "Monday", start: 480, end: 600, venue: "LT34" }],
      },
      Tutorial: {
        slots: [{ classNo: "01", day: "Wednesday", start: 480, end: 540, venue: "S17-0304" }],
      },
    },
  },
  {
    code: "CS3230",
    title: "Design and Analysis of Algorithms",
    lessons: {
      Lecture: {
        slots: [{ classNo: "1", day: "Tuesday", start: 480, end: 600, venue: "LT19" }],
      },
      Tutorial: {
        slots: [{ classNo: "01", day: "Friday", start: 600, end: 660, venue: "COM1-0210" }],
      },
    },
  },
];

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
  mockGetTimetable.mockResolvedValue({ selection: {}, locked: [], skipped: [] });
  mockSaveTimetable.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// Rendering

it("renders all day abbreviations", () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
    expect(screen.getByText(day)).toBeInTheDocument();
  }
});

it("renders hour labels from 08:00 to 20:00", () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  expect(screen.getByText("08:00")).toBeInTheDocument();
  expect(screen.getByText("20:00")).toBeInTheDocument();
});

it("renders all module codes in the default view", () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

// localStorage: loading

it("falls back to default selection when localStorage is empty", () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

it("reads saved selection from localStorage on mount", () => {
  const saved = {
    selection: FULL_DEFAULT_SELECTION,
    locked: [],
    skipped: [],
  };
  localStorage.setItem(LS_KEY, JSON.stringify(saved));

  render(<TimetableWrapper modules={MOCK_MODULES} />);

  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

it("reads locked state from localStorage on mount", () => {
  const saved = {
    selection: FULL_DEFAULT_SELECTION,
    locked: ["MA2001|Lecture"],
    skipped: [],
  };
  localStorage.setItem(LS_KEY, JSON.stringify(saved));

  render(<TimetableWrapper modules={MOCK_MODULES} />);

  expect(
    screen.getByRole("button", { name: "Unlock Lecture" }),
  ).toBeInTheDocument();
});

// localStorage: saving

it("writes timetable to localStorage on initial render", async () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  const raw = localStorage.getItem(LS_KEY);
  expect(raw).not.toBeNull();
  const parsed = JSON.parse(raw!) as TimetableData;
  expect(parsed).toHaveProperty("selection");
  expect(parsed).toHaveProperty("locked");
  expect(Array.isArray(parsed.locked)).toBe(true);
});

it("persists locked state to localStorage after locking a slot", async () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  const lockButtons = screen.getAllByRole("button", { name: /^Lock / });
  fireEvent.click(lockButtons[0]);

  const raw = localStorage.getItem(LS_KEY);
  const parsed = JSON.parse(raw!) as TimetableData;
  expect(parsed.locked.length).toBeGreaterThan(0);
});

// API: GET timetable

it("does not call getTimetable when there is no session", async () => {
  mockUseAuth.mockReturnValue({ session: null });
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  expect(mockGetTimetable).not.toHaveBeenCalled();
});

it("calls getTimetable with the access token when authenticated", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  expect(mockGetTimetable).toHaveBeenCalledWith("test-token");
});

it("applies selection and locked state from API when it returns non-empty data", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  mockGetTimetable.mockResolvedValue({
    selection: FULL_DEFAULT_SELECTION,
    locked: ["CS2103T|Lecture"],
    skipped: [],
  });

  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  expect(
    screen.getByRole("button", { name: "Unlock Lecture" }),
  ).toBeInTheDocument();
});

it("does not update state when API returns an empty selection", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  mockGetTimetable.mockResolvedValue({ selection: {}, locked: [], skipped: [] });

  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  expect(
    screen.queryByRole("button", { name: "Unlock slot" }),
  ).not.toBeInTheDocument();
});

it("renders with defaults when getTimetable throws", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  mockGetTimetable.mockRejectedValue(new Error("Network error"));

  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  for (const code of ALL_MODULES) {
    expect(screen.getAllByText(code).length).toBeGreaterThan(0);
  }
});

// API: PUT (debounced save)

it("does not call saveTimetable before the debounce window elapses", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  act(() => {
    vi.advanceTimersByTime(999);
  });

  expect(mockSaveTimetable).not.toHaveBeenCalled();
});

it("calls saveTimetable with the token and data after 1000ms debounce", async () => {
  mockUseAuth.mockReturnValue({ session: TEST_SESSION });
  render(<TimetableWrapper modules={MOCK_MODULES} />);
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
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  act(() => {
    vi.advanceTimersByTime(2000);
  });

  expect(mockSaveTimetable).not.toHaveBeenCalled();
});

// Lock toggling

it("changes lock button label to Unlock after clicking Lock", async () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  const lockButton = screen.getAllByRole("button", { name: /^Lock / })[0];
  fireEvent.click(lockButton);

  expect(
    screen.getByRole("button", { name: /^Unlock / }),
  ).toBeInTheDocument();
});

it("reverts Unlock back to Lock when clicked again", async () => {
  render(<TimetableWrapper modules={MOCK_MODULES} />);
  await act(async () => {});

  const lockButton = screen.getAllByRole("button", { name: /^Lock / })[0];
  fireEvent.click(lockButton);

  const unlockButton = screen.getByRole("button", { name: /^Unlock / });
  fireEvent.click(unlockButton);

  expect(
    screen.queryByRole("button", { name: /^Unlock / }),
  ).not.toBeInTheDocument();
});
