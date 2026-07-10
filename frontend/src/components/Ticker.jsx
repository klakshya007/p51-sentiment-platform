const SENTIMENT_GLYPH = { positive: "▲", negative: "▼", neutral: "●" };
const SENTIMENT_COLOR = {
  positive: "var(--positive)",
  negative: "var(--negative)",
  neutral: "var(--neutral)",
};

export default function Ticker({ posts }) {
  if (!posts?.length) {
    return (
      <div
        className="mono"
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "10px 28px",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        No posts tracked yet — search a keyword above to start the feed.
      </div>
    );
  }

  // Duplicate the list so the CSS scroll animation loops seamlessly.
  const items = [...posts, ...posts];

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        overflow: "hidden",
        background: "var(--surface)",
        whiteSpace: "nowrap",
      }}
    >
      <div
        className="mono"
        style={{
          display: "inline-flex",
          animation: "ticker-scroll 40s linear infinite",
          padding: "10px 0",
        }}
      >
        {items.map((p, i) => (
          <span key={`${p.id}-${i}`} style={{ padding: "0 24px", fontSize: 12.5, color: "var(--text-muted)" }}>
            <span style={{ color: SENTIMENT_COLOR[p.sentiment_label], marginRight: 6 }}>
              {SENTIMENT_GLYPH[p.sentiment_label] || "●"}
            </span>
            <span style={{ color: "var(--text-primary)" }}>r/{p.subreddit}</span>
            {"  ·  "}
            {(p.title || p.text || "").slice(0, 90)}
          </span>
        ))}
      </div>
    </div>
  );
}
