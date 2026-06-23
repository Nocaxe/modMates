import type { BlockedSlotConstraint, Day } from "../../../types/constraints";
import { DayToggle } from "../DayToggle";
import { TimeSelect } from "../TimeSelect";

interface Props {
  c: BlockedSlotConstraint;
  onChange: (patch: Partial<BlockedSlotConstraint>) => void;
}

export function BlockedSlotConfig({ c, onChange }: Props) {
  const valid = c.endTime > c.startTime;
  return (
    <div className="flex flex-col gap-2">
      <DayToggle
        selected={[c.day]}
        onChange={([day]: Day[]) => onChange({ day })}
        single
      />
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <TimeSelect
          value={c.startTime}
          onChange={(startTime) => onChange({ startTime })}
          max={c.endTime}
        />
        <span>to</span>
        <TimeSelect
          value={c.endTime}
          onChange={(endTime) => onChange({ endTime })}
          min={c.startTime}
        />
      </div>
      {!valid && (
        <p className="text-xs text-red-500">
          End time must be after start time.
        </p>
      )}
    </div>
  );
}
