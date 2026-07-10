// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.js).
// In production, set VITE_API_BASE_URL to your Azure App Service URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/api/health"),

  fetchPosts: (keyword, subreddit = "all", limit = 25) =>
    request("/api/posts/fetch", {
      method: "POST",
      body: JSON.stringify({ keyword, subreddit, limit }),
    }),

  listPosts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/posts${qs ? `?${qs}` : ""}`);
  },

  summary: (keyword) =>
    request(`/api/sentiment/summary${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`),

  trending: (limit = 8) => request(`/api/sentiment/trending?limit=${limit}`),

  timeseries: (keyword) =>
    request(`/api/sentiment/timeseries${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`),

  alerts: (limit = 20) => request(`/api/alerts?limit=${limit}`),

  watch: (keyword, subreddit = "all") =>
    request(`/api/watch/${encodeURIComponent(keyword)}?subreddit=${encodeURIComponent(subreddit)}`, {
      method: "POST",
    }),

  unwatch: (keyword, subreddit = "all") =>
    request(`/api/watch/${encodeURIComponent(keyword)}?subreddit=${encodeURIComponent(subreddit)}`, {
      method: "DELETE",
    }),
};
