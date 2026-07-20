import { useState, useEffect } from "react";
import type { Module, SelectionState } from "../components/Timetable";
import TimetableUI from "../components/Timetable";
import { BottomPanel } from "../components/BottomPanel";
import { SolutionPicker } from "../components/SolutionPicker";
import { GroupOverlapPanel } from "../components/GroupOverlapPanel";
import { JointOptimisePanel } from "../components/JointOptimisePanel";
import { getModuleDetail, moduleDetailToModule } from "../api/modules";
import {
  getTimetable,
  saveTimetable,
  type TimetableData,
} from "../api/timetable";
import {
  optimise,
  type RankedSolution,
  type GroupMember,
} from "../api/optimise";
import {
  listMyGroups,
  getOptimiserMembers,
  jointOptimise,
  batchSaveTimetables,
  type Group,
  type JointMemberResult,
} from "../api/groups";
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
  const [skipped, setSkipped] = useState<Set<string>>(
    () => new Set(loadFromLocalStorage().skipped),
  );
  const [constraints, setConstraints] = useState<Constraint[]>(
    () => loadFromLocalStorage().constraints,
  );

  // Solo optimisation results
  const [solutions, setSolutions] = useState<RankedSolution[]>([]);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);
  const [groupMembers, setGroupMembers] = useState<GroupMember[] | null>(null);

  // Joint optimisation results
  const [jointSolutions, setJointSolutions] = useState<
    JointMemberResult[][] | null
  >(null);
  const [selectedJointIndex, setSelectedJointIndex] = useState(0);

  // Live group members — fetched immediately when group_overlap constraint is active
  const [liveGroupMembers, setLiveGroupMembers] = useState<
    GroupMember[] | null
  >(null);

  const [constraintError, setConstraintError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Fetch live group members whenever the group_overlap constraint is active
  useEffect(() => {
    const active = constraints.some((c) => c.type === "group_overlap");
    const groupId = selectedGroupId ?? groups[0]?.id ?? null;
    if (!active || !session || groupId === null) return;
    let cancelled = false;
    getOptimiserMembers(session.access_token, groupId)
      .then((members) => {
        if (!cancelled) setLiveGroupMembers(members);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [constraints, selectedGroupId, groups, session]);

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
    listMyGroups(session.access_token)
      .then(setGroups)
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

  const hasGroupOverlap = constraints.some((c) => c.type === "group_overlap");
  const effectiveGroupId = selectedGroupId ?? groups[0]?.id ?? null;
  const isJointMode =
    hasGroupOverlap &&
    session !== null &&
    effectiveGroupId !== null &&
    groups.length > 0;

  async function handleOptimise() {
    setConstraintError(null);

    if (isJointMode) {
      if (!session || effectiveGroupId === null) return;
      // Joint optimisation: solve all group members simultaneously
      const myId = session.user.id;
      try {
        const result = await jointOptimise(
          session.access_token,
          effectiveGroupId,
        );
        const sols = result.solutions.map((s) => s.members);

        if (sols.length === 0) {
          setConstraintError(
            "No valid joint timetable found. Hard constraints cannot all be satisfied. Try relaxing some constraints.",
          );
          return;
        }

        // Apply first solution locally so timetable updates immediately
        const first = sols[0];
        const myFirst = first.find((m) => m.user_id === myId);
        if (myFirst) setSelection(myFirst.proposed_selection);

        // Populate groupMembers for GroupOverlapPanel using other members' proposed selections
        const others = first.filter((m) => m.user_id !== myId);
        const gm: GroupMember[] = others.map((other) => ({
          name: other.email,
          ranked_selections: sols.map(
            (sol) =>
              sol.find((m) => m.user_id === other.user_id)
                ?.proposed_selection ?? {},
          ),
        }));
        setGroupMembers(gm.length > 0 ? gm : null);

        setSolutions([]);
        setSelectedSolutionIndex(0);
        setJointSolutions(sols);
        setSelectedJointIndex(0);
      } catch (e) {
        setConstraintError(
          e instanceof Error ? e.message : "Joint optimisation failed.",
        );
      }
      return;
    }

    // Solo optimisation (existing logic)
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
      skipped: [...skipped],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constraints: constraints.map(({ id: _id, ...rest }) => rest),
      group_members,
    });

    if (result.solutions.length > 0 && result.solutions[0].score >= 0) {
      setSolutions(result.solutions);
      setSelectedSolutionIndex(0);
      setSelection(result.solutions[0].selection);
      setGroupMembers(group_members ?? null);
      setJointSolutions(null);
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

  function handleJointSolutionSelect(index: number) {
    setSelectedJointIndex(index);
    if (!jointSolutions || !session) return;
    const myId = session.user.id;
    const myResult = jointSolutions[index].find((m) => m.user_id === myId);
    if (myResult) setSelection(myResult.proposed_selection);
  }

  async function handleApplyJoint() {
    if (!session || effectiveGroupId === null || !jointSolutions) return;
    const chosen = jointSolutions[selectedJointIndex];
    try {
      await batchSaveTimetables(
        session.access_token,
        effectiveGroupId,
        chosen.map((m) => ({
          user_id: m.user_id,
          selection: m.proposed_selection,
        })),
      );
      // Keep groupMembers showing overlap, but rebuild so ranked_selections points to just the applied one
      const myId = session.user.id;
      const others = chosen.filter((m) => m.user_id !== myId);
      setGroupMembers(
        others.length > 0
          ? others.map((o) => ({
              name: o.email,
              ranked_selections: [o.proposed_selection],
            }))
          : null,
      );
      setSelectedSolutionIndex(0);
    } catch (e) {
      setConstraintError(
        e instanceof Error ? e.message : "Failed to apply joint timetable.",
      );
    }
    setJointSolutions(null);
    setSelectedJointIndex(0);
  }

  function clearResults() {
    setSolutions([]);
    setSelectedSolutionIndex(0);
    setJointSolutions(null);
    setSelectedJointIndex(0);
    setGroupMembers(null);
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

  // Derive active group members and rank index for GroupOverlapPanel
  const activeGroupMembers = groupMembers ?? liveGroupMembers;
  const overlapRankIndex = groupMembers
    ? jointSolutions
      ? selectedJointIndex
      : selectedSolutionIndex
    : 0;

  // Map joint solutions to RankedSolution shape for SolutionPicker reuse
  const jointSolutionsPicked: RankedSolution[] | null = jointSolutions
    ? jointSolutions.map((sol) => {
        const myId = session?.user.id;
        const mySel =
          sol.find((m) => m.user_id === myId)?.proposed_selection ?? {};
        const avgScore = sol.reduce((sum, m) => sum + m.score, 0) / sol.length;
        return { selection: mySel, score: avgScore };
      })
    : null;

  return (
    <div className="flex flex-col gap-4">
      <TimetableUI
        modules={modules}
        selection={selection}
        locked={locked}
        skipped={skipped}
        onSelectionChange={setSelection}
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
        className={`w-full py-3 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm ${
          isJointMode
            ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
            : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
        }`}
      >
        {isJointMode ? "Optimise for Group" : "Optimise"}
      </button>
      {constraintError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-950 border border-red-700 rounded-xl text-red-300 text-sm">
          <span>{constraintError}</span>
        </div>
      )}
      {/* Solution picker — handles both solo and joint modes */}
      {jointSolutionsPicked ? (
        <SolutionPicker
          solutions={jointSolutionsPicked}
          selectedIndex={selectedJointIndex}
          onSelect={handleJointSolutionSelect}
        />
      ) : (
        <SolutionPicker
          solutions={solutions}
          selectedIndex={selectedSolutionIndex}
          onSelect={handleSolutionSelect}
        />
      )}
      {/* Joint diff + apply panel */}
      {jointSolutions && effectiveGroupId !== null && (
        <JointOptimisePanel
          selectedSolution={jointSolutions[selectedJointIndex]}
          groupName={groups.find((g) => g.id === effectiveGroupId)?.name ?? ""}
          onApply={() => {
            void handleApplyJoint();
          }}
          onDismiss={() => {
            setJointSolutions(null);
            setSelectedJointIndex(0);
            setGroupMembers(null);
          }}
        />
      )}
      {/* Group overlap panel — shows live overlap immediately when constraint is active,
          and switches to optimised selections after running the optimiser */}
      {hasGroupOverlap && activeGroupMembers && activeGroupMembers.length > 0 && (
        <GroupOverlapPanel
          modules={modules}
          userSelection={selection}
          groupMembers={activeGroupMembers}
          rankIndex={overlapRankIndex}
        />
      )}
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
