import { useState, useEffect } from "react";
import type { Module, SelectionState } from "../components/Timetable";
import TimetableUI from "../components/Timetable";
import { BottomPanel } from "../components/BottomPanel";
import { getModuleDetail, moduleDetailToModule } from "../api/modules";
import {
  getTimetable,
  saveTimetable,
  type TimetableData,
} from "../api/timetable";
import { useAuth } from "../contexts/AuthContext";

const LS_KEY = "modmates-timetable";

function loadFromLocalStorage(): TimetableData {
  try {
    return (
      (JSON.parse(localStorage.getItem(LS_KEY) ?? "null") as TimetableData) ?? {
        selection: {},
        locked: [],
        modules: [],
      }
    );
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_constraintPayload, setConstraintPayload] = useState<object[]>([]);

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

  function handleAddModule(module: Module) {
    setModules((prev) => {
      if (prev.some((m) => m.code === module.code)) return prev;
      return [...prev, module];
    });
    setSelection((prev) => seedDefaults([module], prev));
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
      {/* <button onClick={handleOptimise} className="mt-4 w-full bg-white">
          Optimise
        </button> */}
      <BottomPanel
        onConstraintsChange={setConstraintPayload}
        onAddModule={handleAddModule}
        onRemoveModule={handleRemoveModule}
        modules={modules}
      />
    </div>
  );
}
