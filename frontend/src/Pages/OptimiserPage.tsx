import { useState, useEffect } from "react";
import type { Module, SelectionState } from "../components/Timetable";
import TimetableUI from "../components/Timetable";
import { BottomPanel } from "../components/BottomPanel";
import { SolutionPicker } from "../components/SolutionPicker";
import { restoreModules } from "../utils/moduleRestore";
import {
  getTimetable,
  saveTimetable,
  type TimetableData,
} from "../api/timetable";
import { optimise, type RankedSolution} from "../api/optimise"
import { useAuth } from "../contexts/AuthContext";
import type { Constraint } from "../types/constraints";

const LS_KEY = "modmates-timetable";

function loadFromLocalStorage(): TimetableData {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LS_KEY) ?? "null",
    ) as TimetableData | null;
    return {
      selection: parsed?.selection ?? {},
      locked: parsed?.locked ?? [],
      skipped: parsed?.skipped ?? [],
      modules: parsed?.modules ?? [],
      constraints: parsed?.constraints ?? [],
    };
  } catch {
    return {
      selection: {},
      locked: [],
      skipped: [],
      modules: [],
      constraints: [],
    };
  }
}

function seedDefaults(
  mods: Module[],
  selection: SelectionState,
): SelectionState {
  const next = { ...selection };
  let changed = false;
  mods.forEach((mod) => {
    if (!next[mod.code]) {
      next[mod.code] = {};
      Object.entries(mod.lessons).forEach(([lessonType, data]) => {
        next[mod.code][lessonType] = data.slots[0].classNo;
      });
      changed = true;
    }
  });
  return changed ? next : selection;
}



export default function OptimiserPage() {
  const { session } = useAuth();

  const [modules, setModules] = useState<Module[]>([]);
  const [selection, setSelection] = useState<SelectionState>(
    () => loadFromLocalStorage().selection,
  );
  const [locked, setLocked] = useState<Set<string>>(
    () => new Set(loadFromLocalStorage().locked),
  );
  const [skipped, setSkipped] = useState<Set<string>>(
    () => new Set(loadFromLocalStorage().skipped),
  );
  const [constraints, setConstraints] = useState<Constraint[]>(
    () => loadFromLocalStorage().constraints,
  );

  // Solo optimisation results
  const [solutions, setSolutions] = useState<RankedSolution[]>([]);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);
  const [constraintError, setConstraintError] = useState<string | null>(null);
  const [isOptimising, setIsOptimising] = useState(false);
 
  // On mount: restore from localStorage immediately, then overwrite with API data if logged in
  useEffect(() => {
    const local = loadFromLocalStorage();

    restoreModules(local.modules, (restored) => {
      setModules(restored);
      setSelection((prev) => seedDefaults(restored, prev));
    });

    if (!session) return;
    getTimetable(session.access_token)
      .then((data: TimetableData) => {
        if (Object.keys(data.selection).length > 0) {
          setSelection(data.selection);
          setLocked(new Set(data.locked));
          setSkipped(new Set<string>(data.skipped ?? []));
          setConstraints(data.constraints ?? []);
        }
        restoreModules(data.modules, (restored) => {
          setModules(restored);
          setSelection((prev) => seedDefaults(restored, prev));
        });
      })
      .catch(() => {});
  }, [session]);

  // Save to localStorage immediately, debounce API save for logged-in users
  useEffect(() => {
    const data: TimetableData = {
      selection,
      locked: [...locked],
      skipped: [...skipped],
      modules: modules.map((m) => m.code),
      constraints,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    if (!session) return;
    const timer = setTimeout(() => {
      saveTimetable(session.access_token, data).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [selection, locked, skipped, modules, constraints, session]);

  async function handleOptimise() {
    setConstraintError(null);
    setIsOptimising(true);
    try {
      const result = await optimise({
        modules,
        selection,
        locked: [...locked],
        skipped: [...skipped],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        constraints: constraints.map(({ id: _id, ...rest }) => rest),
      });

      if (result.solutions.length > 0 && result.solutions[0].score >= 0) {
        setSolutions(result.solutions);
        setSelectedSolutionIndex(0);
        setSelection(result.solutions[0].selection);
      } else {
        setConstraintError(
          "No valid timetable found. Your hard constraints cannot all be satisfied. Try relaxing or removing some constraints.",
        );
      }
    } finally {
      setIsOptimising(false);
    }
  }

  function handleSolutionSelect(index: number) {
    setSelectedSolutionIndex(index);
    setSelection(solutions[index].selection);
  }

  function clearResults() {
    setSolutions([]);
    setSelectedSolutionIndex(0);
  }

  function handleAddModule(module: Module) {
    setModules((prev) => {
      if (prev.some((m) => m.code === module.code)) return prev;
      return [...prev, module];
    });
    setSelection((prev) => seedDefaults([module], prev));
    clearResults();
  }

  function handleRemoveModule(moduleCode: string) {
    setModules((prev) => prev.filter((m) => m.code !== moduleCode));
    setSelection((prev) => {
      const next = { ...prev };
      delete next[moduleCode];
      return next;
    });
    setLocked((prev) => {
      const next = new Set(prev);
      [...next].forEach((key) => {
        if (key.startsWith(`${moduleCode}|`)) next.delete(key);
      });
      return next;
    });
    setSkipped((prev) => {
      const next = new Set(prev);
      [...next].forEach((key) => {
        if (key.startsWith(`${moduleCode}|`)) next.delete(key);
      });
      return next;
    });
    clearResults();
  }

  return (
    <div className="flex flex-col gap-4">
      <TimetableUI
        modules={modules}
        selection={selection}
        locked={locked}
        skipped={skipped}
        onSelectionChange={setSelection}
      />
      <button
        type="button"
        onClick={() => {
          void handleOptimise();
        }}
        disabled={isOptimising}
        className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isOptimising && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {isOptimising ? "Optimising..." : "Optimise"}
      </button>
      {constraintError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-950 border border-red-700 rounded-xl text-red-300 text-sm">
          <span>{constraintError}</span>
        </div>
      )}
      <SolutionPicker
        solutions = {solutions}
        selectedIndex={selectedSolutionIndex}
        onSelect={handleSolutionSelect}
      />
      <BottomPanel
        constraints={constraints}
        onConstraintsChange={setConstraints}
        onAddModule={handleAddModule}
        onRemoveModule={handleRemoveModule}
        modules={modules}
        locked={locked}
        onLockedChange={setLocked}
        skipped={skipped}
        onSkippedChange={setSkipped}
      />
    </div>
  );
}
