import { useState, useEffect, useRef} from "react";
import { searchModules, getModuleDetail, moduleDetailToModule } from "../api/modules";
import type { ModuleSummary, ModuleDetail } from "../api/modules";
import type { Module } from "./Timetable";

const MAX_RESULTS = 8;

function formatExamDate(examDate: string | null): string {
    if (!examDate) return "No exam";
    return new Date(examDate).toLocaleString("en-SG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
} 

interface Props {
    onAddModule: (module: Module) => void;
    addedModuleCodes: Set<string>;
}


export function ModuleSearchDropdown({ onAddModule, addedModuleCodes }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ModuleSummary[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [moduleDetails, setModuleDetails] = useState<Record<string, ModuleDetail>>({});



    // close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setQuery(val);
        setIsOpen(true);
        if (val.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        setError(null);
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          setLoading(true);
          searchModules(val)
            .then((data) => {
              const top = data.slice(0, MAX_RESULTS);
              setResults(top);
              setIsOpen(top.length > 0);
              // fetch details for all results so exam dates and description load
              top.forEach((m) => {
                if (!moduleDetails[m.moduleCode]) {
                  getModuleDetail(m.moduleCode)
                    .then((detail) => {
                      setModuleDetails((prev) => ({ ...prev, [m.moduleCode]: detail }));
                    })
                    .catch(() => {});
                }
              }); 
            })
            .catch(() => setError("Failed to search modules"))
            .finally(() => setLoading(false));    
        }, 300);
    } 

    function handleSelectModule(summary: ModuleSummary) {
        if (addedModuleCodes.has(summary.moduleCode)) {
            setError("Module already added");
            return;
        }
                
        // check cache first
        const cached = moduleDetails[summary.moduleCode];
        if (cached) {
            onAddModule(moduleDetailToModule(cached));
            setIsOpen(false);
            return;
        }

        // fetch module details if not in cache
        setLoading(true);
        getModuleDetail(summary.moduleCode)
            .then((detail) => {
                setModuleDetails((prev) => ({ ...prev, [summary.moduleCode]: detail }));
                onAddModule(moduleDetailToModule(detail));
                setIsOpen(false);
            })                          
            .catch(() => setError("Failed to load module details"))
            .finally(() => setLoading(false));
    }           

    return (
    <div ref={dropdownRef} className="relative">

      {/* Search input */}
      <div className="flex gap-2">
        <input
          className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 flex-1"
          placeholder="Search e.g. CS2040S"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
        {loading && (
          <span className="text-gray-400 self-center text-sm">Loading...</span>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

      {/* Dropdown list */}
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden">
          {results.map((m) => {
            const isAdded = addedModuleCodes.has(m.moduleCode);
            const detail = moduleDetails[m.moduleCode];
            const examLine = detail 
            ? formatExamDate(detail.semesterData[0]?.examDate)
            : "Loading...";

            return (
              <li
                key={m.moduleCode}
                className={`flex items-center justify-between px-3 py-2 gap-3 border-b border-gray-700 last:border-0 ${
                  isAdded
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:bg-gray-700"
                }`}
                onClick={() => handleSelectModule(m)}
              >
                {/* Left: name + exam date */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-400 font-semibold text-sm shrink-0">
                      {m.moduleCode}
                    </span>
                    <span className="text-white text-sm truncate">{m.title}</span>
                    {isAdded && (
                      <span className="text-xs text-green-400 shrink-0">Added ✓</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs mt-0.5">{examLine}</span>
                </div>

                {/* Right: info icon with hover tooltip */}
                <div className="group relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="text-gray-400 hover:text-white p-1 rounded text-sm"
                    aria-label={`More info for ${m.moduleCode}`}
                  >
                    ⓘ
                  </button>
                  <div className="hidden group-hover:block absolute right-0 top-full z-50 w-72 bg-gray-900 border border-gray-600 rounded-md p-3 shadow-xl text-sm pointer-events-none">
                    <p className="font-mono text-blue-400 font-semibold">{m.moduleCode}</p>
                    <p className="text-white font-medium mt-0.5">{m.title}</p>
                    <p className="text-gray-300 mt-2 leading-relaxed">
                      {detail 
                        ? detail.description
                        : "Loading..."}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

}