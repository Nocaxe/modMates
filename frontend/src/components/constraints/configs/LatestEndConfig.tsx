import type { LatestEndConstraint } from "../../../types/constraints";
import { TimeSelect } from "../TimeSelect";

interface Props {
  c: LatestEndConstraint;
  onChange: (patch: Partial<LatestEndConstraint>) => void;
}

export function LatestEndConfig({ c, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>No lessons after</span>
      <TimeSelect
        value={c.time}
        onChange={(time) => onChange({ time })}
        min="1200"
      />
    </div>
  );
}
