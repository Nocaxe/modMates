import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect, beforeEach, afterEach } from "vitest";
import { ModuleSearchDropdown } from "../ModuleSearchDropdown";


// this mocks the api functions, and hoisting allows variable definitions to be used before they are initialised
const { mockSearchModules, mockGetModuleDetail} = vi.hoisted(() => ({
  mockSearchModules: vi.fn(),
  mockGetModuleDetail: vi.fn(),
}));

// replaces the actual api functions with mocked one, components using these function will call the mocked ones instead
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
    // reset the mock functions before evach test
    vi.useFakeTimers();
    mockSearchModules.mockResolvedValue(FAKE_RESULTS);
    mockGetModuleDetail.mockResolvedValue(FAKE_DETAIL);
});

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

async function search(query: string) {
    await userEvent.type(screen.getByPlaceholderText("Search e.g. CS2040S"), query);
    act(() => { vi.runAllTimers(); });  // run the debounce timer
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
  await search("CS20");
  expect(await screen.findByText("CS2040S")).toBeInTheDocument();
});

it("shows an error message when the search API fails", async () => {
  mockSearchModules.mockRejectedValue(new Error("Network error"));  // override default
  render(<ModuleSearchDropdown onAddModule={vi.fn()} addedModuleCodes={new Set()} />);
  await search("CS20");
  expect(await screen.findByText("Failed to search modules")).toBeInTheDocument();
});


// already added modules 
it("shows the 'Added ✓' badge for modules already in addedModuleCodes", async () => {
  render(
    <ModuleSearchDropdown
      onAddModule={vi.fn()}
      addedModuleCodes={new Set(["CS2040S"])}  // CS2040S is pre-added
    />
  );
  await search("CS20");
  expect(await screen.findByText("Added ✓")).toBeInTheDocument();
});


it("shows an error when clicking an already-added module", async () => {
  render(
    <ModuleSearchDropdown
      onAddModule={vi.fn()}
      addedModuleCodes={new Set(["CS2040S"])}
    />
  );
  await search("CS20");
  await userEvent.click(await screen.findByText("CS2040S"));  // click the list item
  expect(await screen.findByText("Module already added")).toBeInTheDocument();
});

//closing behaviour
it("closes the dropdown when clicking outside", async () => {
  render(<ModuleSearchDropdown onAddModule={vi.fn()} addedModuleCodes={new Set()} />);
  await search("CS20");
  expect(await screen.findByText("CS2040S")).toBeInTheDocument(); // dropdown is open
  await userEvent.click(document.body);                           // click outside
  expect(screen.queryByText("CS2040S")).not.toBeInTheDocument(); // now closed
});