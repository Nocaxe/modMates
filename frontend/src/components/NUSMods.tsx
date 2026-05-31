import { useState } from "react";
import { searchModules, getModuleDetail } from "../api/modules";
import type { ModuleSummary, ModuleDetail } from "../api/modules";

export function NUSMods() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ModuleSummary[]>([]);
  const [selected, setSelected] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const data = await searchModules(query);
      setResults(data);
      setSelected(null);
    } catch {
      setError("Failed to search modules. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectModule(moduleCode: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getModuleDetail(moduleCode);
      setSelected(data);
    } catch {
      setError("Failed to load module details.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">modMates – Module Search</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Search e.g. CS2040S"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && results.length > 0 && !selected && (
        <ul className="space-y-2">
          {results.map((m) => (
            <li
              key={m.moduleCode}
              className="bg-white border rounded p-3 cursor-pointer hover:bg-blue-50"
              onClick={() => handleSelectModule(m.moduleCode)}
            >
              <span className="font-mono font-semibold">{m.moduleCode}</span>
              <span className="ml-2 text-gray-600">{m.title}</span>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div>
          <button
            className="text-blue-600 mb-4 hover:underline"
            onClick={() => setSelected(null)}
          >
            ← Back to results
          </button>
          <h2 className="text-xl font-bold mb-1">{selected.moduleCode}</h2>
          <p className="text-gray-600 mb-2">{selected.title}</p>
          <p className="text-sm mb-4">{selected.description}</p>

          {selected.semesterData[0]?.timetable && (
            <>
              <h3 className="font-semibold mb-2">Available Slots (Sem 1)</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Type</th>
                    <th className="border p-2 text-left">Class</th>
                    <th className="border p-2 text-left">Day</th>
                    <th className="border p-2 text-left">Time</th>
                    <th className="border p-2 text-left">Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.semesterData[0].timetable.map((lesson, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border p-2">{lesson.lessonType}</td>
                      <td className="border p-2">{lesson.classNo}</td>
                      <td className="border p-2">{lesson.day}</td>
                      <td className="border p-2">
                        {lesson.startTime}–{lesson.endTime}
                      </td>
                      <td className="border p-2">{lesson.venue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
