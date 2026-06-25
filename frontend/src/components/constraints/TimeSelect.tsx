const TIMES: string[] = [];
for (let h = 8; h <= 22; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}00`);
  if (h < 22) TIMES.push(`${String(h).padStart(2, "0")}30`);
}

function fmt(t: string): string {
  const h = parseInt(t.slice(0, 2), 10);
  const m = t.slice(2);
  return `${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  min?: string; // filter out times before this
  max?: string; // filter out times after this
}

export function TimeSelect({ value, onChange, min, max }: Props) {
  const options = TIMES.filter((t) => (!min || t >= min) && (!max || t <= max));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      {options.map((t) => (
        <option key={t} value={t}>
          {fmt(t)}
        </option>
      ))}
    </select>
  );
}
