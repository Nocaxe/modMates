import { useState } from "react";
import TimetableUI from "../components/Timetable";
import { BottomPanel } from "../components/BottomPanel";

export default function OptimiserPage() {
  const [constraintPayload, setConstraintPayload] = useState<object[]>([]);

  // TODO: Replace sel and locked with actual data
  {
    /*
  async function handleOptimise() {
    const body = {
        sel: (selected state),
        locked: (locked state),
        constraints: constraintPayload,
    };
    const res = await fetch('/api/optimise', {
        method:'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
  }
  */
  }

  return (
    <div className="flex flex-col gap-4">
      <TimetableUI />
      <BottomPanel onConstraintsChange={setConstraintPayload} />
    </div>
  );
}
