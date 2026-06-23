import type { MaxConsecutiveConstraint } from "../../../types/constraints";

interface Props {
  c: MaxConsecutiveConstraint;
  onChange: (patch: Partial<MaxConsecutiveConstraint>) => void;
}

export function MaxConsecutiveConfig({ c, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span>Max</span>
      <div className="flex gap-1">
        {[2, 3, 4, 5, 6].map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onChange({ hours: h })}
            className={`
              w-8 h-8 rounded-full text-sm font-medium transition-colors
              ${
                c.hours === h
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            {h}
          </button>
        ))}
      </div>
      <span>consecutive hours</span>
    </div>
  );
}
