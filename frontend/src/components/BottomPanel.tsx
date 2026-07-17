import { useState } from "react";
import { ConstraintPanel } from "./constraints/ConstraintPanel";
import { ModuleSearchDropdown } from "./ModuleSearchDropdown";
import type { Module } from "./Timetable";
import { LockIcon } from "./Timetable";
import type { Constraint } from "../types/constraints";

type Tab = "modules" | "constraints";

const TABS: { id: Tab; label: string }[] = [
  { id: "modules", label: "Modules" },
  { id: "constraints", label: "Constraints" },
];

function slotKey(code: string, lessonType: string) {
  return `${code}|${lessonType}`;
}

function AttendingIcon({ attending }: { attending: boolean }) {
  return attending ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
  );
}

interface Props {
  constraints: Constraint[];
  onConstraintsChange: React.Dispatch<React.SetStateAction<Constraint[]>>;
  onAddModule: (module: Module) => void;
  onRemoveModule: (moduleCode: string) => void;
  modules: Module[];
  locked: Set<string>;
  onLockedChange: (l: Set<string>) => void;
  skipped: Set<string>;
  onSkippedChange: (s: Set<string>) => void;
}

export function BottomPanel({
  constraints,
  onConstraintsChange,
  onAddModule,
  onRemoveModule,
  modules,
  locked,
  onLockedChange,
  skipped,
  onSkippedChange,
}: Props) {
  const [active, setActive] = useState<Tab>("modules");
  const addedModuleCodes = new Set(modules.map((m) => m.code));

  function toggleLocked(code: string, lessonType: string) {
    const key = slotKey(code, lessonType);
    const next = new Set(locked);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onLockedChange(next);
  }

  function toggleSkipped(code: string, lessonType: string) {
    const key = slotKey(code, lessonType);
    const nextSkipped = new Set(skipped);
    if (nextSkipped.has(key)) {
      nextSkipped.delete(key);
    } else {
      nextSkipped.add(key);
      // Remove lock when marking as not attending
      const nextLocked = new Set(locked);
      nextLocked.delete(key);
      onLockedChange(nextLocked);
    }
    onSkippedChange(nextSkipped);
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-gray shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`
              px-5 py-3 text-sm font-medium transition-colors relative
              ${
                active === tab.id
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 min-h-96 overflow-y-auto">
        <div className={active === "modules" ? "" : "hidden"}>
          {modules.length > 0 && (
            <ul className="mb-3 flex flex-col gap-3">
              {modules.map((module) => (
                <li key={module.code}>
                  {/* Module header row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-blue-400 font-semibold text-sm shrink-0">{module.code}</span>
                      <span className="text-white text-sm truncate">{module.title}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveModule(module.code)}
                      className="text-gray-400 hover:text-red-400 ml-3 text-xl leading-none shrink-0"
                      aria-label={`Remove ${module.code}`}
                    >
                      x
                    </button>
                  </div>
                  {/* Lesson type rows */}
                  <ul className="mt-1 flex flex-col gap-0.5 pl-3 border-l border-gray-700">
                    {Object.keys(module.lessons).map((lessonType) => {
                      const key = slotKey(module.code, lessonType);
                      const isLocked = locked.has(key);
                      const isSkipped = skipped.has(key);
                      return (
                        <li
                          key={lessonType}
                          className={`flex items-center justify-between gap-2 py-0.5 ${isSkipped ? "opacity-50" : ""}`}
                        >
                          <span className="text-xs text-gray-400 truncate">{lessonType}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Lock toggle */}
                            <button
                              type="button"
                              onClick={() => toggleLocked(module.code, lessonType)}
                              disabled={isSkipped}
                              className={`flex items-center p-1 rounded border transition-opacity ${
                                isSkipped
                                  ? "border-gray-700 text-gray-600 cursor-not-allowed"
                                  : isLocked
                                    ? "border-blue-400 text-blue-400"
                                    : "border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-400"
                              }`}
                              aria-label={isLocked ? `Unlock ${lessonType}` : `Lock ${lessonType}`}
                            >
                              <LockIcon locked={isLocked} />
                            </button>
                            {/* Attending toggle */}
                            <button
                              type="button"
                              onClick={() => toggleSkipped(module.code, lessonType)}
                              className={`flex items-center p-1 rounded border transition-opacity ${
                                isSkipped
                                  ? "border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-400"
                                  : "border-green-600 text-green-500 hover:text-green-400 hover:border-green-400"
                              }`}
                              aria-label={isSkipped ? `Mark ${lessonType} as attending` : `Mark ${lessonType} as not attending`}
                            >
                              <AttendingIcon attending={!isSkipped} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <ModuleSearchDropdown
            onAddModule={onAddModule}
            addedModuleCodes={addedModuleCodes}
          />
        </div>
        <div className={active === "constraints" ? "" : "hidden"}>
          <ConstraintPanel constraints={constraints} onConstraintsChange={onConstraintsChange} />
        </div>
      </div>
    </div>
  );
}
