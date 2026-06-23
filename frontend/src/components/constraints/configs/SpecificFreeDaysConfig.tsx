import type {
  SpecificFreeDaysConstraint,
  Day,
} from "../../../types/constraints";
import { DayToggle } from "../DayToggle";

interface Props {
  c: SpecificFreeDaysConstraint;
  onChange: (patch: Partial<SpecificFreeDaysConstraint>) => void;
}

export function SpecificFreeDaysConfig({ c, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-600">Keep these days free</span>
      <DayToggle
        selected={c.days}
        onChange={(days: Day[]) => onChange({ days })}
      />
      {c.days.length === 0 && (
        <p className="text-xs text-amber-500">Select at least one day.</p>
      )}
    </div>
  );
}
