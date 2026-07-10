const CARDS = [
  { key: "total", label: "Posts analyzed", color: "var(--pulse)", dim: "var(--pulse-dim)" },
  { key: "positive", label: "Positive", color: "var(--positive)", dim: "var(--positive-dim)" },
  { key: "neutral", label: "Neutral", color: "var(--neutral)", dim: "var(--neutral-dim)" },
  { key: "negative", label: "Negative", color: "var(--negative)", dim: "var(--negative-dim)" },
];

export default function StatCards({ summary }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14,
      }}
    >
      {CARDS.map((c) => (
        <div
          key={c.key}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: c.dim,
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{c.label}</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, color: c.color }}>
              {summary?.[c.key] ?? 0}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
