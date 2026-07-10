import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="mono"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 12px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function SentimentChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 18px 8px",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, fontWeight: 500 }}>
        Sentiment over time
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="pos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="neu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--neutral)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--neutral)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="neg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--negative)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--negative)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
            <Area type="monotone" dataKey="positive" stroke="var(--positive)" fill="url(#pos)" strokeWidth={2} />
            <Area type="monotone" dataKey="neutral" stroke="var(--neutral)" fill="url(#neu)" strokeWidth={2} />
            <Area type="monotone" dataKey="negative" stroke="var(--negative)" fill="url(#neg)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          Track a keyword to see the trend build up here.
        </div>
      )}
    </div>
  );
}
