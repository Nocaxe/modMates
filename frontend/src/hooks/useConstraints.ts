import { useState, useCallback } from "react";
import type {
  Constraint,
  ConstraintKind,
  ConstraintType,
  DistributiveOmit,
} from "../types/constraints";

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULTS: Record<
  ConstraintType,
  DistributiveOmit<Constraint, "id" | "kind" | "weight">
> = {
  earliest_start: { type: "earliest_start", time: "0900" },
  latest_end: { type: "latest_end", time: "1800" },
  free_days_count: { type: "free_days_count", count: 1 },
  specific_free_days: { type: "specific_free_days", days: [] },
  blocked_slot: {
    type: "blocked_slot",
    day: "Monday",
    startTime: "1400",
    endTime: "1600",
  },
  lunch_break: {
    type: "lunch_break",
    startTime: "1200",
    endTime: "1400",
    duration: 60,
  },
  max_consecutive: { type: "max_consecutive", hours: 3 },
};

export function useConstraints() {
  const [constraints, setConstraints] = useState<Constraint[]>([]);

  const add = useCallback(
    (type: ConstraintType, kind: ConstraintKind = "soft") => {
      const c = { ...DEFAULTS[type], id: uid(), kind, weight: 3 };
      setConstraints((prev) => [...prev, c]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const update = useCallback((id: string, patch: Partial<Constraint>) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? ({ ...c, ...patch } as Constraint) : c)),
    );
  }, []);

  const toggleKind = useCallback((id: string) => {
    setConstraints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, kind: c.kind === "hard" ? "soft" : "hard" } : c,
      ),
    );
  }, []);

  // Remove uid for the backend
  const toPayload = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    () => constraints.map(({ id: _id, ...rest }) => rest),
    [constraints],
  );

  return { constraints, add, remove, update, toggleKind, toPayload };
}
