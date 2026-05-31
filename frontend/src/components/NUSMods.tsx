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
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">modMates – Module Search</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 flex-1"
          placeholder="Search e.g. CS2040S"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {if (e.key === "Enter") void handleSearch()}}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => {void handleSearch()}}
        >
          Search
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && results.length > 0 && !selected && (
        <ul className="space-y-2">
          {results.map((m) => (
            <li
              key={m.moduleCode}
              className="bg-gray-800 border border-gray-700 rounded p-3 cursor-pointer hover:bg-gray-700"
              onClick={() => {void handleSelectModule(m.moduleCode)}}
            >
              <span className="font-mono font-semibold text-blue-400">{m.moduleCode}</span>
              <span className="ml-2 text-gray-300">{m.title}</span>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div>
          <button
            className="text-blue-400 mb-4 hover:underline"
            onClick={() => setSelected(null)}
          >
            ← Back to results
          </button>
          <h2 className="text-xl font-bold mb-1 text-white">{selected.moduleCode}</h2>
          <p className="text-gray-300 mb-2">{selected.title}</p>
          <p className="text-sm mb-4 text-gray-400">{selected.description}</p>

          {selected.semesterData[0]?.timetable && (
            <>
              <h3 className="font-semibold mb-2 text-white">Available Slots (Sem 1)</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 p-2 text-left text-white">Type</th>
                    <th className="border border-gray-600 p-2 text-left text-white">Class</th>
                    <th className="border border-gray-600 p-2 text-left text-white">Day</th>
                    <th className="border border-gray-600 p-2 text-left text-white">Time</th>
                    <th className="border border-gray-600 p-2 text-left text-white">Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.semesterData[0].timetable.map((lesson) => (
                    <tr key={`${lesson.lessonType}-${lesson.classNo}`} className="hover:bg-gray-800">
                      <td className="border border-gray-700 p-2 text-gray-300">{lesson.lessonType}</td>
                      <td className="border border-gray-700 p-2 text-gray-300">{lesson.classNo}</td>
                      <td className="border border-gray-700 p-2 text-gray-300">{lesson.day}</td>
                      <td className="border border-gray-700 p-2 text-gray-300">
                        {lesson.startTime}–{lesson.endTime}
                      </td>
                      <td className="border border-gray-700 p-2 text-gray-300">{lesson.venue}</td>
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
