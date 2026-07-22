import type { RankedSolution } from "../api/optimise";

interface Props {
  solutions: RankedSolution[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function scoreBadgeClass(score: number): string {
  if (score >= 0.8) return "bg-green-100 text-green-800";
  if (score >= 0.5) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-700";
}

export function SolutionPicker({ solutions, selectedIndex, onSelect }: Props) {
  if (solutions.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-400">
        {solutions.length} ranked timetables found — select one to apply it.
      </p>
      <div className="flex gap-2 flex-wrap">
        {solutions.map((sol, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`
              flex flex-col items-center px-4 py-2 rounded-xl border-2 transition-colors text-sm font-medium
              ${
                i === selectedIndex
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <span>#{i + 1}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 font-semibold ${scoreBadgeClass(sol.score)}`}
            >
              {Math.round(sol.score * 100)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
