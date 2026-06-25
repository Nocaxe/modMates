import { useState, useRef, useEffect } from "react";
import type { ConstraintType } from "../../types/constraints";
import { useConstraints } from "../../hooks/useConstraints";
import { ConstraintRow } from "./ConstraintRow";

// Types the user can add; order determines menu order
const ADDABLE: { type: ConstraintType; label: string; description: string }[] =
  [
    {
      type: "earliest_start",
      label: "Earliest start",
      description: "No lessons before a given time",
    },
    {
      type: "latest_end",
      label: "Latest end",
      description: "No lessons after a given time",
    },
    {
      type: "free_days_count",
      label: "Free days",
      description: "Minimum number of lesson-free days",
    },
    {
      type: "specific_free_days",
      label: "Specific free days",
      description: "Keep chosen days completely free",
    },
    {
      type: "blocked_slot",
      label: "Blocked slot",
      description: "Block a recurring time window",
    },
    {
      type: "lunch_break",
      label: "Lunch break",
      description: "Reserve time for lunch",
    },
    {
      type: "max_consecutive",
      label: "Max consecutive",
      description: "Limit back-to-back lesson hours",
    },
  ];

interface Props {
  // Expose constraints upward so the parent can include them in the optimize call
  onChange?: (
    payload: ReturnType<ReturnType<typeof useConstraints>["toPayload"]>,
  ) => void;
}

export function ConstraintPanel({ onChange }: Props) {
  const { constraints, add, remove, update, toggleKind, toPayload } =
    useConstraints();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Notify parent whenever constraints change
  useEffect(() => {
    onChange?.(toPayload());
  }, [constraints, onChange, toPayload]);

  const activeTypes = new Set(constraints.map((c) => c.type));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Constraints</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Hard constraints must be met. Soft constraints are preferences with
            a priority weight. Click on the label to switch between hard/soft.
          </p>
        </div>

        {/* Add constraint dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {ADDABLE.filter(
                ({ type }) => type === "blocked_slot" || !activeTypes.has(type),
              ).map(({ type, label, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    add(type);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      {label}
                    </span>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {constraints.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">No constraints yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Add constraints to guide the optimizer.
          </p>
        </div>
      )}

      {/* Constraint list */}
      <div className="flex flex-col gap-3">
        {constraints.map((c) => (
          <ConstraintRow
            key={c.id}
            constraint={c}
            onUpdate={(patch) => update(c.id, patch)}
            onToggleKind={() => toggleKind(c.id)}
            onRemove={() => remove(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
