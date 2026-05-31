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