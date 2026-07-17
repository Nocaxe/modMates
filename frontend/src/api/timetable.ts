export type TimetableData = {
  selection: Record<string, Record<string, string>>;
  locked: string[];
  skipped: string[];
  modules: string[];
};

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function getTimetable(
  accessToken: string,
): Promise<TimetableData> {
  const response = await fetch(`${API_BASE}/timetable`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch timetable data");
  const body: unknown = await response.json();
  return body as TimetableData;
}

export async function saveTimetable(
  accessToken: string,
  data: TimetableData,
): Promise<void> {
  await fetch(`${API_BASE}/timetable`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
