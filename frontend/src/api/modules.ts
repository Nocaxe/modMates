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
const API_BASE = 'http://localhost:8000'

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
