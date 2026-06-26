import { useState} from "react"
import type { Module } from "../components/Timetable"
import TimetableUI from "../components/Timetable";
import { BottomPanel } from "../components/BottomPanel";

export default function OptimiserPage() {
    const [modules, setModules] = useState<Module[]>([]);
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_constraintPayload, setConstraintPayload] = useState<object[]>([]);

  // TODO: Replace sel and locked with actual data
  //   async function handleOptimise() {
  //     const body = {
  //       sel: {
  //         /*(selected state)*/
  //       },
  //       locked: {
  //         /*(locked state)*/
  //       },
  //       constraints: constraintPayload,
  //     };
  //     const res = await fetch("/api/optimise", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(body),
  //     });
  //   }

    function handleAddModule(module: Module) {
        setModules((prev) => {
            if (prev.some((m) => m.code === module.code)) return prev;
            return [...prev, module];
        });
    }
    
    function handleRemoveModule(moduleCode: string) {
        setModules((prev) => prev.filter((m) => m.code !== moduleCode));
    }

    return (
      <div className="flex flex-col gap-4">
        <TimetableUI modules={modules} />
            {/* <button onClick={handleOptimise} className="mt-4 w-full bg-white">
        Optimise
      </button> */}
        <BottomPanel 
          onConstraintsChange={setConstraintPayload} 
          onAddModule={handleAddModule} 
          onRemoveModule={handleRemoveModule}
          modules={modules}
        />
      </div>
    )
}
