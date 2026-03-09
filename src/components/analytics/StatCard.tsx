const COLOR_MAP = {
  blue:   "bg-blue-50   text-blue-800",
  green:  "bg-green-50  text-green-800",
  red:    "bg-red-50    text-red-800",
  yellow: "bg-yellow-50 text-yellow-800",
  gray:   "bg-gray-50   text-gray-800",
} as const;

type Color = keyof typeof COLOR_MAP;

export default function StatCard({
  label,
  value,
  sub,
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: Color;
}) {
  return (
    <div className={`rounded-lg p-5 ${COLOR_MAP[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}
