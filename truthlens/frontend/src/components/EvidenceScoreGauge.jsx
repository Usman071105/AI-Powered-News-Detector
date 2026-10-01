import React, { useState } from 'react';
import { HelpCircle, Info, ShieldCheck, X } from 'lucide-react';

export default function EvidenceScoreGauge({ score, strength, scoreFactors = [] }) {
  const [showFactorsModal, setShowFactorsModal] = useState(false);

  const isInsufficient = score === null || score === undefined;
  const numericScore = isInsufficient ? 0 : Math.min(Math.max(score, 0), 100);

  // Determine theme colors based on score
  let strokeColor = '#38bdf8'; // sky-400
  let textColor = 'text-sky-400';
  let badgeBg = 'bg-sky-950/80 border-sky-800 text-sky-300';

  if (!isInsufficient) {
    if (numericScore >= 75) {
      strokeColor = '#10b981'; // emerald-500
      textColor = 'text-emerald-400';
      badgeBg = 'bg-emerald-950/80 border-emerald-800 text-emerald-300';
    } else if (numericScore >= 50) {
      strokeColor = '#f59e0b'; // amber-500
      textColor = 'text-amber-400';
      badgeBg = 'bg-amber-950/80 border-amber-800 text-amber-300';
    } else {
      strokeColor = '#f43f5e'; // rose-500
      textColor = 'text-rose-400';
      badgeBg = 'bg-rose-950/80 border-rose-800 text-rose-300';
    }
  } else {
    strokeColor = '#64748b'; // slate-500
    textColor = 'text-slate-400';
    badgeBg = 'bg-slate-900 border-slate-700 text-slate-400';
  }

  // SVG Donut metrics
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isInsufficient
    ? circumference
    : circumference - (numericScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg relative space-y-4">
      <div className="text-center space-y-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          EVIDENCE SUPPORT SCORE
        </span>
        <p className="text-[11px] text-slate-400 max-w-xs">
          Quantifies how strongly available evidence supports the statement
        </p>
      </div>

      {/* Circular Gauge */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#1e293b"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated score stroke */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {isInsufficient ? (
            <div className="space-y-0.5">
              <span className="text-lg font-bold text-slate-400 block">N/A</span>
              <span className="text-[10px] text-slate-400 block font-mono">Insufficient</span>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="flex items-baseline justify-center">
                <span className={`text-4xl font-black tracking-tight ${textColor}`}>
                  {numericScore}
                </span>
                <span className="text-slate-400 text-xs font-semibold ml-0.5">/100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strength Label Badge */}
      <div className="text-center space-y-2">
        <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
          {strength || (isInsufficient ? "Insufficient Evidence" : "Moderate Evidence")}
        </span>

        {/* Why this score button */}
        {scoreFactors && scoreFactors.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowFactorsModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why this score?</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal for "Why this score?" */}
      {showFactorsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Evidence Score Factors Breakdown</span>
              </div>
              <button
                onClick={() => setShowFactorsModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              TruthLens calculates this score deterministically based on source authority, multi-source agreement, and evidence alignment:
            </p>

            <div className="space-y-3">
              {scoreFactors.map((factor, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-200">{factor.factor}</span>
                    <span className={`font-mono text-[11px] ${
                      factor.impact.includes('+') ? 'text-emerald-400' : factor.impact.includes('-') ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {factor.impact}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {factor.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowFactorsModal(false)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
