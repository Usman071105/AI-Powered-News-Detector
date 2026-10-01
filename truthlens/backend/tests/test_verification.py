import unittest
from app.services.verification_engine import VerificationEngine
from app.schemas.evidence import NormalizedEvidenceItem

class TestVerificationEngine(unittest.TestCase):

    def setUp(self):
        self.engine = VerificationEngine()

    def test_high_stakes_false_death_rumor(self):
        """Test that high-stakes rumors (e.g. 'Rahul Gandhi is killed') are NOT marked as SUPPORTED

        even when search results return generic news articles containing the person's name.
        """
        claim = "Rahul Gandhi is killed"
        
        # Generic news articles mentioning the person's name, but NOT reporting a death
        evidence_items = [
            NormalizedEvidenceItem(
                id="1",
                title="Rahul Gandhi addresses rally in Wayanad",
                publisher="The Hindu",
                source_url="https://www.thehindu.com/news/national/rahul-gandhi-addresses-rally/article12345.ece",
                description="Rahul Gandhi spoke about election strategies during a public meeting in Wayanad.",
                source_type="news",
                provider="free_news_api",
                retrieval_timestamp="2026-10-01T00:00:00Z"
            ),
            NormalizedEvidenceItem(
                id="2",
                title="Rahul Gandhi speaks in Lok Sabha on budget discussion",
                publisher="Indian Express",
                source_url="https://indianexpress.com/article/india/rahul-gandhi-lok-sabha-speech-67890/",
                description="Congress leader Rahul Gandhi participated in parliamentary debate on economic policies.",
                source_type="news",
                provider="free_news_api",
                retrieval_timestamp="2026-10-01T00:00:00Z"
            )
        ]
        
        result = self.engine.analyze(claim=claim, jurisdiction="Central Government / India", evidence_items=evidence_items)
        
        self.assertNotEqual(result["verdict"], "SUPPORTED", f"Death rumor must NOT be marked SUPPORTED! Got: {result['verdict']}")
        self.assertIn(result["verdict"], ["INSUFFICIENT", "CONTRADICTED"])
        self.assertTrue("UNVERIFIED" in result["verdict_label"] or "INCORRECT" in result["verdict_label"])
        self.assertGreaterEqual(len(result["facts"]), 5, "Should provide 5-8 informative factual points explaining the verdict.")

    def test_verified_news_claim(self):
        """Test that genuine verified news claims are correctly marked as SUPPORTED."""
        claim = "ISRO Chandrayaan-3 successfully landed on lunar south pole on August 23"
        
        evidence_items = [
            NormalizedEvidenceItem(
                id="1",
                title="Chandrayaan-3 Vikram lander makes historic landing near Moon south pole",
                publisher="The Hindu",
                source_url="https://www.thehindu.com/sci-tech/science/chandrayaan-3-landing-success/article111.ece",
                description="ISRO announced the successful soft landing of Chandrayaan-3 near the lunar south pole.",
                source_type="official",
                provider="free_news_api",
                retrieval_timestamp="2026-10-01T00:00:00Z"
            ),
            NormalizedEvidenceItem(
                id="2",
                title="India becomes first nation to land near lunar south pole with Chandrayaan-3",
                publisher="Reuters",
                source_url="https://www.reuters.com/technology/space/india-chandrayaan-3-moon-landing-2023-08-23/",
                description="India's space agency ISRO confirmed Vikram lander successfully touched down.",
                source_type="news",
                provider="free_news_api",
                retrieval_timestamp="2026-10-01T00:00:00Z"
            )
        ]
        
        result = self.engine.analyze(claim=claim, jurisdiction="Central Government / India", evidence_items=evidence_items)
        
        self.assertEqual(result["verdict"], "SUPPORTED")
        self.assertGreaterEqual(result["evidence_score"], 80)

    def test_false_cash_handout_claim(self):
        """Test that unverified cash transfer claims are correctly marked as CONTRADICTED."""
        claim = "Government announces ₹15,000 cash transfer to all citizens"
        
        result = self.engine.analyze(claim=claim, jurisdiction="Central Government / India", evidence_items=[])
        
        self.assertEqual(result["verdict"], "CONTRADICTED")
        self.assertLessEqual(result["evidence_score"], 20)

    def test_empty_evidence_claim(self):
        """Test that claims with zero matching articles return INSUFFICIENT with clear warning."""
        claim = "Random unverified local announcement 998811"
        
        result = self.engine.analyze(claim=claim, jurisdiction="Central Government / India", evidence_items=[])
        
        self.assertEqual(result["verdict"], "INSUFFICIENT")
        self.assertIn("UNVERIFIED", result["verdict_label"])

if __name__ == '__main__':
    unittest.main()
