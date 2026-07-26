import type { SelectionState } from "../components/Timetable";

export function getChangedKeys(
    proposed: SelectionState,
    current: SelectionState,
): Set<string> {
    const changed = new Set<string>();
    for (const [code, ltMap] of Object.entries(proposed)) {
        for (const [lt, cno] of Object.entries(ltMap)) {
            if (current[code]?.[lt] !== cno) {
                changed.add(`${code}|${lt}`);
            }
        }
    }
    return changed;
}