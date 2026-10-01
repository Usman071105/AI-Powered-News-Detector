import os
import logging
from typing import List, Dict, Any, Optional
import httpx

logger = logging.getLogger("truthlens.providers.google_fact_check")

GOOGLE_FACTCHECK_API_KEY = os.getenv("GOOGLE_FACTCHECK_API_KEY", "")
GOOGLE_FACTCHECK_BASE_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"


class GoogleFactCheckProvider:
    """Connector for Google Fact Check Tools API (https://factchecktools.googleapis.com).

    Queries existing ClaimReview records when an API key is provided.
    Falls back gracefully if key is unconfigured or rate limited.
    """

    def __init__(self, api_key: str = GOOGLE_FACTCHECK_API_KEY, timeout: float = 8.0):
        self.api_key = api_key
        self.base_url = GOOGLE_FACTCHECK_BASE_URL
        self.timeout = timeout

    async def search_fact_checks(self, claim: str, language_code: str = "en") -> List[Dict[str, Any]]:
        """Query Google Fact Check API for matching ClaimReview entries."""
        if not self.api_key:
            logger.info("[GoogleFactCheck] No API key configured (GOOGLE_FACTCHECK_API_KEY). Skipping API call.")
            return []

        params = {
            "query": claim.strip()[:200],
            "languageCode": language_code,
            "key": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.base_url, params=params)

            if response.status_code == 200:
                data = response.json()
                claims = data.get("claims", [])
                results = []
                for cl in claims:
                    reviews = cl.get("claimReview", [])
                    for rev in reviews:
                        results.append({
                            "claimReviewed": cl.get("text", claim),
                            "publisher": rev.get("publisher", {}),
                            "textualRating": rev.get("textualRating", "Reviewed"),
                            "url": rev.get("url", ""),
                            "reviewDate": rev.get("reviewDate", None),
                        })
                logger.info("[GoogleFactCheck] Found %d matching fact-check reviews.", len(results))
                return results
            else:
                logger.warning("[GoogleFactCheck] API returned HTTP %d", response.status_code)
                return []

        except Exception as exc:
            logger.warning("[GoogleFactCheck] Query failed gracefully: %s", type(exc).__name__)
            return []
