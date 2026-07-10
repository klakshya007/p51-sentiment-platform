const LABEL_STYLE = {
  positive: { color: "var(--positive)", bg: "var(--positive-dim)" },
  neutral: { color: "var(--neutral)", bg: "var(--neutral-dim)" },
  negative: { color: "var(--negative)", bg: "var(--negative-dim)" },
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LiveFeed({ posts, filter, onFilterChange }) {
  const filtered = filter ? posts.filter((p) => p.sentiment_label === filter) : posts;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        maxHeight: 520,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Live feed</span>
        <div style={{ display: "flex", gap: 6 }}>
          {["positive", "neutral", "negative"].map((s) => (
            <button
              key={s}
              onClick={() => onFilterChange(filter === s ? null : s)}
              style={{
                fontSize: 11,
                textTransform: "capitalize",
                padding: "3px 9px",
                borderRadius: 999,
                border: `1px solid ${filter === s ? LABEL_STYLE[s].color : "var(--border)"}`,
                background: filter === s ? LABEL_STYLE[s].bg : "transparent",
                color: filter === s ? LABEL_STYLE[s].color : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin" style={{ overflowY: "auto", padding: "6px 0" }}>
        {filtered.length === 0 && (
          <div style={{ padding: 24, color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
            No posts to show.
          </div>
        )}
        {filtered.map((p) => {
          const style = LABEL_STYLE[p.sentiment_label] || LABEL_STYLE.neutral;
          return (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  r/{p.subreddit} · {timeAgo(p.created_at)}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    padding: "2px 7px",
                    borderRadius: 999,
                    color: style.color,
                    background: style.bg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.sentiment_label}
                </span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.4 }}>
                {p.title || p.text}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
