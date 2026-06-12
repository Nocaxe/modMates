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

// Constants
const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const LESSON_ABBR: Record<string, string> = {
    "Lecture": "LEC",
    "Tutorial": "TUT",
    "Laboratory": "LAB",
    "Sectional Teaching": "SEC",
};

const MODULE_COLORS: ModuleColor[] = [
  { bg: "#EEEDFE", border: "#7F77DD", text: "#26215C", accent: "#534AB7" }, // purple
  { bg: "#E1F5EE", border: "#1D9E75", text: "#04342C", accent: "#0F6E56" }, // teal
  { bg: "#FAEEDA", border: "#BA7517", text: "#412402", accent: "#854F0B" }, // amber
  { bg: "#FBEAF0", border: "#D4537E", text: "#4B1528", accent: "#993556" }, // pink
  { bg: "#E6F1FB", border: "#378ADD", text: "#042C53", accent: "#185FA5" }, // blue
];

// Helper functions
function timeToPercent(minutes: number): number {
    // Maps a time to a percentage of the timetable width
    return ((minutes - START_HOUR * 60) / TOTAL_MINUTES) * 100;
}

function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

function slotKey(code: string, lessonType: string) {
    // returns a unique key for a class and lesson type
    return `${code}|${lessonType}`;
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 shrink-0">
      {locked ? (
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
      ) : (
        <>
          <path
            className="opacity-35"
            d="M12 1C8.69 1 6 3.69 6 7v1H4v14h16V8H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3h2C17 3.69 14.76 1 12 1z"
          />
          <path d="M13 14.27V17h-2v-2.73C10.42 13.92 10 13.01 10 12c0-1.1.9-2 2-2s2 .9 2 2c0 1.01-.42 1.92-1 2.27z" />
        </>
      )}
    </svg>
  );
}

