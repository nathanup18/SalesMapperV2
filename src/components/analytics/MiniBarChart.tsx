type Bar = { label: string; count: number };

export default function MiniBarChart({
  data,
  title,
}: {
  data: Bar[];
  title: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="flex items-end gap-1 h-24">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex flex-col items-center flex-1 gap-1"
          >
            <div
              className="w-full bg-blue-400 rounded-sm"
              style={{ height: `${(d.count / max) * 80}px`, minHeight: d.count > 0 ? 4 : 0 }}
              title={`${d.label}: ${d.count}`}
            />
            <span className="text-gray-400 text-[9px] leading-none">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
