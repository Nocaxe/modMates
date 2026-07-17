import type { GroupOverlapConstraint } from "../../../types/constraints";

interface Props {
  c: GroupOverlapConstraint;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function GroupOverlapConfig({ c: _ }: Props) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600">
      <span>Match classes with your selected group</span>
    </div>
  );
}
