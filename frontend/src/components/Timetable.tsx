import { useState } from "react";

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

type SelectionState = Record<string, Record<string, string>>;

type SelectedBlock = {
    type: "selected";
    slot: Slot;
    mod: Module;
    lessonType: string;
    key: string;
    isActive: boolean;
    isLocked: boolean;
};

type AlternativeBlock = {
    type: "alternative";
    slot: Slot;
    mod: Module;
    lessonType: string;
    key: string;
};

type Block = SelectedBlock | AlternativeBlock;

// Constants
const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const LANE_HEIGHT = 64; // px — matches h-16

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const LESSON_ABBR: Record<string, string> = {
    "Lecture": "LEC",
    "Tutorial": "TUT",
    "Laboratory": "LAB",
    "Sectional Teaching": "SEC",
};

const MODULE_COLOURS: ModuleColour[] = [
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

function assignLanes(blocks: Block[]): Array<{ block: Block; lane: number }> {
    const sorted = [...blocks].sort((a, b) => a.slot.start - b.slot.start);
    const laneEnds: number[] = [];
    return sorted.map(block => {
        let lane = laneEnds.findIndex(end => end <= block.slot.start);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(block.slot.end);
        } else {
            laneEnds[lane] = block.slot.end;
        }
        return { block, lane };
    });
}

function slotKey(code: string, lessonType: string) {
    // returns a unique key for a class and lesson type
    return `${code}|${lessonType}`;
}

// DUMMY DATA
// TODO: REMOVE ONCE API IS INTEGRATED
const hm = (hour: number, min = 0): number => hour * 60 + min;

const MODULES: Module[] = [
  {
    code: "CS2103T",
    title: "Software Engineering",
    lessons: {
      Lecture: {
        default: "L1",
        slots: [{ classNo: "L1", day: "Friday", start: hm(14), end: hm(16), venue: "i3 Aud" }],
      },
      Tutorial: {
        default: "T08",
        slots: [
          { classNo: "T08", day: "Wednesday", start: hm(10), end: hm(11), venue: "COM1-0210" },
          { classNo: "T09", day: "Wednesday", start: hm(11), end: hm(12), venue: "COM1-0210" },
          { classNo: "T10", day: "Thursday", start: hm(10), end: hm(11), venue: "COM1-0208" },
          { classNo: "T11", day: "Thursday", start: hm(14), end: hm(15), venue: "COM1-0208" },
          { classNo: "T12", day: "Friday", start: hm(10), end: hm(11), venue: "COM1-0206" },
        ],
      },
    },
  },
  {
    code: "CS2040S",
    title: "Data Structures & Algorithms",
    lessons: {
      Lecture: {
        default: "L1",
        slots: [{ classNo: "L1", day: "Tuesday", start: hm(10), end: hm(12), venue: "LT27" }],
      },
      Tutorial: {
        default: "B01",
        slots: [
          { classNo: "B01", day: "Wednesday", start: hm(14), end: hm(15), venue: "COM1-0208" },
          { classNo: "B02", day: "Wednesday", start: hm(15), end: hm(16), venue: "COM1-0208" },
          { classNo: "B03", day: "Thursday", start: hm(9), end: hm(10), venue: "COM1-0206" },
          { classNo: "B04", day: "Friday", start: hm(9), end: hm(10), venue: "COM1-0206" },
          { classNo: "B05", day: "Friday", start: hm(11), end: hm(12), venue: "COM1-0210" },
        ],
      },
      Laboratory: {
        default: "V01",
        slots: [
          { classNo: "V01", day: "Thursday", start: hm(14), end: hm(16), venue: "COM1-B108" },
          { classNo: "V02", day: "Thursday", start: hm(16), end: hm(18), venue: "COM1-B108" },
          { classNo: "V03", day: "Friday", start: hm(14), end: hm(16), venue: "COM1-B112" },
        ],
      },
    },
  },
  {
    code: "CS2101",
    title: "Effective Communication",
    lessons: {
      "Sectional Teaching": {
        default: "G01",
        slots: [
          { classNo: "G01", day: "Tuesday", start: hm(14), end: hm(16), venue: "AS6-0333" },
          { classNo: "G02", day: "Tuesday", start: hm(16), end: hm(18), venue: "AS6-0333" },
          { classNo: "G03", day: "Wednesday", start: hm(16), end: hm(18), venue: "AS6-0208" },
          { classNo: "G04", day: "Thursday", start: hm(14), end: hm(16), venue: "AS6-0208" },
        ],
      },
    },
  },
  {
    code: "MA2001",
    title: "Linear Algebra I",
    lessons: {
      Lecture: {
        default: "L1",
        slots: [{ classNo: "L1", day: "Monday", start: hm(10), end: hm(12), venue: "LT31" }],
      },
      Tutorial: {
        default: "T01",
        slots: [
          { classNo: "T01", day: "Monday", start: hm(14), end: hm(15), venue: "S17-0304" },
          { classNo: "T02", day: "Monday", start: hm(15), end: hm(16), venue: "S17-0304" },
          { classNo: "T03", day: "Tuesday", start: hm(9), end: hm(10), venue: "S17-0302" },
          { classNo: "T04", day: "Wednesday", start: hm(9), end: hm(10), venue: "S17-0302" },
          { classNo: "T05", day: "Friday", start: hm(9), end: hm(10), venue: "S17-0304" },
        ],
      },
    },
  },
  {
    code: "CS3230",
    title: "Design & Analysis of Algorithms",
    lessons: {
      Lecture: {
        default: "L1",
        slots: [{ classNo: "L1", day: "Monday", start: hm(16), end: hm(18), venue: "LT19" }],
      },
      Tutorial: {
        default: "T01",
        slots: [
          { classNo: "T01", day: "Tuesday", start: hm(9), end: hm(10), venue: "COM1-0210" },
          { classNo: "T02", day: "Wednesday", start: hm(9), end: hm(10), venue: "COM1-0210" },
          { classNo: "T03", day: "Thursday", start: hm(9), end: hm(10), venue: "COM1-0208" },
          { classNo: "T04", day: "Friday", start: hm(13), end: hm(14), venue: "COM1-0206" },
        ],
      },
    },
  },
];
// END OF DUMMY DATA

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
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

export default function TimetableUI() {
    // Set initial selection
    const [selection, setSelection] = useState<SelectionState>(() => {
        const initial: SelectionState = {};
        MODULES.forEach(mod => {
            initial[mod.code] = {};
            Object.entries(mod.lessons).forEach(([lessonType, data]) => {
                initial[mod.code][lessonType] = data.default;
            });
        });
        return initial;
    });

    // slot that is selected for moving
    const [activeKey, setActiveKey] = useState<string | null>(null);

    const [locked, setLocked] = useState<Set<string>>(() => new Set());

    // When user clicks a slot, set it as active for moving (or unselect if already active)
    function handleSlotClick(code: string, lessonType: string, e: React.MouseEvent) {
        e.stopPropagation();
        const key = slotKey(code, lessonType);
        setActiveKey(prev => prev === key ? null : key);
    }

    // When user clicks the lock icon, toggle lock state
    function handleLockClick(code: string, lessonType: string, e: React.MouseEvent) {
        e.stopPropagation();
        const key = slotKey(code, lessonType);
        setLocked(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }

    // When user clicks an alternative slot, move the active slot there
    function handleAlternativeClick(code: string, lessonType: string, classNo: string, e: React.MouseEvent) {
        e.stopPropagation();
        setSelection(prev => ({
            ...prev,
            [code]: { ...prev[code], [lessonType]: classNo },
        }));
        setActiveKey(null);
    }

    // Get all selected and alternative blocks for a given day
    function getDayBlocks(day: string): Block[] {
      const selectedBlocks: SelectedBlock[] = [];
      const alternativeBlocks: AlternativeBlock[] = [];

        MODULES.forEach(mod => {
            Object.entries(mod.lessons).forEach(([lessonType, data]) => {
                const key = slotKey(mod.code, lessonType);
                const selectedClassNo = selection[mod.code][lessonType];
                const isActive = activeKey === key;
                const isLocked = locked.has(key);

                const selectedSlot = data.slots.find(
                    s => s.classNo === selectedClassNo && s.day === day
                );
                if (selectedSlot) {
                    selectedBlocks.push({
                        type: "selected",
                        slot: selectedSlot,
                        mod: mod,
                        lessonType: lessonType,
                        key: key,
                        isActive: isActive,
                        isLocked: isLocked,
                    });
                }

                if (isActive) {
                    data.slots
                        .filter(s => s.day === day && s.classNo !== selectedClassNo)
                        .forEach(slot => {
                            alternativeBlocks.push({
                                type: "alternative",
                                slot: slot,
                                mod: mod,
                                lessonType: lessonType,
                                key: key,
                            })
                        });
                }
            });
        });

        return [...selectedBlocks, ...alternativeBlocks];
    }

    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    return (
        <div className="p-4 select-none ml-4 mr-4" onClick={() => setActiveKey(null)}>
            {/* Timetable grid */}
            <div className="border-b border-slate-200 overflow-hidden">
                {/* Hour headers */}
                <div className="flex">
                    <div className="w-11 shrink-0" />
                    <div className="flex-1 relative h-7">
                        {hours.map((hour) => (
                        <div
                            key={hour}
                            className="absolute top-1.5 text-[17px] font-mono text-white -translate-x-1/2 pointer-events-none whitespace-nowrap"
                            style={{ left: `${timeToPercent(hour * 60)}%` }}
                        >
                            {String(hour).padStart(2, "0")}:00
                        </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Day rows */}
            {DAYS.map((day, dayIdx) => {
                const blocks = getDayBlocks(day);
                const laneAssignments = assignLanes(blocks);
                const numLanes = laneAssignments.length > 0
                    ? Math.max(...laneAssignments.map(a => a.lane + 1))
                    : 1;
                return (
                    <div key={day} className="flex border-b border-slate-100 Last:border-0">
                        <div className="w-11 shrink-0 flex items-center justify-center text-sm font-medium text-white uppercase border-r border-l border-slate-100">
                            {DAY_ABBR[dayIdx]}
                        </div>
                        <div className="flex-1 relative" style={{ height: numLanes * LANE_HEIGHT }}>
                            {/* Vertical grid lines */}
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="absolute top-0 bottom-0 w-px bg-slate-100 pointer-events-none"
                                    style={{ left: `${timeToPercent(hour * 60)}%` }}
                                />
                            ))}

                            {/* Slot blocks */}
                            {laneAssignments.map(({ block, lane }) => {
                                const { slot, mod, lessonType } = block;
                                const colourIndex = MODULES.findIndex(m => m.code === mod.code) % MODULE_COLOURS.length;
                                const colour = MODULE_COLOURS[colourIndex];
                                const leftPct = timeToPercent(slot.start);
                                const widthPct = timeToPercent(slot.end) - leftPct;
                                const isSelected = block.type === "selected";
                                const isAlt = block.type === "alternative";
                                const isActive = isSelected && block.isActive;
                                const isLocked = isSelected && block.isLocked;

                                return (
                                    <div
                                        key={`${block.key}-${slot.classNo}`}
                                        className="absolute rounded-md cursor-pointer flex flex-col justify-center px-1.5 overflow-hidden transition-opacity duration-100"
                                        style={{
                                            top: lane * LANE_HEIGHT + 6,
                                            height: LANE_HEIGHT - 12,
                                            left: `calc(${leftPct}% + 2px)`,
                                            width: `calc(${widthPct}% - 4px)`,
                                            zIndex: isAlt ? 1 : isActive ? 3 : 2,
                                            background: isAlt ? `${colour.bg}80` : colour.bg,
                                            border: isAlt
                                            ? `1.5px dashed ${colour.border}88`
                                            : isActive
                                            ? `1.5px solid ${colour.border}`
                                            : `0.5px solid ${colour.border}55`,
                                            outline: isActive ? `5px solid ${colour.accent}` : "none",
                                            outlineOffset: "1px",
                                        }}
                                        onClick={(e) =>
                                            isAlt
                                            ? handleAlternativeClick(mod.code, lessonType, slot.classNo, e)
                                            : handleSlotClick(mod.code, lessonType, e)
                                        }
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span
                                                className="text-[14px] font-medium truncate"
                                                style={{ color: colour.text }}
                                            >
                                                {mod.code}
                                            </span>
                                            {isSelected && (
                                                <button
                                                    className="flex items-center shrink-0 p-1 rounded bg-transparent border border-gray-300 cursor-pointer transition-opacity"
                                                    style={{ color: colour.accent, opacity: isLocked ? 1 : 0.6 }}
                                                    onClick={(e) => handleLockClick(mod.code, lessonType, e)}
                                                    aria-label={isLocked ? "Unlock slot" : "Lock slot"}
                                                >
                                                    <LockIcon locked={isLocked} />
                                                </button>
                                            )}
                                        </div>
                                        <span
                                            className="text-[11px] truncate"
                                            style={{ color: colour.text }}
                                        >
                                            {LESSON_ABBR[lessonType] ?? lessonType} {slot.classNo} · {slot.venue}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}