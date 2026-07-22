import type { Module, SelectionState } from "../components/Timetable";
import type { GroupMember } from "../api/optimise";

/**
 * Generates dummy group members whose selections are derived from the user's current modules.
 *
 * Alice takes the "next" available classNo (index + 1, wrapping) from whatever the user has.
 * Bob always takes the first available classNo for every lesson type.
 *
 * Both members provide a single ranked_selection (length 1). The backend resolves
 * ranked_selections[min(rank, len-1)], so all 5 ranks target the same dummy selection.
 *
 * Integration point: replace this function with a real API call that returns each group
 * member's top-5 selections once the group feature is implemented. No other code needs to change.
 */
export function getDummyGroupMembers(
  modules: Module[],
  userSelection: SelectionState,
): GroupMember[] {
  const aliceSel: SelectionState = {};
  const bobSel: SelectionState = {};

  for (const mod of modules) {
    aliceSel[mod.code] = {};
    bobSel[mod.code] = {};

    for (const [lessonType, lessonGroup] of Object.entries(mod.lessons)) {
      const classNos = [...new Set(lessonGroup.slots.map((s) => s.classNo))];
      if (classNos.length === 0) continue;

      const currentClassNo = userSelection[mod.code]?.[lessonType] ?? classNos[0];
      const currentIdx = classNos.indexOf(currentClassNo);

      aliceSel[mod.code][lessonType] = classNos[(currentIdx + 1) % classNos.length];
      bobSel[mod.code][lessonType] = classNos[0];
    }
  }

  return [
    { name: "Alice (demo)", ranked_selections: [aliceSel] },
    { name: "Bob (demo)", ranked_selections: [bobSel] },
  ];
}
