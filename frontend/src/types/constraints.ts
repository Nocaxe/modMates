export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export type ConstraintKind = "hard" | "soft";

export interface BaseConstraint {
  id: string;
  kind: ConstraintKind;
  weight: number;
}

export interface EarliestStartConstraint extends BaseConstraint {
  type: "earliest_start";
  time: string;
}

export interface LatestEndConstraint extends BaseConstraint {
  type: "latest_end";
  time: string;
}

export interface FreeDaysCountConstraint extends BaseConstraint {
  type: "free_days_count";
  count: number;
}

export interface SpecificFreeDaysConstraint extends BaseConstraint {
  type: "specific_free_days";
  days: Day[];
}

export interface BlockedSlotConstraint extends BaseConstraint {
  type: "blocked_slot";
  day: Day;
  startTime: string;
  endTime: string;
}

export interface LunchBreakConstraint extends BaseConstraint {
  type: "lunch_break";
  startTime: string;
  endTime: string;
  duration: number;
}

export interface MaxConsecutiveConstraint extends BaseConstraint {
  type: "max_consecutive";
  hours: number;
}

export interface GroupOverlapConstraint extends BaseConstraint {
  type: "group_overlap";
}

export type Constraint =
  | EarliestStartConstraint
  | LatestEndConstraint
  | FreeDaysCountConstraint
  | SpecificFreeDaysConstraint
  | BlockedSlotConstraint
  | LunchBreakConstraint
  | MaxConsecutiveConstraint
  | GroupOverlapConstraint;

export type ConstraintType = Constraint["type"];

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
