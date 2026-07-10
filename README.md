# P51 — Real-Time Social Media Sentiment Analysis Platform

A trimmed-to-MVP build of the P51 brief: track a keyword/brand on Reddit, run
it through a HuggingFace sentiment model, and watch it live on a dashboard
with trend charts, a live feed, and automatic negative-spike alerts.

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐
│  React       │ ───▶ │  FastAPI backend  │ ───▶ │  Reddit search   │
│  dashboard   │ ◀─── │  (sentiment, DB,  │ ◀─── │  API (free)      │
│  (Vite)      │      │  scheduler)       │      └────────────────┘
└─────────────┘      └──────────┬────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ HuggingFace model  │
                        │ (or Azure AI       │
                        │ Language, optional)│
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ SQLite (dev) /     │
                        │ Cosmos DB (prod)   │
                        └────────────────────┘
```

## What's implemented

- **Backend (FastAPI)** — `/api/posts/fetch` pulls Reddit posts for a keyword,
  classifies each with a HuggingFace transformer, stores them, and checks for
  a negative-sentiment spike. `/api/watch/{keyword}` registers a background
  job (APScheduler) that re-fetches every `FETCH_INTERVAL_SECONDS`, standing
  in for what an Azure Function on a timer trigger would do in production.
- **AI/NLP** — `distilbert-base-uncased-finetuned-sst-2-english` by default
  (runs fully offline, good for a viva with unreliable wifi). Swap in Azure
  AI Language by setting `USE_AZURE_AI_LANGUAGE=true`.
- **Frontend (React + Vite)** — dashboard with summary stat cards, a
  stacked-area sentiment trend chart, a live post feed with sentiment
  filters, an alerts panel, a trending-keywords widget, and a scrolling
  ticker of the latest classified posts.
- **Storage** — SQLite out of the box (zero setup). A Cosmos DB adapter path
  is documented below for the Azure deployment.

## Project structure

```
p51-sentiment-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, scheduler, health check
│   │   ├── config.py             # env-driven settings
│   │   ├── models.py             # SQLAlchemy models + Pydantic schemas
│   │   ├── routers/
│   │   │   ├── posts.py          # fetch/list posts
│   │   │   ├── sentiment.py      # summary, trending, timeseries
│   │   │   └── alerts.py         # list alerts
│   │   └── services/
│   │       ├── reddit_service.py   # Reddit search (OAuth optional)
│   │       ├── sentiment_service.py # HuggingFace / Azure AI Language
│   │       ├── alert_service.py     # negative-spike detection
│   │       └── db.py                # SQLAlchemy session
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api/client.js
    │   └── components/
    │       ├── Header.jsx
    │       ├── Ticker.jsx
    │       ├── StatCards.jsx
    │       ├── SentimentChart.jsx
    │       ├── LiveFeed.jsx
    │       ├── AlertsPanel.jsx
    │       └── TrendingKeywords.jsx
    ├── package.json
    ├── vite.config.js
    └── staticwebapp.config.json
```

## Run it locally

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The first request that triggers sentiment classification will download the
DistilBERT checkpoint (~260 MB) — that only happens once, it's cached after.

Check it's alive: http://localhost:8000/api/health
Interactive API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, type a keyword (e.g. a brand name) into the
search box, and hit **Track**. That triggers an immediate Reddit fetch +
classification, then registers the keyword for automatic re-fetching every
5 minutes.

> Reddit works without any credentials (public search endpoint, lower rate
> limit). For heavier use, create a free app at
> https://www.reddit.com/prefs/apps and drop the client id/secret into
> `backend/.env`.

## Deploying to Azure (student/free-tier friendly)

Keep it to these four services — skip Event Hubs, Queue Storage, and Power BI
unless your guide specifically asks for them; they add complexity the MVP
doesn't need.

| Service | Purpose |
|---|---|
| **Azure App Service** | Hosts the FastAPI backend (container or Python runtime) |
| **Azure Static Web Apps** | Hosts the built React frontend, free tier |
| **Azure Cosmos DB (Free Tier)** | Swap-in for SQLite in production |
| **Azure AI Language** *(optional)* | Only if your faculty wants to see a named Azure Cognitive Service in the stack |

### Backend → App Service

```bash
az group create --name p51-rg --location centralindia
az appservice plan create --name p51-plan --resource-group p51-rg --sku F1 --is-linux
az webapp create --name p51-sentiment-api --resource-group p51-rg \
  --plan p51-plan --runtime "PYTHON:3.12"

az webapp config appsettings set --name p51-sentiment-api --resource-group p51-rg \
  --settings ALLOWED_ORIGINS="https://<your-static-web-app>.azurestaticapps.net" \
             SENTIMENT_MODEL_NAME="distilbert-base-uncased-finetuned-sst-2-english"

az webapp up --name p51-sentiment-api --resource-group p51-rg --runtime "PYTHON:3.12"
```

(Or push the `backend/Dockerfile` to Azure Container Registry and point App
Service at the image if you'd rather containerize.)

### Frontend → Static Web Apps

```bash
cd frontend
npm run build

az staticwebapp create --name p51-sentiment-dashboard --resource-group p51-rg \
  --source . --location centralus --branch main \
  --app-location "/frontend" --output-location "dist"
```

Set `VITE_API_BASE_URL` (in Static Web Apps → Configuration, or a
`.env.production` before building) to your App Service URL.

### Database → Cosmos DB (Free Tier)

For a class demo, SQLite on App Service's local disk is honestly fine — App
Service restarts are infrequent enough for a semester project. If you want
the "real" Azure-native path:

1. Create a Cosmos DB account (Core/SQL API), free tier.
2. Set `USE_COSMOS=true` and `COSMOS_CONNECTION_STRING=...` in App Service
   configuration.
3. Implement `backend/app/services/cosmos_service.py` mirroring the function
   signatures in `services/db.py` — the routers only call `get_db()`, so this
   is a contained swap, not a rewrite. (Left as an extension so the MVP stays
   shippable; flag it in your report as a "production hardening" step if a
   reviewer asks why it isn't wired in by default.)

### Optional: Azure AI Language

If a reviewer specifically wants to see Azure's own NLP service used instead
of (or alongside) HuggingFace:

```bash
az cognitiveservices account create --name p51-language --resource-group p51-rg \
  --kind TextAnalytics --sku F0 --location eastus --yes
```

Then set `USE_AZURE_AI_LANGUAGE=true`, `AZURE_LANGUAGE_ENDPOINT`, and
`AZURE_LANGUAGE_KEY` in App Service configuration — `sentiment_service.py`
already has the call implemented behind that flag.

## How this maps to the original P51 brief

| Original objective | This MVP |
|---|---|
| Ingest real-time social data | Reddit keyword search, polled every 5 min |
| Sentiment classification | HuggingFace DistilBERT (or Azure AI Language) |
| Instant alerts | Negative-spike detector (rolling window, configurable threshold) |
| Visual dashboards | React + Recharts trend chart, stat cards, live feed |
| Trending topics | Keyword-frequency widget |
| Azure deployment | App Service + Static Web Apps + Cosmos DB |

Deliberately out of scope for the MVP (call these out as "future work" in
your report if useful): Twitter/Instagram ingestion, predictive trend
models, automated response recommendations, multi-language sentiment.
Each is a plausible extension of an existing piece (reddit_service.py for
more sources, sentiment_service.py for language detection, etc.) rather than
new architecture.

## Troubleshooting

- **`sqlite3.OperationalError: no such table`** — the DB is created on
  startup via FastAPI's lifespan hook; make sure you're hitting the app
  through `uvicorn`, not importing modules standalone.
- **Slow first request** — that's the HuggingFace model downloading/loading;
  subsequent requests are fast.
- **CORS errors in the browser** — check `ALLOWED_ORIGINS` in the backend
  `.env` includes your frontend's exact origin (scheme + host + port).
- **Reddit 429s** — you're rate-limited on the unauthenticated endpoint; add
  Reddit app credentials to `.env` for a higher limit.
