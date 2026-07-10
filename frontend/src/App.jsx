import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import Header from "./components/Header";
import Ticker from "./components/Ticker";
import StatCards from "./components/StatCards";
import SentimentChart from "./components/SentimentChart";
import LiveFeed from "./components/LiveFeed";
import AlertsPanel from "./components/AlertsPanel";
import TrendingKeywords from "./components/TrendingKeywords";

const POLL_MS = 30_000; // dashboard refresh; independent of backend's own fetch schedule

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [feedFilter, setFeedFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const refreshAll = useCallback(async (kw) => {
    try {
      const [postsRes, summaryRes, seriesRes, alertsRes, trendingRes] = await Promise.all([
        api.listPosts(kw ? { keyword: kw } : {}),
        api.summary(kw),
        api.timeseries(kw),
        api.alerts(),
        api.trending(),
      ]);
      setPosts(postsRes);
      setSummary(summaryRes);
      setSeries(seriesRes);
      setAlerts(alertsRes);
      setTrending(trendingRes);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  async function handleTrack(kw) {
    setIsLoading(true);
    setError(null);
    try {
      await api.fetchPosts(kw);
      await api.watch(kw); // background polling every FETCH_INTERVAL_SECONDS
      setKeyword(kw);
      setIsLive(true);
      await refreshAll(kw);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Poll the dashboard for updates while a keyword is live.
  useEffect(() => {
    if (!keyword) return undefined;
    const id = setInterval(() => refreshAll(keyword), POLL_MS);
    return () => clearInterval(id);
  }, [keyword, refreshAll]);

  // Initial load: show whatever is already in the DB (e.g. from a scheduled job).
  useEffect(() => {
    refreshAll(null);
  }, [refreshAll]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header keyword={keyword} onTrack={handleTrack} isLoading={isLoading} isLive={isLive} />
      <Ticker posts={posts.slice(0, 12)} />

      {error && (
        <div
          className="mono"
          style={{
            margin: "16px 28px 0",
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--negative-dim)",
            color: "var(--negative)",
            fontSize: 12.5,
          }}
        >
          {error}
        </div>
      )}

      <main style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <StatCards summary={summary} />
          <SentimentChart data={series} />
          <LiveFeed posts={posts} filter={feedFilter} onFilterChange={setFeedFilter} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AlertsPanel alerts={alerts} />
          <TrendingKeywords trending={trending} activeKeyword={keyword} onSelect={handleTrack} />
        </div>
      </main>

      <style>{`
        @media (max-width: 860px) {
          main { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
