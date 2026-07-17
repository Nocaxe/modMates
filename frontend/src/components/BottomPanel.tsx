import { useState } from "react";
import { ConstraintPanel } from "./constraints/ConstraintPanel";
import { ModuleSearchDropdown } from "./ModuleSearchDropdown";
import type { Module } from "./Timetable";

type Tab = "modules" | "constraints";

const TABS: { id: Tab; label: string }[] = [
  { id: "modules", label: "Modules" },
  { id: "constraints", label: "Constraints" },
];

interface Props {
  // Pass through whatever props your ModuleSearch already takes
  onConstraintsChange?: (payload: object[]) => void;
  onAddModule: (module: Module) => void;
  onRemoveModule: (moduleCode: string) => void;
  modules: Module[];
}

export function BottomPanel({ onConstraintsChange, onAddModule, onRemoveModule, modules }: Props) {
  const [active, setActive] = useState<Tab>("modules");
  const addedModuleCodes = new Set(modules.map((m) => m.code));

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
            {/* Active underline */}
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
            <ul className="mb-3 flex flex-col gap-2">
              {modules.map((module) => (
                <li key={module.code} className="flex items-center justify-between gap-2">
                  <span className ="flex items-center gap-2 min-w-0">
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
          <ConstraintPanel onChange={onConstraintsChange} />
        </div>
      </div>
    </div>
  );
}
