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
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [moduleDetailsCache, setModuleDetailsCache] = useState<Record<string, ModuleDetail>>({}); //store already fetched module details
    const dropdownRef = useRef<HTMLDivElement>(null);


    // close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSelectedIndex(-1);
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
            return;
        }
    }

    function handleSelectModule(summary: ModuleSummary) {
        if (addedModuleCodes.has(summary.moduleCode)) {
            setError("Module already added");
            return;
        }
                
        // check cache first
        if (moduleDetailsCache[summary.moduleCode]) {
            onAddModule(moduleDetailToModule(moduleDetailsCache[summary.moduleCode]));
            setIsOpen(false);
            setSelectedIndex(-1);
            return;
        }

        // fetch module details if not in cache
        setLoading(true);
        getModuleDetail(summary.moduleCode)
            .then((detail) => {
                setModuleDetailsCache((prev) => ({ ...prev, [summary.moduleCode]: detail }));   
                onAddModule(moduleDetailToModule(detail));
                setIsOpen(false);
                setSelectedIndex(-1);
            })                          
            .catch(() => setError("Failed to load module details"))
            .finally(() => setLoading(false));
    }           

    return <></>
}