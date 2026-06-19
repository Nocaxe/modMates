import type { Module, Slot} from "../components/Timetable";

export type ModuleSummary = {
  moduleCode: string
  title: string
}

export type Lesson = {
  classNo: string
  lessonType: string
  day: string
  startTime: string
  endTime: string
  venue: string
  weeks: number[]
}

export type ModuleDetail = {
  moduleCode: string
  title: string
  description: string
  semesterData: {
    semester: number
    timetable: Lesson[]
  }[]
}

// fetch functions
const API_BASE = import.meta.env.VITE_API_URL as string

export async function searchModules(query: string): Promise<ModuleSummary[]> {
  const response = await fetch(`${API_BASE}/modules/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search modules');
  }
  return response.json() as Promise<ModuleSummary[]>;
}

export async function getModuleDetail(moduleCode: string): Promise<ModuleDetail> {
  const response = await fetch(`${API_BASE}/modules/${encodeURIComponent(moduleCode)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch module detail');
  }
  return response.json() as Promise<ModuleDetail>;
}

// helper function to convert NUSMods time strings to minutes
function parseTime(time: string): number {
  return parseInt(time.slice(0, 2)) * 60 + parseInt(time.slice(2, 4));
}

// helps to bridge the 2 data shapes, from what the API returns me(ModuleDetail)
// to the timetable format (which expects a module)
export function moduleDetailToModule(detail: ModuleDetail): Module {
  const lessons: Record<string, { slots: Slot[] }> = {};
  for (const lesson of detail.semesterData[0]?.timetable ?? []) {
    if (!lessons[lesson.lessonType]) {
      lessons[lesson.lessonType] = { slots: [] };
    }
    lessons[lesson.lessonType].slots.push({
      classNo: lesson.classNo,
      day: lesson.day,
      start: parseTime(lesson.startTime),
      end: parseTime(lesson.endTime),
      venue: lesson.venue,
    });
  }
  return {
    code: detail.moduleCode,
    title: detail.title,
    lessons,
  };
}