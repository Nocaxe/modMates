import type { Module, SelectionState } from "../components/Timetable";

const LESSON_TYPE_ABBR: Record<string, string> = {
  Lecture: "LEC",
  Tutorial: "TUT",
  Laboratory: "LAB",
  Recitation: "REC",
  Seminar: "SEM",
  "Sectional Teaching": "SEC",
  "Design Lecture": "DLEC",
  "Packaged Lecture": "PLEC",
  "Packaged Tutorial": "PTUT",
  "Seminar-Style Module Class": "SEM",
  "Tutorial Type 2": "TUT2",
  "Tutorial Type 3": "TUT3",
  Workshop: "WS",
};

function abbreviateLessonType(lessonType: string): string {
  return LESSON_TYPE_ABBR[lessonType] ?? lessonType;
}

export function exportToNUSMods(modules: Module[], selection: SelectionState): string | null {
    if (modules.length === 0) return null;

    // Default to Semester 1 if not specified
    const semester = modules.find((m) => m.semester != null)?.semester ?? 1;

    const params = new URLSearchParams();
    for (const mod of modules) {
        const selectedLessons = selection[mod.code];
        if (!selectedLessons) {
            continue;
        }

        // turns {"Lecture": "1", "Tutorial": "2"} into ["LEC:1", "TUT:2"]
        const entries = Object.entries(selectedLessons).map(
            ([lessonType, classNo]) => `${abbreviateLessonType(lessonType)}:${classNo}`
        );

        if (entries.length == 0) continue;

        params.set(mod.code, entries.join(","));
    }
    
    return `https://nusmods.com/timetable/sem-${semester}/share?${params.toString()}`;
}

