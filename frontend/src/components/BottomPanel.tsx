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
  addedModuleCodes: Set<string>;
}

export function BottomPanel({ onConstraintsChange, onAddModule, addedModuleCodes }: Props) {
  const [active, setActive] = useState<Tab>("modules");

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
        {active === "modules" && (
          <ModuleSearchDropdown 
            onAddModule={onAddModule} 
            addedModuleCodes={addedModuleCodes} 
          />
        )}
        {active === "constraints" && (
          <ConstraintPanel onChange={onConstraintsChange} />
        )}
      </div>
    </div>
  );
}
