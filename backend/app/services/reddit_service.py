"""
Minimal Reddit client using the free public JSON search endpoint plus
OAuth app-only auth when credentials are supplied (higher rate limits).

No third-party Reddit SDK required, which keeps the dependency list small
and avoids version churn.

If Reddit blocks or rate-limits the request (increasingly common for
unauthenticated traffic), this falls back to generated sample posts so the
dashboard is never dead in the water — useful for local dev, demos, and
viva day if the wifi or Reddit itself misbehaves. Set
REDDIT_FALLBACK_TO_MOCK=false to disable this and see the real error instead.
"""
from __future__ import annotations

import logging
import random
import time
from datetime import datetime, timedelta, timezone

import httpx

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

_token_cache: dict[str, str | float] = {"token": "", "expires_at": 0.0}

_MOCK_TEMPLATES = [
    ("positive", "Honestly {kw} has been amazing lately, really impressed with the changes"),
    ("positive", "Just tried {kw} for the first time and I'm hooked, exceeded expectations"),
    ("positive", "{kw} customer support fixed my issue in minutes, great experience"),
    ("neutral", "Anyone know when {kw} is releasing the next update? Curious about the roadmap"),
    ("neutral", "Comparing {kw} to a few alternatives, still deciding what to go with"),
    ("neutral", "{kw} announced a partnership today, not sure what to make of it yet"),
    ("negative", "{kw} has really gone downhill, the last update broke everything for me"),
    ("negative", "Disappointed with {kw}, waited weeks for a refund that never came"),
    ("negative", "Why does {kw} keep crashing? This is getting frustrating"),
]
_MOCK_SUBREDDITS = ["technology", "gadgets", "AskReddit", "reviews", "consumeradvice"]


def _generate_mock_posts(keyword: str, limit: int) -> list[dict]:
    posts = []
    now = datetime.now(timezone.utc)
    for i in range(min(limit, len(_MOCK_TEMPLATES) * 2)):
        _, template = _MOCK_TEMPLATES[i % len(_MOCK_TEMPLATES)]
        text = template.format(kw=keyword)
        posts.append(
            {
                "id": f"mock_{keyword}_{i}_{int(now.timestamp())}",
                "subreddit": random.choice(_MOCK_SUBREDDITS),
                "author": f"user{random.randint(100, 999)}",
                "title": text,
                "text": text,
                "url": "https://reddit.com",
                "created_at": now - timedelta(minutes=random.randint(1, 240)),
                "score": random.randint(1, 500),
            }
        )
    return posts


async def _get_oauth_token(client: httpx.AsyncClient) -> str | None:
    if not (settings.reddit_client_id and settings.reddit_client_secret):
        return None  # fall back to unauthenticated public JSON endpoint

    if _token_cache["token"] and time.time() < float(_token_cache["expires_at"]):
        return str(_token_cache["token"])

    resp = await client.post(
        "https://www.reddit.com/api/v1/access_token",
        data={"grant_type": "client_credentials"},
        auth=(settings.reddit_client_id, settings.reddit_client_secret),
        headers={"User-Agent": settings.reddit_user_agent},
    )
    resp.raise_for_status()
    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600) - 60
    return str(_token_cache["token"])


async def fetch_posts(keyword: str, subreddit: str = "all", limit: int = 25) -> list[dict]:
    """Search Reddit for `keyword` and return a normalized list of posts.

    Falls back to generated sample posts if Reddit blocks/rate-limits the
    request, unless REDDIT_FALLBACK_TO_MOCK=false.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token = await _get_oauth_token(client)

            if token:
                base_url = "https://oauth.reddit.com"
                headers = {"Authorization": f"bearer {token}", "User-Agent": settings.reddit_user_agent}
            else:
                base_url = "https://www.reddit.com"
                headers = {"User-Agent": settings.reddit_user_agent}

            path = f"/r/{subreddit}/search.json" if subreddit and subreddit != "all" else "/search.json"
            params = {
                "q": keyword,
                "sort": "new",
                "limit": limit,
                "restrict_sr": "true" if subreddit and subreddit != "all" else "false",
            }

            resp = await client.get(f"{base_url}{path}", params=params, headers=headers)
            resp.raise_for_status()
            payload = resp.json()
    except (httpx.HTTPError, httpx.HTTPStatusError) as exc:
        if not settings.reddit_fallback_to_mock:
            raise
        logger.warning("Reddit request failed (%s) — using generated sample posts instead.", exc)
        return _generate_mock_posts(keyword, limit)

    posts = []
    for child in payload.get("data", {}).get("children", []):
        d = child.get("data", {})
        posts.append(
            {
                "id": d.get("name") or f"t3_{d.get('id')}",
                "subreddit": d.get("subreddit"),
                "author": d.get("author"),
                "title": d.get("title", ""),
                "text": d.get("selftext", "") or d.get("title", ""),
                "url": f"https://reddit.com{d.get('permalink', '')}",
                "created_at": datetime.fromtimestamp(d.get("created_utc", 0), tz=timezone.utc),
                "score": d.get("score", 0),
            }
        )

    # Reddit returned a valid-but-empty result set (e.g. obscure keyword) —
    # still fall back so the demo always has something to show.
    if not posts and settings.reddit_fallback_to_mock:
        logger.info("Reddit returned 0 posts for %r — using generated sample posts instead.", keyword)
        return _generate_mock_posts(keyword, limit)

    return posts
