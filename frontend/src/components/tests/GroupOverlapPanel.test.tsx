import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { GroupOverlapPanel } from "../GroupOverlapPanel";
import type { Module, SelectionState } from "../Timetable";
import type { GroupMember } from "../../api/optimise";

const CS2040S: Module = {
  code: "CS2040S",
  title: "Data Structures and Algorithms",
  lessons: {
    Lecture: {
      slots: [{ classNo: "1", day: "Tuesday", start: 600, end: 720, venue: "LT19" }],
    },
    Tutorial: {
      slots: [{ classNo: "01", day: "Thursday", start: 540, end: 600, venue: "COM1-0210" }],
    },
  },
};

const MA2001: Module = {
  code: "MA2001",
  title: "Linear Algebra I",
  lessons: {
    Lecture: {
      slots: [{ classNo: "1", day: "Monday", start: 480, end: 600, venue: "LT34" }],
    },
  },
};

const USER_SELECTION: SelectionState = {
  CS2040S: { Lecture: "1" }, // Tutorial deliberately left unselected
};

const MEMBERS: GroupMember[] = [
  { name: "Alice", ranked_selections: [{ CS2040S: { Lecture: "1" } }] },
  { name: "Bob", ranked_selections: [{ CS2040S: { Lecture: "2" } }] },
];

it("renders nothing when there are no group members", () => {
  const { container } = render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={[]}
      rankIndex={0}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("renders the group overlap heading and member names in the subtitle", () => {
  render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  expect(screen.getByText("Group overlap")).toBeInTheDocument();
  expect(
    screen.getByText(/Shared classes with Alice, Bob/),
  ).toBeInTheDocument();
});

it("renders the module code and title for a module with a selected lesson", () => {
  const { container } = render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  expect(container.textContent).toContain("CS2040S");
  expect(container.textContent).toContain("Data Structures and Algorithms");
});

it("shows the selected lesson type with the user's class number and formatted time", () => {
  render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  expect(screen.getByText("Lecture")).toBeInTheDocument();
  expect(screen.getByText("1 · Tue 10am–12pm")).toBeInTheDocument();
});

it("does not render a lesson type the user has not selected", () => {
  render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  expect(screen.queryByText("Tutorial")).not.toBeInTheDocument();
});

it("hides a module entirely when the user has no selection for any of its lessons", () => {
  const { container } = render(
    <GroupOverlapPanel
      modules={[CS2040S, MA2001]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  expect(container.textContent).not.toContain("MA2001");
});

it("marks a member as overlapping when their class matches the user's", () => {
  render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  const badge = screen.getByText("✓ Alice");
  expect(badge).toBeInTheDocument();
  expect(badge).toHaveAttribute("title", "Alice is in the same class");
});

it("marks a member as not overlapping when their class differs from the user's", () => {
  render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  const badge = screen.getByText("✗ Bob");
  expect(badge).toBeInTheDocument();
  expect(badge).toHaveAttribute("title", "Bob is in a different class");
});

it("clamps rankIndex to a member's last ranked selection when it exceeds the array length", () => {
  render(
    <GroupOverlapPanel
      modules={[CS2040S]}
      userSelection={USER_SELECTION}
      groupMembers={MEMBERS}
      rankIndex={5}
    />,
  );
  // Each member has only 1 ranked_selection, so rankIndex 5 should still
  // resolve to index 0 and produce the same overlap result as rankIndex 0.
  expect(screen.getByText("✓ Alice")).toBeInTheDocument();
  expect(screen.getByText("✗ Bob")).toBeInTheDocument();
});

it("deduplicates repeated slots at the same day and time when building the time string", () => {
  const moduleWithDuplicateSlots: Module = {
    code: "CS2040S",
    title: "Data Structures and Algorithms",
    lessons: {
      Lecture: {
        slots: [
          { classNo: "1", day: "Tuesday", start: 600, end: 720, venue: "LT19" },
          { classNo: "1", day: "Tuesday", start: 600, end: 720, venue: "LT19" },
        ],
      },
    },
  };
  render(
    <GroupOverlapPanel
      modules={[moduleWithDuplicateSlots]}
      userSelection={{ CS2040S: { Lecture: "1" } }}
      groupMembers={MEMBERS}
      rankIndex={0}
    />,
  );
  expect(screen.getByText("1 · Tue 10am–12pm")).toBeInTheDocument();
});
