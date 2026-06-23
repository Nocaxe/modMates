import { useState} from "react"
import { ModuleSearchDropdown } from "../components/ModuleSearchDropdown"
import type { Module } from "../components/Timetable"
import { useState } from "react";
import TimetableUI from "../components/Timetable";
import { BottomPanel } from "../components/BottomPanel";

export default function OptimiserPage() {
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

  return (
    <div className="flex flex-col gap-4">
      <TimetableUI />
      {/* <button onClick={handleOptimise} className="mt-4 w-full bg-white">
        Optimise
      </button> */}
      <BottomPanel onConstraintsChange={setConstraintPayload} />
    </div>
  );
}
