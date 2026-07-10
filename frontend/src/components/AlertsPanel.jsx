function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function AlertsPanel({ alerts }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--text-muted)",
          fontWeight: 500,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Alerts</span>
        {alerts.length > 0 && (
          <span
            className="mono"
            style={{
              color: "var(--negative)",
              background: "var(--negative-dim)",
              borderRadius: 999,
              padding: "1px 8px",
              fontSize: 11,
            }}
          >
            {alerts.length}
          </span>
        )}
      </div>
      <div className="scrollbar-thin" style={{ maxHeight: 280, overflowY: "auto" }}>
        {alerts.length === 0 ? (
          <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>
            No negative spikes detected yet. Alerts fire automatically when negative
            sentiment crosses the configured threshold.
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
                borderLeft: "3px solid var(--negative)",
              }}
            >
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}
              >
                {a.keyword} · {timeAgo(a.triggered_at)}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
                {a.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
