import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  FileCheck, 
  Building2, 
  Newspaper, 
  GitCompare, 
  BarChart3, 
  CheckCircle2,
  Loader2 
} from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, label: 'Extracting core claim & entities', icon: Search },
  { id: 2, label: 'Detecting jurisdiction & language filters', icon: Globe },
  { id: 3, label: 'Checking existing fact-checks (ClaimReview)', icon: FileCheck },
  { id: 4, label: 'Querying official government registries', icon: Building2 },
  { id: 5, label: 'Searching trusted news search index', icon: Newspaper },
  { id: 6, label: 'Comparing evidence & NLI inference', icon: GitCompare },
  { id: 7, label: 'Calculating evidence support score', icon: BarChart3 },
];

export default function VerificationPipelineModal({ isOpen, claim, jurisdiction }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < PIPELINE_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-400 text-xs font-mono font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>TRUTHLENS VERIFICATION PIPELINE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Verifying Claim Against Evidence
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto line-clamp-2 italic">
            "{claim}"
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                  isCurrent
                    ? 'text-sky-300 font-semibold translate-x-1'
                    : isCompleted
                    ? 'text-slate-400 font-medium'
                    : 'text-slate-600'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : isCurrent
                    ? 'bg-sky-900 text-sky-400 border border-sky-600 animate-pulse'
                    : 'bg-slate-900 text-slate-700 border border-slate-800'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>

                <span className="flex-grow">{step.label}</span>

                {isCompleted && (
                  <span className="text-[10px] font-mono text-emerald-400">DONE</span>
                )}
                {isCurrent && (
                  <span className="text-[10px] font-mono text-sky-400 animate-pulse">RUNNING...</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center text-[11px] text-slate-400 font-mono">
          Jurisdiction: <span className="text-slate-300">{jurisdiction || 'Central Government / India'}</span>
        </div>
      </div>
    </div>
  );
}
