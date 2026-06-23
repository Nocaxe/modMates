import type { FreeDaysCountConstraint } from "../../../types/constraints";

interface Props {
  c: FreeDaysCountConstraint;
  onChange: (patch: Partial<FreeDaysCountConstraint>) => void;
}

export function FreeDaysCountConfig({ c, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span>At least</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ count: n })}
            className={`
              w-8 h-8 rounded-full text-sm font-medium transition-colors
              ${
                c.count === n
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            {n}
          </button>
        ))}
      </div>
      <span>free {c.count === 1 ? "day" : "days"}</span>
    </div>
  );
}
