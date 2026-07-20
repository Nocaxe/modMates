import type { JointMemberResult } from "../api/groups";

interface Props {
    selectedSolution: JointMemberResult[];
    groupName: string;
    onApply: () => void;
    onDismiss: () => void;
}

function getChangedKeys(
    proposed: Record<string, Record<string, string>>,
    current: Record<string, Record<string, string>>,
): Set<string> {
    const changed = new Set<string>();
    for (const [code, ltMap] of Object.entries(proposed)) {
        for (const [lt, cno] of Object.entries(ltMap)) {
            if (current[code]?.[lt] !== cno) {
                changed.add(`${code}|${lt}`);
            }
        }
    }
    return changed;
}

export function JointOptimisePanel({ selectedSolution, groupName, onApply, onDismiss }: Props) {
    const totalChanges = selectedSolution.reduce((sum, member) => {
        return sum + getChangedKeys(member.proposed_selection, member.current_selection).size;
    }, 0);

    return (
        <div className="flex flex-col gap-4 p-4 bg-gray-900 border border-gray-700 rounded-xl">
            <div className="px-3 py-2 bg-amber-950 border border-amber-700 rounded-lg text-amber-200 text-xs">
                This will update all {selectedSolution.length} members of <span className="font-semibold">{groupName}</span> simultaneously.
                Each member's locked and skipped settings are preserved.
            </div>

            <div className="flex flex-col gap-3">
                {selectedSolution.map((member) => {
                    const changed = getChangedKeys(member.proposed_selection, member.current_selection);
                    return (
                        <div key={member.user_id} className="flex flex-col gap-1.5 p-3 bg-gray-800 rounded-lg">
                            <span className="text-sm font-medium text-gray-200 truncate">{member.email}</span>
                            {changed.size === 0 ? (
                                <p className="text-xs text-gray-500">No changes</p>
                            ) : (
                                <div className="flex flex-col gap-0.5">
                                    {Object.entries(member.proposed_selection).map(([code, ltMap]) =>
                                        Object.entries(ltMap).map(([lt, cno]) => {
                                            const key = `${code}|${lt}`;
                                            const isChanged = changed.has(key);
                                            const prev = member.current_selection[code]?.[lt];
                                            return (
                                                <div
                                                    key={key}
                                                    className={`text-xs flex gap-1.5 ${isChanged ? "text-amber-300" : "text-gray-500"}`}
                                                >
                                                    <span className="font-mono">{code} {lt}</span>
                                                    {isChanged ? (
                                                        <>
                                                            <span className="line-through opacity-60">{prev ?? "—"}</span>
                                                            <span>→</span>
                                                            <span className="font-semibold">{cno}</span>
                                                        </>
                                                    ) : (
                                                        <span>{cno}</span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onApply}
                    disabled={totalChanges === 0}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    Apply for everyone ({selectedSolution.length} members)
                </button>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-xl transition-colors"
                >
                    Discard
                </button>
            </div>
        </div>
    );
}
