import { it, expect } from "vitest";
import { getDummyGroupMembers } from "../dummyGroupMembers";
import type { Module, SelectionState } from "../../components/Timetable";

const CS2040S: Module = {
  code: "CS2040S",
  title: "Data Structures and Algorithms",
  lessons: {
    Tutorial: {
      slots: [
        { classNo: "01", day: "Monday", start: 600, end: 660, venue: "A" },
        { classNo: "02", day: "Monday", start: 660, end: 720, venue: "B" },
        { classNo: "03", day: "Tuesday", start: 600, end: 660, venue: "C" },
      ],
    },
  },
};

it("returns an Alice and a Bob demo member, each with a single ranked selection", () => {
  const members = getDummyGroupMembers([CS2040S], {});
  expect(members).toHaveLength(2);
  expect(members[0].name).toBe("Alice (demo)");
  expect(members[1].name).toBe("Bob (demo)");
  expect(members[0].ranked_selections).toHaveLength(1);
  expect(members[1].ranked_selections).toHaveLength(1);
});

it("gives Bob the first classNo for every lesson type regardless of the user's selection", () => {
  const userSelection: SelectionState = { CS2040S: { Tutorial: "03" } };
  const [, bob] = getDummyGroupMembers([CS2040S], userSelection);
  expect(bob.ranked_selections[0].CS2040S.Tutorial).toBe("01");
});

it("gives Alice the class after the user's current selection", () => {
  const userSelection: SelectionState = { CS2040S: { Tutorial: "02" } };
  const [alice] = getDummyGroupMembers([CS2040S], userSelection);
  expect(alice.ranked_selections[0].CS2040S.Tutorial).toBe("03");
});

it("wraps Alice's selection back to the first classNo when the user has the last one", () => {
  const userSelection: SelectionState = { CS2040S: { Tutorial: "03" } };
  const [alice] = getDummyGroupMembers([CS2040S], userSelection);
  expect(alice.ranked_selections[0].CS2040S.Tutorial).toBe("01");
});

it("defaults to the first classNo when the user has no selection, giving Alice the second", () => {
  const [alice, bob] = getDummyGroupMembers([CS2040S], {});
  expect(bob.ranked_selections[0].CS2040S.Tutorial).toBe("01");
  expect(alice.ranked_selections[0].CS2040S.Tutorial).toBe("02");
});

it("skips a lesson type that has no available slots", () => {
  const moduleWithEmptyLesson: Module = {
    code: "CS2040S",
    title: "DSA",
    lessons: { Lab: { slots: [] } },
  };
  const [alice, bob] = getDummyGroupMembers([moduleWithEmptyLesson], {});
  expect(alice.ranked_selections[0].CS2040S).toEqual({});
  expect(bob.ranked_selections[0].CS2040S).toEqual({});
});

it("computes selections independently for each module", () => {
  const MA2001: Module = {
    code: "MA2001",
    title: "Linear Algebra I",
    lessons: {
      Lecture: {
        slots: [
          { classNo: "1", day: "Monday", start: 480, end: 600, venue: "LT34" },
          { classNo: "2", day: "Tuesday", start: 480, end: 600, venue: "LT34" },
        ],
      },
    },
  };
  const userSelection: SelectionState = {
    CS2040S: { Tutorial: "03" },
    MA2001: { Lecture: "1" },
  };
  const [alice] = getDummyGroupMembers([CS2040S, MA2001], userSelection);
  expect(alice.ranked_selections[0].CS2040S.Tutorial).toBe("01");
  expect(alice.ranked_selections[0].MA2001.Lecture).toBe("2");
});

it("dedupes classNos derived from multiple slots of the same class", () => {
  const moduleWithDuplicateSlots: Module = {
    code: "CS2040S",
    title: "DSA",
    lessons: {
      Tutorial: {
        slots: [
          { classNo: "01", day: "Monday", start: 600, end: 660, venue: "A" },
          { classNo: "01", day: "Wednesday", start: 600, end: 660, venue: "A" },
          { classNo: "02", day: "Tuesday", start: 600, end: 660, venue: "C" },
        ],
      },
    },
  };
  const userSelection: SelectionState = { CS2040S: { Tutorial: "01" } };
  const [alice] = getDummyGroupMembers([moduleWithDuplicateSlots], userSelection);
  expect(alice.ranked_selections[0].CS2040S.Tutorial).toBe("02");
});
