import type { Constraint } from "../../types/constraints";
import { EarliestStartConfig } from "./configs/EarliestStartConfig";
import { LatestEndConfig } from "./configs/LatestEndConfig";
import { FreeDaysCountConfig } from "./configs/FreeDaysCountConfig";
import { SpecificFreeDaysConfig } from "./configs/SpecificFreeDaysConfig";
import { BlockedSlotConfig } from "./configs/BlockedSlotConfig";
import { LunchBreakConfig } from "./configs/LunchBreakConfig";
import { MaxConsecutiveConfig } from "./configs/MaxConsecutiveConfig";
import { GroupOverlapConfig } from "./configs/GroupOverlapConfig";
import { WeightSlider } from "./WeightSlider";

// Labels for each type
const META: Record<Constraint["type"], { label: string }> = {
  earliest_start: { label: "Earliest start" },
  latest_end: { label: "Latest end" },
  free_days_count: { label: "Free days" },
  specific_free_days: { label: "Specific free days" },
  blocked_slot: { label: "Blocked slot" },
  lunch_break: { label: "Lunch break" },
  max_consecutive: { label: "Max consecutive" },
  group_overlap: { label: "Group overlap" },
};

interface Props {
  constraint: Constraint;
  onUpdate: (patch: Partial<Constraint>) => void;
  onToggleKind: () => void;
  onRemove: () => void;
}

export function ConstraintRow({
  constraint,
  onUpdate,
  onToggleKind,
  onRemove,
}: Props) {
  const { label } = META[constraint.type];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      {/* Header row: icon + label | hard/soft toggle | remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Hard / Soft toggle pill — hidden for group_overlap (always soft) */}
          {constraint.type !== "group_overlap" && (
            <button
              type="button"
              onClick={onToggleKind}
              title={
                constraint.kind === "hard"
                  ? "Hard: optimizer must satisfy this"
                  : "Soft: optimizer tries but may skip this"
              }
              className={`
                px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors cursor-pointer
                ${
                  constraint.kind === "hard"
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }
              `}
            >
              {constraint.kind === "hard"
                ? "Constraint type: Hard"
                : "Constraint type: Soft"}
            </button>
          )}
          {/* Remove */}
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
            title="Remove constraint"
          >
            ×
          </button>
        </div>
      </div>

      {/* Config area */}
      <div className="pl-6">
        {constraint.type === "earliest_start" && (
          <EarliestStartConfig c={constraint} onChange={onUpdate} />
        )}
        {constraint.type === "latest_end" && (
          <LatestEndConfig c={constraint} onChange={onUpdate} />
        )}
        {constraint.type === "free_days_count" && (
          <FreeDaysCountConfig c={constraint} onChange={onUpdate} />
        )}
        {constraint.type === "specific_free_days" && (
          <SpecificFreeDaysConfig c={constraint} onChange={onUpdate} />
        )}
        {constraint.type === "blocked_slot" && (
          <BlockedSlotConfig c={constraint} onChange={onUpdate} />
        )}
        {constraint.type === "lunch_break" && (
          <LunchBreakConfig c={constraint} onChange={onUpdate} />
        )}
        {constraint.type === "max_consecutive" && (
          <MaxConsecutiveConfig c={constraint} onChange={onUpdate} />
        )}
        {constraint.type === "group_overlap" && (
          <GroupOverlapConfig c={constraint} />
        )}
      </div>

      {/* Weight Slider */}
      {constraint.kind === "soft" && (
        <div className="pl-6 transition-all duration-150">
          <WeightSlider
            value={constraint.weight}
            onChange={(w) => onUpdate({ weight: w })}
          />
        </div>
      )}
    </div>
  );
}
