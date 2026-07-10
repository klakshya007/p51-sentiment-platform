"""
Sentiment classification.

Default path: local HuggingFace transformers pipeline (no external calls,
works fully offline once the model is cached — good for a viva demo with
flaky wifi).

Optional path: Azure AI Language (set USE_AZURE_AI_LANGUAGE=true) if the
faculty specifically wants to see an Azure Cognitive Service in the stack.
"""
from __future__ import annotations

from functools import lru_cache

from app.config import get_settings

settings = get_settings()

_LABEL_MAP = {
    "POSITIVE": "positive",
    "NEGATIVE": "negative",
    "NEUTRAL": "neutral",
}


@lru_cache
def _get_pipeline():
    from transformers import pipeline  # imported lazily: slow import, big dep

    return pipeline("sentiment-analysis", model=settings.sentiment_model_name)


def classify(text: str) -> tuple[str, float]:
    """Return (label, confidence) where label is positive|neutral|negative."""
    text = (text or "").strip()
    if not text:
        return "neutral", 0.0

    if settings.use_azure_ai_language:
        return _classify_azure(text)

    result = _get_pipeline()(text[:512])[0]  # DistilBERT truncates ~512 tokens anyway
    label = _LABEL_MAP.get(result["label"].upper(), "neutral")
    score = float(result["score"])

    # The SST-2 checkpoint only outputs positive/negative. Treat low-confidence
    # calls as neutral so the dashboard isn't artificially polarized.
    if score < 0.6:
        label = "neutral"
    return label, score


def _classify_azure(text: str) -> tuple[str, float]:
    from azure.ai.textanalytics import TextAnalyticsClient
    from azure.core.credentials import AzureKeyCredential

    client = TextAnalyticsClient(
        endpoint=settings.azure_language_endpoint,
        credential=AzureKeyCredential(settings.azure_language_key),
    )
    result = client.analyze_sentiment([text])[0]
    label = result.sentiment  # 'positive' | 'neutral' | 'negative' | 'mixed'
    score = max(
        result.confidence_scores.positive,
        result.confidence_scores.neutral,
        result.confidence_scores.negative,
    )
    if label == "mixed":
        label = "neutral"
    return label, float(score)
