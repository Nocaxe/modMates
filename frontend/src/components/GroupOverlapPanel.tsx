import type { Module, SelectionState } from "./Timetable";
import type { GroupMember } from "../api/optimise";

interface Props {
  modules: Module[];
  userSelection: SelectionState;
  groupMembers: GroupMember[];
  rankIndex: number;
}

function fmtMins(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return min === 0
    ? `${display}${suffix}`
    : `${display}:${min.toString().padStart(2, "0")}${suffix}`;
}

export function GroupOverlapPanel({
  modules,
  userSelection,
  groupMembers,
  rankIndex,
}: Props) {
  if (groupMembers.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Group overlap</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Shared classes with{" "}
          {groupMembers.map((m) => m.name).join(", ")}
        </p>
      </div>

      {modules.map((mod) => {
        const userModSel = userSelection[mod.code] ?? {};

        const rows = Object.entries(mod.lessons).flatMap(
          ([lessonType, lessonGroup]) => {
            const userClassNo = userModSel[lessonType];
            if (!userClassNo) return [];

            // Unique meeting times for the user's chosen class
            const seen = new Set<string>();
            const uniqueSlots = lessonGroup.slots
              .filter((s) => s.classNo === userClassNo)
              .filter((s) => {
                const k = `${s.day}-${s.start}`;
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });

            const timeStr = uniqueSlots
              .map((s) => `${s.day.slice(0, 3)} ${fmtMins(s.start)}–${fmtMins(s.end)}`)
              .join(", ");

            const memberOverlaps = groupMembers.map((member) => {
              const ranked = member.ranked_selections;
              const memberSel = ranked[Math.min(rankIndex, ranked.length - 1)];
              const memberClassNo = memberSel[mod.code]?.[lessonType];
              return {
                name: member.name,
                overlaps: memberClassNo === userClassNo,
              };
            });

            return [{ lessonType, userClassNo, timeStr, memberOverlaps }];
          },
        );

        if (rows.length === 0) return null;

        return (
          <div
            key={mod.code}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2"
          >
            <p className="text-sm font-semibold text-gray-800">
              {mod.code}
              <span className="font-normal text-gray-400 ml-1.5 text-xs">
                {mod.title}
              </span>
            </p>

            {rows.map(({ lessonType, userClassNo, timeStr, memberOverlaps }) => (
              <div
                key={lessonType}
                className="flex items-center justify-between gap-2 flex-wrap"
              >
                <div className="min-w-0">
                  <span className="text-xs font-medium text-gray-700">
                    {lessonType}
                  </span>
                  <span className="text-xs text-gray-400 ml-1.5">
                    {userClassNo} · {timeStr}
                  </span>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {memberOverlaps.map(({ name, overlaps }) => (
                    <span
                      key={name}
                      title={
                        overlaps
                          ? `${name} is in the same class`
                          : `${name} is in a different class`
                      }
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                        overlaps
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {overlaps ? "✓" : "✗"}{" "}
                      {name.replace(" (demo)", "")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
