export default function TrendingKeywords({ trending, activeKeyword, onSelect }) {
  const max = Math.max(1, ...trending.map((t) => t.count));

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 18px",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginBottom: 12 }}>
        Trending keywords
      </div>
      {trending.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Nothing tracked yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {trending.map((t) => (
            <button
              key={t.keyword}
              onClick={() => onSelect(t.keyword)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 12.5,
                  color: t.keyword === activeKeyword ? "var(--pulse)" : "var(--text-primary)",
                  width: 88,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.keyword}
              </span>
              <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 4 }}>
                <div
                  style={{
                    width: `${(t.count / max) * 100}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: t.keyword === activeKeyword ? "var(--pulse)" : "var(--border)",
                  }}
                />
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
