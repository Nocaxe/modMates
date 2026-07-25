import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";  
import TimetableUI from "../components/Timetable";
import type { Module, SelectionState } from "../components/Timetable";
import { restoreModules } from "../utils/moduleRestore";
import { getTimetable } from "../api/timetable";
import { useParams } from "react-router-dom";
import {
    getGroupMembers,
    getOptimiserMembers,
    type GroupMemberInfo,
    type OptimiserGroupMember,
} from "../api/groups";
import type { Constraint } from "../types/constraints";
import { useGroupOptimise } from "../hooks/useGroupOptimise";
import { GroupOptimisePreviewPanel } from "../components/GroupOptimisePreviewPanel";
import { SolutionPicker } from "../components/SolutionPicker";



export default function GroupDetailPage() {
    const { session} = useAuth();
    const { groupId } = useParams<{ groupId: string }>();
    const numericGroupId = groupId ? Number(groupId) : null;

    const [roster, setRoster] = useState<GroupMemberInfo[]>([]);
    const [optimiserMembers, setOptimiserMembers] = useState<OptimiserGroupMember[]>([]);  

    const [ownSelection, setOwnSelection] = useState<SelectionState>({});
    const [ownLocked, setOwnLocked] = useState<string[]>([]);
    const [ownSkipped, setOwnSkipped] = useState<string[]>([]);
    const [ownModules, setOwnModules] = useState<Module[]>([]);
    const [ownConstraints, setOwnConstraints] = useState<Constraint[]>([]);

    const [activeTab, setActiveTab] = useState<string>("You")
    const [memberModulesCache, setMemberModulesCache] = useState<Record<string, Module[]>>({}); 


    useEffect(() => {
        if (!session || numericGroupId === null) return;
        getGroupMembers(session.access_token, numericGroupId)
            .then(setRoster)
            .catch(() => {});
        getOptimiserMembers(session.access_token, numericGroupId)
            .then(setOptimiserMembers)
            .catch(() => {});
        getTimetable(session.access_token)
        .then((data) => {
            setOwnSelection(data.selection);
            setOwnLocked(data.locked);
            setOwnSkipped(data.skipped);
            setOwnConstraints(data.constraints ?? []);
            restoreModules(data.modules, setOwnModules);
        })
        .catch( ()=> {});
    }, [session, numericGroupId]);
    
    function selectMemberTab(name: string) {
        setActiveTab(name);
        if ( name === "You" || memberModulesCache[name]) return;
        const member = optimiserMembers.find((m) => m.name === name);
        if (!member) return;
        const codes = Object.keys(member.ranked_selections[0] ?? {});
        restoreModules(codes, (modules) => {
            setMemberModulesCache((prev) => ({ ...prev, [name]: modules }));
        });
    }

    // calling the useGroupOptimise hook
    const optimiser = useGroupOptimise({
        accessToken: session?.access_token,
        userId: session?.user.id,
        groupId: numericGroupId,
        ownLocked,
        ownSkipped,
        ownModules,
        ownConstraints,
        onExported: setOwnSelection,
    });

    async function handleOptimiseForGroup() {
        setActiveTab("You");
        await optimiser.runOptimise();
    }


    const previewModules = activeTab === "You" ? ownModules : memberModulesCache[activeTab] ?? [];
    const previewSelection = activeTab === "You" 
        ? (optimiser.myResult?.proposed_selection ?? ownSelection) 
        : optimiserMembers.find((m) => m.name === activeTab)?.ranked_selections[0] ?? {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-white">Group timetable</h1>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => selectMemberTab("You")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            activeTab === "You" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
          }`}
        >
          You
        </button>
        {optimiserMembers.map((m) => (
          <button
            key={m.name}
            type="button"
            onClick={() => selectMemberTab(m.name)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeTab === m.name ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>
      <TimetableUI
        modules={previewModules}
        selection={previewSelection}
        locked={new Set(activeTab === "You" ? ownLocked : [])}
        skipped={new Set(activeTab === "You" ? ownSkipped : [])}
        onSelectionChange={() => {}}
        readOnly
      />
    <button
        type="button"
        onClick={() => void handleOptimiseForGroup()}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Optimise for Group
      </button>

      {optimiser.error && (
        <div className="px-4 py-3 bg-red-950 border border-red-700 rounded-xl text-red-300 text-sm">
          {optimiser.error}
        </div>
      )}
      {optimiser.exportMessage && (
        <div className="px-4 py-3 bg-green-950 border border-green-700 rounded-xl text-green-300 text-sm">
          {optimiser.exportMessage}
        </div>
      )}

      <SolutionPicker
        solutions={optimiser.mySolutions}
        selectedIndex={optimiser.selectedIndex}
        onSelect={optimiser.selectSolution}
      />

      {optimiser.myResult && (
        <GroupOptimisePreviewPanel
          member={optimiser.myResult}
          onExport={() => void optimiser.exportSelection()}
          onDismiss={optimiser.discard}
        />
      )}

      <p className="text-xs text-gray-400">{roster.length} member(s) in this group.</p>
    </div>
  );
}