import { getModuleDetail, moduleDetailToModule } from '../api/modules';
import type { Module } from '../components/Timetable';

export function restoreModules(codes: string[], onRestored: (mods: Module[]) => void) {
  if (codes.length === 0) return;
  Promise.all(codes.map((code) => getModuleDetail(code)))
    .then((details) => onRestored(details.map(moduleDetailToModule)))
    .catch(() => {});
}