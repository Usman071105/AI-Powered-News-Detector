import logging
import time
from typing import List
from urllib.parse import urlparse

from app.schemas.evidence import (
    EvidenceSearchRequest,
    EvidenceSearchResponse,
    NormalizedEvidenceItem,
)
from app.services.providers.free_news_api import FreeNewsProvider, FreeNewsAPIError
from app.services.providers.google_fact_check import GoogleFactCheckProvider
from app.services.verification_engine import VerificationEngine

logger = logging.getLogger("truthlens.services.orchestrator")


class EvidenceOrchestrator:
    """Coordinates evidence retrieval and verification analysis across configured providers.

    Queries:
    - Free News API for news search candidates
    - Google Fact Check Tools API for existing fact checks
    - Verification Engine for deterministic NLI stance, evidence scoring, and factual points
    """

    def __init__(
        self,
        free_news_provider: FreeNewsProvider = None,
        google_fact_check_provider: GoogleFactCheckProvider = None,
        verification_engine: VerificationEngine = None,
    ):
        self.free_news_provider = free_news_provider or FreeNewsProvider()
        self.google_fact_check_provider = google_fact_check_provider or GoogleFactCheckProvider()
        self.verification_engine = verification_engine or VerificationEngine()

    async def search(self, request: EvidenceSearchRequest) -> EvidenceSearchResponse:
        """Search evidence candidates and run verification analysis for a claim."""
        start_time = time.time()
        safe_claim_preview = request.claim[:60] + "..." if len(request.claim) > 60 else request.claim
        jurisdiction = request.jurisdiction or "Central Government / India"

        logger.info(
            "[Orchestrator] Starting evidence search & verification: query='%s' jurisdiction='%s' country='%s' lang='%s'",
            safe_claim_preview,
            jurisdiction,
            request.country,
            request.language,
        )

        # 1. Fetch news articles from Free News API
        provider_data = await self.free_news_provider.search(
            claim=request.claim,
            country=request.country,
            language=request.language,
            date=request.date,
            size=request.size or 15,
        )

        raw_items: List[NormalizedEvidenceItem] = provider_data.get("items", [])
        deduped_items = self._deduplicate_items(raw_items)

        # 2. Fetch Google Fact Check API results if available
        fact_check_api_results = await self.google_fact_check_provider.search_fact_checks(
            claim=request.claim,
            language_code=request.language or "en"
        )

        # 3. Run Verification Engine Analysis
        analysis = self.verification_engine.analyze(
            claim=request.claim,
            jurisdiction=jurisdiction,
            evidence_items=deduped_items,
            fact_check_api_results=fact_check_api_results
        )

        took_ms = int((time.time() - start_time) * 1000)

        warning = None
        if not deduped_items:
            warning = "No matching evidence documents found for this query in the active 30-day news index."

        return EvidenceSearchResponse(
            claim=request.claim,
            jurisdiction=jurisdiction,
            country=request.country,
            language=request.language,
            total_found=provider_data.get("total", len(deduped_items)),
            results_count=len(deduped_items),
            provider="free_news_api",
            took_ms=took_ms,
            verdict=analysis["verdict"],
            verdict_label=analysis["verdict_label"],
            evidence_score=analysis["evidence_score"],
            evidence_strength=analysis["evidence_strength"],
            summary=analysis["summary"],
            score_factors=analysis["score_factors"],
            facts=analysis["facts"],
            misleading_breakdown=analysis["misleading_breakdown"],
            official_sources=analysis["official_sources"],
            trusted_news_sources=analysis["trusted_news_sources"],
            fact_checks=analysis["fact_checks"],
            claim_breakdown=analysis["claim_breakdown"],
            evidence_matrix=analysis["evidence_matrix"],
            results=analysis["processed_items"],
            warning=warning,
        )

    @staticmethod
    def _deduplicate_items(items: List[NormalizedEvidenceItem]) -> List[NormalizedEvidenceItem]:
        """Perform deterministic deduplication using canonical URL and/or article ID."""
        seen_keys = set()
        deduped = []

        for item in items:
            canonical_key = None
            if item.source_url:
                try:
                    parsed = urlparse(item.source_url)
                    clean_path = parsed.path.rstrip("/")
                    canonical_key = f"{parsed.netloc.lower()}{clean_path}"
                except Exception:
                    canonical_key = item.source_url.strip().lower()

            if not canonical_key:
                canonical_key = item.id or f"{item.title.strip().lower()}::{item.publisher or ''}"

            if canonical_key not in seen_keys:
                seen_keys.add(canonical_key)
                deduped.append(item)

        return deduped
