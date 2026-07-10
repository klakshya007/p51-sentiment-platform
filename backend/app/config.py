"""
Central configuration for the Sentiment Platform backend.
All values are overridable via environment variables (.env file locally,
App Service > Configuration in Azure).
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    app_name: str = "P51 Real-Time Social Media Sentiment Platform"
    environment: str = "development"          # development | production
    allowed_origins: str = "http://localhost:5173"  # comma separated

    # --- Database ---
    # Local dev: sqlite file. Azure: swap to Cosmos DB connection string
    # (see backend/app/services/cosmos_service.py for the drop-in adapter).
    database_url: str = "sqlite:///./sentiment.db"
    use_cosmos: bool = False
    cosmos_connection_string: str | None = None
    cosmos_database_name: str = "sentiment_platform"
    cosmos_container_name: str = "posts"

    # --- Reddit API (create an app at https://www.reddit.com/prefs/apps) ---
    reddit_client_id: str | None = None
    reddit_client_secret: str | None = None
    reddit_user_agent: str = "p51-sentiment-platform/0.1 by yourusername"
    # If the live Reddit request fails or is blocked, generate sample posts
    # instead of erroring out. Keeps local dev/demos unblocked.
    reddit_fallback_to_mock: bool = True

    # --- Sentiment model ---
    # Any HuggingFace text-classification checkpoint works. This one is small,
    # fast on CPU, and good enough for a student MVP.
    sentiment_model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"

    # --- Azure AI Language (optional upgrade, off by default) ---
    use_azure_ai_language: bool = False
    azure_language_endpoint: str | None = None
    azure_language_key: str | None = None

    # --- Alerts ---
    # If the share of negative posts in the rolling window crosses this
    # fraction, an alert is raised.
    negative_spike_threshold: float = 0.4
    alert_window_minutes: int = 15

    # --- Scheduler ---
    fetch_interval_seconds: int = 300  # 5 minutes, matches Azure Functions plan


@lru_cache
def get_settings() -> Settings:
    return Settings()
