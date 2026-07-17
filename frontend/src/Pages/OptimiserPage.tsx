import { useState, useEffect } from "react";
import type { Module, SelectionState } from "../components/Timetable";
import TimetableUI from "../components/Timetable";
import { BottomPanel } from "../components/BottomPanel";
import { SolutionPicker } from "../components/SolutionPicker";
import { GroupOverlapPanel } from "../components/GroupOverlapPanel";
import { getModuleDetail, moduleDetailToModule } from "../api/modules";
import {
  getTimetable,
  saveTimetable,
  type TimetableData,
} from "../api/timetable";
import { optimise, type RankedSolution, type GroupMember } from "../api/optimise";
import {
  listMyGroups,
  getOptimiserMembers,
  type Group,
} from "../api/groups";
import { useAuth } from "../contexts/AuthContext";

const LS_KEY = "modmates-timetable";

function loadFromLocalStorage(): TimetableData {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LS_KEY) ?? "null",
    ) as TimetableData | null;
    return {
      selection: parsed?.selection ?? {},
      locked: parsed?.locked ?? [],
      modules: parsed?.modules ?? [],
    };
  } catch {
    return { selection: {}, locked: [], modules: [] };
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

function restoreModules(codes: string[], onRestored: (mods: Module[]) => void) {
  if (codes.length === 0) return;
  Promise.all(codes.map((code) => getModuleDetail(code)))
    .then((details) => onRestored(details.map(moduleDetailToModule)))
    .catch(() => {});
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

  const [constraintPayload, setConstraintPayload] = useState<object[]>([]);
  const [solutions, setSolutions] = useState<RankedSolution[]>([]);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);
  const [groupMembers, setGroupMembers] = useState<GroupMember[] | null>(null);
  const [constraintError, setConstraintError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

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
        }
        restoreModules(data.modules, (restored) => {
          setModules(restored);
          setSelection((prev) => seedDefaults(restored, prev));
        });
      })
      .catch(() => {});
    listMyGroups(session.access_token).then(setGroups).catch(() => {});
  }, [session]);

  // Save to localStorage immediately, debounce API save for logged-in users
  useEffect(() => {
    const data: TimetableData = {
      selection,
      locked: [...locked],
      modules: modules.map((m) => m.code),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    if (!session) return;
    const timer = setTimeout(() => {
      saveTimetable(session.access_token, data).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [selection, locked, modules, session]);

  const hasGroupOverlap = (constraintPayload as Array<{ type?: string }>).some(
    (c) => c.type === "group_overlap",
  );
  const effectiveGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  async function handleOptimise() {
    let group_members: GroupMember[] | undefined;
    if (hasGroupOverlap && session && effectiveGroupId !== null) {
      group_members = await getOptimiserMembers(
        session.access_token,
        effectiveGroupId,
      );
    }

    const result = await optimise({
      modules,
      selection,
      locked: [...locked],
      constraints: constraintPayload,
      group_members,
    });

    if (result.solutions.length > 0 && result.solutions[0].score >= 0) {
      setConstraintError(null);
      setSolutions(result.solutions);
      setSelectedSolutionIndex(0);
      setSelection(result.solutions[0].selection);
      setGroupMembers(group_members ?? null);
    } else {
      setConstraintError(
        "No valid timetable found. Your hard constraints cannot all be satisfied. Try relaxing or removing some constraints.",
      );
    }
  }

  function handleSolutionSelect(index: number) {
    setSelectedSolutionIndex(index);
    setSelection(solutions[index].selection);
  }

  function handleAddModule(module: Module) {
    setModules((prev) => {
      if (prev.some((m) => m.code === module.code)) return prev;
      return [...prev, module];
    });
    setSelection((prev) => seedDefaults([module], prev));
    setSolutions([]);
    setSelectedSolutionIndex(0);
    setGroupMembers(null);
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
    setSolutions([]);
    setSelectedSolutionIndex(0);
    setGroupMembers(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <TimetableUI
        modules={modules}
        selection={selection}
        locked={locked}
        onSelectionChange={setSelection}
        onLockedChange={setLocked}
      />
      {hasGroupOverlap && (
        <div className="flex items-center gap-3 px-4 py-3 border border-gray-700 rounded-xl text-sm">
          <span className="text-gray-300 font-medium shrink-0">Group:</span>
          {!session ? (
            <span className="text-gray-400">Log in to use group overlap.</span>
          ) : groups.length === 0 ? (
            <span className="text-gray-400">
              Join a group first to use group overlap.
            </span>
          ) : (
            <select
              value={effectiveGroupId ?? ""}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-2 py-1 flex-1"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          void handleOptimise();
        }}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
      >
        Optimise
      </button>
      {constraintError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-950 border border-red-700 rounded-xl text-red-300 text-sm">
          <span>{constraintError}</span>
        </div>
      )}
      <SolutionPicker
        solutions={solutions}
        selectedIndex={selectedSolutionIndex}
        onSelect={handleSolutionSelect}
      />
      {groupMembers && groupMembers.length > 0 && (
        <GroupOverlapPanel
          modules={modules}
          userSelection={selection}
          groupMembers={groupMembers}
          rankIndex={selectedSolutionIndex}
        />
      )}
      <BottomPanel
        onConstraintsChange={setConstraintPayload}
        onAddModule={handleAddModule}
        onRemoveModule={handleRemoveModule}
        modules={modules}
      />
    </div>
  );
}
