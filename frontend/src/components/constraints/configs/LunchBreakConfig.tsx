import type { LunchBreakConstraint } from "../../../types/constraints";
import { TimeSelect } from "../TimeSelect";

interface Props {
  c: LunchBreakConstraint;
  onChange: (patch: Partial<LunchBreakConstraint>) => void;
}

const DURATIONS = [30, 60, 90, 120] as const;

export function LunchBreakConfig({ c, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>Free window</span>
        <TimeSelect
          value={c.startTime}
          onChange={(startTime) => onChange({ startTime })}
          max={c.endTime}
        />
        <span>–</span>
        <TimeSelect
          value={c.endTime}
          onChange={(endTime) => onChange({ endTime })}
          min={c.startTime}
        />
      </div>
      <div className="flex items-center gap-2">
        <span>Min break length</span>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ duration: d })}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${
                  c.duration === d
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
