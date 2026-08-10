import { useState } from "react";
import { jointOptimise, batchSaveTimetables, type JointSolution, type JointMemberResult } from "../api/groups";
import type { SelectionState } from "../components/Timetable";
import type { RankedSolution } from "../api/optimise"

interface UseGroupOptimiseArgs {
    accessToken: string | undefined;
    userId: string | undefined;
    groupId: number | null;
    onExported: (selection: SelectionState) => void;
}

export function useGroupOptimise({
    accessToken,
    userId,
    groupId,
    onExported,
}: UseGroupOptimiseArgs) {
    const [solutions, setSolutions] = useState<JointSolution[] | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [exportMessage, setExportMessage] = useState<string | null>(null);
    const [isOptimising, setIsOptimising] = useState(false);

    // Helper function to obtain result for the current indexed user
    function myResultAt(index: number): JointMemberResult | null {
        if (!solutions || !userId) return null;
        return solutions[index]?.members.find((member) => member.user_id === userId) ?? null;
    }

    //call the backend, set solution state with the result (optimise for group button)
    async function runOptimise() {
        if (!accessToken || groupId === null) return;
        setError(null);
        setExportMessage(null);
        setIsOptimising(true);
        try {
            const result = await jointOptimise(accessToken, groupId);
            if (result.solutions.length === 0) {
                setError("No valid joint timetable found. Hard constraints cannot all be satisfied. Try relaxing some constraints.",);
                return;
        }
        setSolutions(result.solutions);
        setSelectedIndex(0);
        } catch (err) {
            setError( err instanceof Error ? err.message : "Joint optimisation failed.");
        } finally {
            setIsOptimising(false);
        }
    }

    // flip through the ranked options for the current user
    function selectSolution(index: number) {
        if (!solutions || index < 0 || index >= solutions.length) return;
        setSelectedIndex(index);
    }

    async function exportSelection() {
        if (!accessToken || groupId === null || !userId || !solutions) return;
        const currentSolution = solutions[selectedIndex];
        const myResult = myResultAt(selectedIndex);
        if (!currentSolution || !myResult) {
            setError("No selection available.");
            return;
        }
        try {
            const updates = currentSolution.members.map((m) => ({
                user_id: m.user_id,
                selection: m.proposed_selection,
            }));
            await batchSaveTimetables(accessToken, groupId, updates);
            onExported(myResult.proposed_selection);
            setSolutions(null);
            setSelectedIndex(0);
            setExportMessage("Applied to all group members' timetables.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to apply selection.");
        }
    }

    function discard() {
        setSolutions(null);
        setSelectedIndex(0);
    }

    // translate the joint solution into a list of RankedSolution to be used for SolutionPicker component
    const mySolutions: RankedSolution[] = (solutions ?? []).map((_, i) => {
        const mine = myResultAt(i);
        return { selection: mine?.proposed_selection ?? {}, score: mine?.score ?? 0 };
    });

    function memberProposedSelection(email: string): Record<string, Record<string, string>> | null {
        if (!solutions) return null;
        return solutions[selectedIndex]?.members.find((m) => m.email === email)?.proposed_selection ?? null;
    }

    return {
        mySolutions,
        selectedIndex,
        myResult: myResultAt(selectedIndex),
        memberProposedSelection,
        error,
        exportMessage,
        isOptimising,
        runOptimise,
        selectSolution,
        exportSelection,
        discard,
    };
}