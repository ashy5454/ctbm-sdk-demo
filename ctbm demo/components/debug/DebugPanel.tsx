import { ClassificationResult } from '@ctbm/core';
import { Message } from '@/lib/types';
import { ZoneBadge } from '../shared/ZoneBadge';
import { ScoreBar } from './ScoreBar';
import { SignalTag } from './SignalTag';

interface DebugPanelProps {
  currentResult: ClassificationResult | null;
  sessionHistory: Message[];
}

export function DebugPanel({ currentResult, sessionHistory }: DebugPanelProps) {
  // Calculate stats
  const stats = sessionHistory.reduce(
    (acc, msg) => {
      if (msg.role === 'user') {
        acc[msg.zone]++;
      }
      return acc;
    },
    { protected: 0, neutral: 0, commerce: 0 }
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          CTBM Classifier
          <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
            Live Debug
          </span>
        </h2>
      </div>

      <div className="p-6 flex flex-col gap-8">
        {currentResult ? (
          <>
            {/* Section 1 - Zone Result */}
            <section className="flex flex-col items-center">
              <ZoneBadge zone={currentResult.zone} size="lg" className="w-full max-w-[240px] mb-3" />
              <div className="text-xs font-medium text-slate-500">
                Confidence: <span className="text-slate-800 font-bold">{currentResult.confidence.toFixed(2)}</span>
              </div>
            </section>

            {/* Section 2 - Zone Scores */}
            <section className="bg-white p-4 rounded-xl border shadow-sm">
              <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">Zone Scores</h3>
              <div className="flex flex-col gap-3">
                <ScoreBar label="Protected" score={currentResult.scores.protected} zoneType="protected" />
                <ScoreBar label="Neutral" score={currentResult.scores.neutral} zoneType="neutral" />
                <ScoreBar label="Commerce" score={currentResult.scores.commerce} zoneType="commerce" />
              </div>
            </section>

            {/* Section 3 - Details Grid */}
            <section className="bg-white p-4 rounded-xl border shadow-sm text-xs">
              <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">Classification Details</h3>
              <div className="grid grid-cols-[100px_1fr] gap-y-2">
                <span className="text-slate-500">Decision Layer:</span>
                <span className="font-medium capitalize">{currentResult.decisionLayer}</span>
                
                <span className="text-slate-500">Processing Time:</span>
                <span className="font-medium">{currentResult.processingMs.toFixed(0)}ms</span>
                
                <span className="text-slate-500">Trajectory Bias:</span>
                <span className="font-medium text-slate-700">
                  {currentResult.signals.some(s => s.startsWith('trajectory')) ? 'Applied' : 'Not applied'}
                </span>
              </div>
            </section>

            {/* Section 4 - Signals Detected */}
            <section>
              <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3 pl-1">Signals Detected</h3>
              {currentResult.signals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentResult.signals.slice(0, 5).map((s, i) => (
                    <SignalTag key={i} signal={s} />
                  ))}
                  {currentResult.signals.length > 5 && (
                    <div className="text-[10px] text-slate-400 flex items-center px-1">
                      +{currentResult.signals.length - 5} more
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pl-1">No strong signals detected</p>
              )}
            </section>

            {/* Section 5 - LLM Reasoning */}
            {currentResult.decisionLayer === 'llm' && (
              <section className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">LLM Reasoning</h3>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{currentResult.reasoning}"
                </p>
              </section>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl">👀</span>
            </div>
            <p className="text-sm">Send a message to see the<br/>classification engine in action.</p>
          </div>
        )}

        {/* Section 6 - Session History */}
        <section className="mt-4 border-t pt-6">
          <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-4 pl-1">Session History</h3>
          <div className="flex flex-col gap-3 pl-1">
            {sessionHistory.filter(m => m.role === 'user').map((msg, i) => (
              <div key={msg.id} className="flex items-start gap-2 group cursor-default">
                <span className="text-[10px] text-slate-300 w-4 mt-0.5">{i + 1}.</span>
                <ZoneBadge zone={msg.zone} size="sm" className="mt-1 shrink-0" />
                <span className="text-xs text-slate-600 line-clamp-1 group-hover:text-slate-900 transition-colors">
                  {msg.content}
                </span>
              </div>
            ))}
            
            {stats.protected === 0 && stats.neutral === 0 && stats.commerce === 0 && (
              <p className="text-xs text-slate-400 italic">No messages yet</p>
            )}
          </div>
          
          {(stats.protected > 0 || stats.neutral > 0 || stats.commerce > 0) && (
            <div className="mt-6 flex justify-between px-3 py-2 bg-slate-100 rounded-lg text-[10px] text-slate-500 font-medium uppercase tracking-wide">
              <span>Protected: {stats.protected}</span>
              <span>Neutral: {stats.neutral}</span>
              <span>Commerce: {stats.commerce}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
