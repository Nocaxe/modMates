import type { Day } from "../../types/constraints";

const DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SHORT: Record<Day, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

interface Props {
  selected: Day[];
  onChange: (days: Day[]) => void;
  single?: boolean; // if true, only one day can be selected at a time
}

export function DayToggle({ selected, onChange, single }: Props) {
  const toggle = (day: Day) => {
    if (single) {
      onChange([day]);
      return;
    }
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day];
    onChange(next);
  };

  return (
    <div className="flex gap-1">
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          className={`
            w-8 h-8 rounded-full text-xs font-medium transition-colors
            ${
              selected.includes(day)
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }
          `}
        >
          {SHORT[day]}
        </button>
      ))}
    </div>
  );
}
