import React, { useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  ArrowLeft, 
  ShieldAlert, 
  FileText, 
  ExternalLink, 
  MapPin, 
  Globe, 
  Layers, 
  Search, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Compass,
  FileCheck,
  RotateCcw,
  Loader2,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Newspaper,
  Check,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import EvidenceCard from '../components/EvidenceCard';
import EvidenceScoreGauge from '../components/EvidenceScoreGauge';
import VerificationPipelineModal from '../components/VerificationPipelineModal';
import { searchEvidence } from '../services/api';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve submitted payload from navigation state (if available)
  const submission = location.state || null;

  // State from submission
  const headline = submission?.headline || null;
  const newsText = submission?.newsText || '';
  const newsUrl = submission?.newsUrl || '';
  const jurisdiction = submission?.jurisdiction || 'Central Government / India';
  const language = submission?.language || 'English';
  const submittedAt = submission?.submittedAt 
    ? new Date(submission.submittedAt).toLocaleString() 
    : null;

  // Evidence state
  const [data, setData] = useState(submission || {});
  const [evidenceItems, setEvidenceItems] = useState(submission?.evidenceResults || submission?.results || []);
  const [evidenceTotal, setEvidenceTotal] = useState(submission?.evidenceTotal || submission?.total_found || 0);
  const [evidenceCount, setEvidenceCount] = useState(submission?.evidenceCount || submission?.results_count || 0);
  const [providerTookMs, setProviderTookMs] = useState(submission?.providerTookMs || submission?.took_ms || null);
  const [evidenceError, setEvidenceError] = useState(submission?.evidenceError || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Authoritative sources mapped by jurisdiction
  const jurisdictionSourcesMap = {
    'Central Government / India': [
      { name: 'Press Information Bureau (PIB)', url: 'https://pib.gov.in', type: 'Official Bureau' },
      { name: 'The Gazette of India', url: 'https://egazette.gov.in', type: 'Official Gazette' },
      { name: 'National Portal of India', url: 'https://india.gov.in', type: 'Central Portal' },
    ],
    'Andhra Pradesh': [
      { name: 'Information & Public Relations (GoAP)', url: 'https://ipr.ap.gov.in', type: 'State Bureau' },
      { name: 'Government of Andhra Pradesh Portal', url: 'https://ap.gov.in', type: 'State Portal' },
    ],
    'Telangana': [
      { name: 'Digital Media Wing (GoTS)', url: 'https://digitalmedia.telangana.gov.in', type: 'State Bureau' },
      { name: 'Government of Telangana Portal', url: 'https://telangana.gov.in', type: 'State Portal' },
    ],
    'Tamil Nadu': [
      { name: 'DIPR Tamil Nadu', url: 'https://dipr.tn.gov.in', type: 'State Bureau' },
      { name: 'Government of Tamil Nadu Portal', url: 'https://tn.gov.in', type: 'State Portal' },
    ],
    'Andaman & Nicobar Islands': [
      { name: 'Andaman & Nicobar Administration', url: 'https://andaman.gov.in', type: 'UT Portal' },
    ],
    'Jammu & Kashmir': [
      { name: 'DIPR Jammu & Kashmir', url: 'https://dipr.jk.gov.in', type: 'UT Bureau' },
    ],
  };

  const relevantSources = jurisdictionSourcesMap[jurisdiction] || jurisdictionSourcesMap['Central Government / India'];

  // Handle re-fetching evidence directly
  const handleRefreshEvidence = async () => {
    if (!headline || isRefreshing) return;
    setIsRefreshing(true);
    setEvidenceError(null);

    const langCode = language.toLowerCase().includes('telugu') ? 'te' : language.toLowerCase().includes('tamil') ? 'ta' : 'en';

    const result = await searchEvidence({
      claim: headline,
      jurisdiction,
      language: langCode,
      country: 'IN',
      size: 15,
    });

    setIsRefreshing(false);
    if (result.success) {
      setData(result.data);
      setEvidenceItems(result.data.results || []);
      setEvidenceTotal(result.data.total_found || 0);
      setEvidenceCount(result.data.results_count || 0);
      setProviderTookMs(result.data.took_ms);
      setEvidenceError(null);
    } else {
      setEvidenceError(result.error);
    }
  };

  // Empty state: accessed directly without submission
  if (!headline) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 sm:p-12 text-center space-y-5 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-xl font-bold text-white">
              No Claim Submitted for Verification
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit a headline or article URL through the verification console to generate a structured evidence evaluation.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/#verify-workspace')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Go to Verification Console</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract structured verification response fields from state
  const verdict = data.verdict || submission?.verdict || 'INSUFFICIENT';
  const verdictLabel = data.verdict_label || submission?.verdict_label || 'INFORMATION CANNOT BE VERIFIED';
  const evidenceScore = data.evidence_score !== undefined ? data.evidence_score : submission?.evidence_score;
  const evidenceStrength = data.evidence_strength || submission?.evidence_strength || 'Insufficient Evidence';
  const summary = data.summary || submission?.summary || 'Reliable evidence was not sufficient to determine whether this statement is correct.';
  const scoreFactors = data.score_factors || submission?.score_factors || [];
  const facts = data.facts || submission?.facts || [];
  const misleadingBreakdown = data.misleading_breakdown || submission?.misleading_breakdown || null;
  const officialSources = data.official_sources || submission?.official_sources || [];
  const trustedNewsSources = data.trusted_news_sources || submission?.trusted_news_sources || [];
  const factChecks = data.fact_checks || submission?.fact_checks || [];
  const claimBreakdown = data.claim_breakdown || submission?.claim_breakdown || [];
  const evidenceMatrix = data.evidence_matrix || submission?.evidence_matrix || [];

  // Verdict Theme Styles
  let verdictStyle = {
    bg: 'bg-slate-900 border-slate-700 text-slate-100',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: QuestionIcon,
    iconColor: 'text-slate-400',
    headingColor: 'text-slate-300',
    primaryText: '✓ INFORMATION APPEARS CORRECT',
  };

  if (verdict === 'SUPPORTED') {
    verdictStyle = {
      bg: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      headingColor: 'text-emerald-400',
      primaryText: '✓ INFORMATION APPEARS CORRECT',
    };
  } else if (verdict === 'CONTRADICTED') {
    verdictStyle = {
      bg: 'bg-rose-950/40 border-rose-800/80 text-rose-100',
      badge: 'bg-rose-950 text-rose-300 border-rose-800',
      icon: XCircle,
      iconColor: 'text-rose-400',
      headingColor: 'text-rose-400',
      primaryText: '✕ INFORMATION IS INCORRECT',
    };
  } else if (verdict === 'MISLEADING') {
    verdictStyle = {
      bg: 'bg-amber-950/40 border-amber-800/80 text-amber-100',
      badge: 'bg-amber-950 text-amber-300 border-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      headingColor: 'text-amber-400',
      primaryText: '⚠ INFORMATION IS MISLEADING / PARTIALLY CORRECT',
    };
  } else {
    verdictStyle = {
      bg: 'bg-slate-900 border-slate-800 text-slate-200',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      icon: QuestionIcon,
      iconColor: 'text-sky-400',
      headingColor: 'text-sky-400',
      primaryText: '? INFORMATION CANNOT BE VERIFIED',
    };
  }

  const VerdictIcon = verdictStyle.icon;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <VerificationPipelineModal isOpen={isRefreshing} claim={headline} jurisdiction={jurisdiction} />

      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Verification Console</span>
          </NavLink>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-sky-400" />
            <span>TRUTHLENS VERIFICATION RESULT</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshEvidence}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Re-run evidence search"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isRefreshing ? 'Re-evaluating...' : 'Refresh Evidence'}</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white transition-colors cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Check Another Claim</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* 1. MAIN VERIFICATION RESULT & SCORE HEADER BLOCK   */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Main Result Card (2 Cols) */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 sm:p-8 space-y-6 shadow-xl flex flex-col justify-between ${verdictStyle.bg}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                Primary Assessment Result
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${verdictStyle.badge}`}>
                {jurisdiction}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-slate-950/60 border border-slate-800 ${verdictStyle.iconColor} flex-shrink-0 mt-1`}>
                <VerdictIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${verdictStyle.headingColor}`}>
                  {verdictStyle.primaryText}
                </h2>
                <p className="text-xs text-slate-300 font-mono">
                  Verdict Code: <span className="font-semibold">{verdict}</span> &bull; Status: {verdictLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Factual Summary Section (Immediately Below Main Result) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-semibold text-slate-200 block flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Assessment Summary</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>

        {/* 2. EVIDENCE SUPPORT SCORE GAUGE (1 Col) */}
        <EvidenceScoreGauge
          score={evidenceScore}
          strength={evidenceStrength}
          scoreFactors={scoreFactors}
        />
      </div>

      {/* Submitted Claim Query Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Submitted Statement</span>
          </h2>
          {submittedAt && (
            <span className="text-[11px] font-mono text-slate-400">
              Submitted: {submittedAt}
            </span>
          )}
        </div>
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-sm font-medium text-white leading-relaxed">
          "{headline}"
        </div>
        {newsUrl && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <span>Reference URL:</span>
            <a
              href={newsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1 break-all"
            >
              <span>{newsUrl}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 4, 5, 6. VERDICT SPECIFIC FACTUAL POINTS SECTION   */}
      {/* ================================================== */}
      {verdict === 'SUPPORTED' && (
        <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>WHAT THE EVIDENCE SHOWS</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400/80">
              {facts.length} Evidence-Backed Points
            </span>
          </div>

          <div className="space-y-3">
            {facts.map((pt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3.5"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="space-y-1.5 flex-grow">
                  <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                    {pt.text}
                  </p>
                  {pt.sources && pt.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Sources:</span>
                      {pt.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-emerald-400"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {verdict === 'CONTRADICTED' && (
        <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>WHAT IS ACTUALLY KNOWN</span>
            </h2>
            <span className="text-xs font-mono text-rose-400/80">
              Corrective Factual Points
            </span>
          </div>

          <div className="space-y-3">
            {facts.map((pt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3.5"
              >
                <div className="w-6 h-6 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="space-y-1.5 flex-grow">
                  <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                    {pt.text}
                  </p>
                  {pt.sources && pt.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Sources:</span>
                      {pt.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-rose-400"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {verdict === 'MISLEADING' && (
        <div className="bg-slate-900 border border-amber-900/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>MISLEADING CLAIM ANALYSIS</span>
            </h2>
            <span className="text-xs font-mono text-amber-400/80">
              Detailed Breakdown
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. CLAIMED */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                📌 CLAIMED
              </span>
              <p className="text-slate-200 leading-relaxed">
                {misleadingBreakdown?.claimed || headline}
              </p>
            </div>

            {/* 2. SUPPORTED PART */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                ✅ SUPPORTED PART
              </span>
              <p className="text-slate-200 leading-relaxed">
                {misleadingBreakdown?.supported_part || "Certain background entities or context mentioned in the statement are accurate."}
              </p>
            </div>

            {/* 3. MISLEADING PART */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-rose-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                ⚠️ MISLEADING PART
              </span>
              <p className="text-slate-200 leading-relaxed">
                {misleadingBreakdown?.misleading_part || "Key assertions regarding official announcements, dates, or figures are exaggerated or incorrect."}
              </p>
            </div>

            {/* 4. ACTUAL INFORMATION */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-sky-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                💡 ACTUAL INFORMATION
              </span>
              <p className="text-slate-200 leading-relaxed">
                {misleadingBreakdown?.actual_information || "Reliable sources establish what actually occurred."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 8. OFFICIAL SOURCE SECTION                         */}
      {/* ================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>OFFICIAL EVIDENCE</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Authoritative government portals and press bureaus for {jurisdiction}
            </p>
          </div>
          <span className="text-xs font-mono text-sky-400 bg-sky-950 px-2.5 py-1 rounded border border-sky-800">
            Jurisdiction Mapped
          </span>
        </div>

        {officialSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialSources.map((off, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white block">
                    {off.name}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    off.relationship === 'SUPPORTS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    {off.relationship}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium line-clamp-2">
                  {off.title}
                </p>
                {off.snippet && (
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    "{off.snippet}"
                  </p>
                )}
                <div className="pt-1 flex items-center justify-between border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-500 font-mono">Official Authority</span>
                  <a
                    href={off.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Open Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              No specific official gazette document was returned in search results for this exact query. Below are the designated official reference portals for <span className="text-white font-medium">{jurisdiction}</span>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relevantSources.map((src) => (
                <div key={src.name} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-semibold text-slate-200 block">{src.name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{src.type}</span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 pt-1"
                  >
                    <span>Visit Authority</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 7. TRUSTED SOURCE ARTICLES SECTION                 */}
      {/* ================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-sky-400" />
              <span>TRUSTED SOURCES</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Corroborating reporting from established national &amp; international news organizations
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {trustedNewsSources.length} Articles Identified
          </span>
        </div>

        {trustedNewsSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trustedNewsSources.map((news, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 block">
                      {news.publisher}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                      news.relationship === 'SUPPORTS'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : news.relationship === 'CONTRADICTS'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {news.relationship === 'SUPPORTS' ? '✓ SUPPORTS CLAIM' : news.relationship === 'CONTRADICTS' ? '✕ CONTRADICTS CLAIM' : news.relationship}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white leading-snug">
                    {news.title}
                  </h3>

                  {news.snippet && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      "{news.snippet}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-400">
                    {news.published_at ? new Date(news.published_at).toLocaleDateString() : 'Verified Corpus'}
                  </span>
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 hover:text-white font-medium text-xs border border-sky-800 transition-colors"
                  >
                    <span>Open Article</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-2">
            <p className="text-xs text-slate-400">
              No direct matches from major international news partners were found in the current 30-day index for this exact claim string.
            </p>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 9. GOOGLE FACT CHECK SECTION                       */}
      {/* ================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-sky-400" />
              <span>EXISTING FACT CHECKS</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              ClaimReview repository search via Google Fact Check Tools API
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            FactCheck Index
          </span>
        </div>

        {factChecks.length > 0 ? (
          <div className="space-y-3">
            {factChecks.map((fc, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">{fc.publisher}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[10px]">
                      Rating: {fc.rating}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium">"{fc.claim_reviewed}"</p>
                </div>
                {fc.url && (
                  <a
                    href={fc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium flex-shrink-0"
                  >
                    <span>Read Fact Check</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 block flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span>No matching existing fact-check was found.</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              Note: The absence of a prior fact-check by independent fact-checking organizations does not mean the claim is true or false. TruthLens evaluates retrieved primary evidence directly.
            </p>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 11. CLAIM DECOMPOSITION SECTION                    */}
      {/* ================================================== */}
      {claimBreakdown.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>CLAIM BREAKDOWN</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Multi-clause decomposition &amp; independent stance evaluation
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {claimBreakdown.length} Clauses Identified
            </span>
          </div>

          <div className="space-y-4">
            {claimBreakdown.map((cb, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-300 uppercase font-mono text-[11px]">
                    Claim Clause {idx + 1}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded font-mono font-semibold border ${
                    cb.verdict === 'SUPPORTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    cb.verdict === 'CONTRADICTED' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {cb.verdict_label} {cb.evidence_score ? `(${cb.evidence_score}/100)` : ''}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">"{cb.claim}"</p>
                {cb.key_sources && cb.key_sources.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                    <span>Corroboration:</span>
                    <span className="text-slate-300 font-mono">{cb.key_sources.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 10. EVIDENCE MATRIX TABLE                          */}
      {/* ================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-md overflow-x-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>EVIDENCE MATRIX</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Structured relationship &amp; authority mapping matrix
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {evidenceMatrix.length} Rows
          </span>
        </div>

        {evidenceMatrix.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-3">Source Domain</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Relationship</th>
                <th className="py-3 px-3">Relevance</th>
                <th className="py-3 px-3">Evidence Headline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {evidenceMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-950/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-sky-400">{row.source}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{row.source_type}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${
                      row.relationship === 'SUPPORTS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      row.relationship === 'CONTRADICTS' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {row.relationship}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{row.relevance}</td>
                  <td className="py-3 px-3">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-sky-300 transition-colors line-clamp-1 flex items-center gap-1"
                    >
                      <span>{row.title}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-400 italic">No evidence matrix rows generated.</p>
        )}
      </div>

      {/* Raw Retrieved Evidence Items Cards List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-sky-400" />
            <span>Retrieved Evidence Records</span>
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {evidenceItems.length} Candidates
          </span>
        </div>

        {evidenceItems.length > 0 ? (
          <div className="space-y-4">
            {evidenceItems.map((item) => (
              <EvidenceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EvidenceCard isEmptyState={true} emptyMessage="No relevant evidence candidate articles found." />
        )}
      </div>

      {/* ================================================== */}
      {/* 15. VERIFICATION METHODOLOGY SECTION              */}
      {/* ================================================== */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 text-xs text-slate-400 shadow-sm">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <ShieldAlert className="w-4 h-4 text-sky-400" />
          <span>VERIFICATION METHODOLOGY &amp; INTEGRITY GUARANTEE</span>
        </div>
        <p className="leading-relaxed text-slate-300">
          TruthLens evaluates user claims by comparing assertions against primary empirical evidence from official state portals, gazettes, internationally recognized news organizations, and Google Fact Check records.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-[11px]">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200 block">🏛 Official Authorities</span>
            <span>Direct grounding against PIB, Gazette of India, and State DIPR portals.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200 block">📰 Independent Reporting</span>
            <span>Corroboration from Reuters, Associated Press, BBC, and The Hindu.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200 block">🧾 ClaimReview Fact Checks</span>
            <span>Structured lookup across global fact-checking organization archives.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200 block">📊 Deterministic Scoring</span>
            <span>Explainable evidence support scoring without ungrounded LLM opinion.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
