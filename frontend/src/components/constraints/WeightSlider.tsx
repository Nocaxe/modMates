const STEPS = [1, 2, 3, 4, 5] as const;

const ANCHOR_LABELS: Partial<Record<number, string>> = {
  1: "Low",
  3: "Mid",
  5: "High",
};

interface Props {
  value: number;
  onChange: (w: number) => void;
}

export function WeightSlider({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
      <span className="text-xs text-gray-400 shrink-0 w-12">Priority</span>

      <div className="flex flex-col gap-1 flex-1">
        {/* Track + dots */}
        <div className="relative flex items-center justify-between">
          {/* Background track line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-200" />

          {/* Filled portion of the track */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-px bg-blue-400 transition-all duration-150"
            style={{ width: `${((value - 1) / 4) * 100}%` }}
          />

          {/* Clickable dots */}
          {STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              className={`
                relative z-10 w-4 h-4 rounded-full border-2 transition-all duration-150
                ${
                  step <= value
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white border-gray-300 hover:border-blue-400"
                }
                ${step === value ? "scale-125" : ""}
              `}
            />
          ))}
        </div>

        {/* Anchor labels below the dots */}
        <div className="flex justify-between px-0">
          {STEPS.map((step) => (
            <span
              key={step}
              className="text-xs w-4 text-center transition-colors duration-150 text-blue-500 font-medium"
            >
              {ANCHOR_LABELS[step] ?? ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
