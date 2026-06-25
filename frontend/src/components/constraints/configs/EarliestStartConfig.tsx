import type { EarliestStartConstraint } from "../../../types/constraints";
import { TimeSelect } from "../TimeSelect";

interface Props {
  c: EarliestStartConstraint;
  onChange: (patch: Partial<EarliestStartConstraint>) => void;
}

export function EarliestStartConfig({ c, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>No lessons before</span>
      <TimeSelect
        value={c.time}
        onChange={(time) => onChange({ time })}
        max="1200"
      />
    </div>
  );
}
