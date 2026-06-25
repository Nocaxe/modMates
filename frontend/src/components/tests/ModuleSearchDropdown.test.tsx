import { render, screen, fireEvent } from "@testing-library/react";
import { vi, it, expect, beforeEach, afterEach } from "vitest";
import { ModuleSearchDropdown } from "../ModuleSearchDropdown";


// this mocks the api functions, and hoisting allows variable definitions to be used before they are initialised
const { mockSearchModules, mockGetModuleDetail} = vi.hoisted(() => ({
  mockSearchModules: vi.fn(),
  mockGetModuleDetail: vi.fn(),
}));

// replaces the actual api functions with mocked ones, components using these functions will call the mocked ones instead
vi.mock("../../api/modules", () => ({
    searchModules: mockSearchModules,
    getModuleDetail: mockGetModuleDetail,
    moduleDetailToModule: (d: unknown) => d,
}));

// fake data / results

const FAKE_RESULTS = [
    {moduleCode: "CS2103T", title: "Software Engineering"},
    {moduleCode: "CS2040S", title: "Data Structures and Algorithms"},
];

const FAKE_DETAIL = {
    moduleCode: "CS2103T",
    title: "Software Engineering",
    description: "This module is about software engineering.",
    semesterData: [
        { semester: 1, examDate: "2024-11-25T17:00:00.000Z", examDuration: 120, timetable: [] },
    ],
};

beforeEach(() => {
    mockSearchModules.mockResolvedValue(FAKE_RESULTS);
    mockGetModuleDetail.mockResolvedValue(FAKE_DETAIL);
});

afterEach(() => {
    vi.clearAllMocks();
});

// fires a change event on the input — the component's 300ms debounce will fire with real timers
// findByText (used in each test) retries for up to 1000ms, so it catches the result in time
function triggerSearch(query: string) {
    const input = screen.getByPlaceholderText("Search e.g. CS2040S");
    fireEvent.change(input, { target: { value: query } });
}


// the actual test cases

it("renders the search input", () => {
    render(<ModuleSearchDropdown onAddModule={vi.fn()} addedModuleCodes={new Set()} />);
    expect(screen.getByPlaceholderText("Search e.g. CS2040S")).toBeInTheDocument();
});

it("does not show a dropdown on initial render", () => {
  render(<ModuleSearchDropdown onAddModule={vi.fn()} addedModuleCodes={new Set()} />);
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

// tests for search and displaying of results
it("shows module codes and titles after a valid search", async () => {
  render(<ModuleSearchDropdown onAddModule={vi.fn()} addedModuleCodes={new Set()} />);
  triggerSearch("CS20");
  expect(await screen.findAllByText("CS2040S")).not.toHaveLength(0);
});

it("shows an error message when the search API fails", async () => {
  mockSearchModules.mockRejectedValue(new Error("Network error"));
  render(<ModuleSearchDropdown onAddModule={vi.fn()} addedModuleCodes={new Set()} />);
  triggerSearch("CS20");
  expect(await screen.findByText("Failed to search modules")).toBeInTheDocument();
});


// already added modules
it("shows the 'Added ✓' badge for modules already in addedModuleCodes", async () => {
  render(
    <ModuleSearchDropdown
      onAddModule={vi.fn()}
      addedModuleCodes={new Set(["CS2040S"])}
    />
  );
  triggerSearch("CS20");
  expect(await screen.findByText("Added ✓")).toBeInTheDocument();
});


it("shows an error when clicking an already-added module", async () => {
  render(
    <ModuleSearchDropdown
      onAddModule={vi.fn()}
      addedModuleCodes={new Set(["CS2040S"])}
    />
  );
  triggerSearch("CS20");
  fireEvent.click((await screen.findAllByText("CS2040S"))[0]);
  expect(await screen.findByText("Module already added")).toBeInTheDocument();
});

// closing behaviour
it("closes the dropdown when clicking outside", async () => {
  render(<ModuleSearchDropdown onAddModule={vi.fn()} addedModuleCodes={new Set()} />);
  triggerSearch("CS20");
  expect(await screen.findAllByText("CS2040S")).not.toHaveLength(0);
  fireEvent.mouseDown(document.body);
  expect(screen.queryAllByText("CS2040S")).toHaveLength(0);
});
