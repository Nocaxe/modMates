import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";  
import TimetableUI from "../components/Timetable";
import type { Module, SelectionState } from "../components/Timetable";
import { restoreModules } from "../utils/moduleRestore";
import { getTimetable } from "../api/timetable";



export default function GroupDetailPage() {
    const { session} = useAuth();
    const [ownSelection, setOwnSelection] = useState<SelectionState>({});
    const [ownLocked, setOwnLocked] = useState<string[]>([]);
    const [ownSkipped, setOwnSkipped] = useState<string[]>([]);
    const [ownModules, setOwnModules] = useState<Module[]>([]);

    useEffect(() => {
        if (!session) return;
        getTimetable(session.access_token)
        .then((data) => {
            setOwnSelection(data.selection);
            setOwnLocked(data.locked);
            setOwnSkipped(data.skipped);
            restoreModules(data.modules, setOwnModules);
        })
        .catch( ()=> {});
    }, [session]);
    
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-white">Group timetable</h1>

      <TimetableUI
        modules={ownModules}
        selection={ownSelection}
        locked={new Set(ownLocked)}
        skipped={new Set(ownSkipped)}
        onSelectionChange={() => {}}
        readOnly
      />
    </div>
  );
}