import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { it, expect } from "vitest";
import { useConstraints } from "./useConstraints";
import type {
  Constraint,
  EarliestStartConstraint,
  FreeDaysCountConstraint,
} from "../types/constraints";

function useConstraintsWithState() {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  return useConstraints(constraints, setConstraints);
}

it("starts with an empty constraint list", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  expect(result.current.constraints).toHaveLength(0);
});

it("add() appends a soft constraint with default values", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  act(() => {
    result.current.add("earliest_start");
  });
  const [c] = result.current.constraints;
  expect(c.type).toBe("earliest_start");
  expect(c.kind).toBe("soft");
  expect(c.weight).toBe(3);
  expect((c as EarliestStartConstraint).time).toBe("0900");
});

it("add() accepts an explicit hard kind", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  act(() => {
    result.current.add("latest_end", "hard");
  });
  expect(result.current.constraints[0].kind).toBe("hard");
});

it("add() assigns a unique id to each constraint", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  act(() => {
    result.current.add("earliest_start");
    result.current.add("latest_end");
  });
  const ids = result.current.constraints.map((c) => c.id);
  expect(new Set(ids).size).toBe(2);
});

it("remove() deletes only the targeted constraint", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  act(() => {
    result.current.add("free_days_count");
    result.current.add("max_consecutive");
  });
  const id = result.current.constraints[0].id;
  act(() => {
    result.current.remove(id);
  });
  expect(result.current.constraints).toHaveLength(1);
  expect(result.current.constraints[0].type).toBe("max_consecutive");
});

it("update() patches the matching constraint and leaves others untouched", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  act(() => {
    result.current.add("free_days_count");
    result.current.add("max_consecutive");
  });
  const id = result.current.constraints[0].id;
  act(() => {
    result.current.update(id, { count: 4 });
  });
  expect((result.current.constraints[0] as FreeDaysCountConstraint).count).toBe(
    4,
  );
  expect(result.current.constraints[1].type).toBe("max_consecutive");
});

it("toggleKind() flips soft → hard then hard → soft", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  act(() => {
    result.current.add("max_consecutive");
  });
  const id = result.current.constraints[0].id;
  act(() => {
    result.current.toggleKind(id);
  });
  expect(result.current.constraints[0].kind).toBe("hard");
  act(() => {
    result.current.toggleKind(id);
  });
  expect(result.current.constraints[0].kind).toBe("soft");
});

it("toPayload() strips the id field from every constraint", () => {
  const { result } = renderHook(() => useConstraintsWithState());
  act(() => {
    result.current.add("max_consecutive");
  });
  const payload = result.current.toPayload();
  expect(payload).toHaveLength(1);
  expect(payload[0]).not.toHaveProperty("id");
  expect(payload[0]).toHaveProperty("type", "max_consecutive");
  expect(payload[0]).toHaveProperty("kind", "soft");
  expect(payload[0]).toHaveProperty("weight", 3);
});
