import { useState, useEffect, useRef} from "react";
import { searchModules, getModuleDetail } from "../api/modules";
import type { ModuleSummary, ModuleDetail } from "../api/modules";
import type { Module } from "./Timetable";

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

export function ModuleSearchDropdown({ onSelectModule }: { onSelectModule: (module: Module) => void }) {
    return <></>;
}