interface Slot {
    classNo: string;
    day: string;
    start: number; // minutes from midnight
    end: number; // minutes from midnight
    venue: string;
}

interface LessonGroup {
    default: string;
    slots: Slot[];
}

interface Module {
    code: string;
    title: string;
    lessons: Record<string, LessonGroup>; // Lesson type, lesson group
}

interface ModuleColour {
    bg: string;
    border: string;
    text: string;
    accent: string;
}

type SelectionState = Record<string, Record<string, LessonGroup>>;
