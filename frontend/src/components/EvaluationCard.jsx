import { useState, useEffect } from 'react';

/* ── Animated Score Bar (0-100) ── */
function ScoreBar({ label, score, delay = 0 }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  const color =
    score >= 80 ? '#34d399' :
    score >= 60 ? '#fbbf24' :
    score >= 40 ? '#f97316' :
    '#f87171';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium capitalize" style={{ color: '#94a3b8' }}>
          {label.replace(/_/g, ' ')}
        </span>
        <span className="text-xs font-bold" style={{ color }}>{score}</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(99, 102, 241, 0.1)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Voice Metrics Section ── */
function VoiceMetricsSection({ metrics }) {
  if (!metrics) return null;

  const metricKeys = ['grammar', 'fluency', 'filler_words', 'clarity', 'pronunciation'].filter(
    (k) => metrics[k] && typeof metrics[k].score === 'number'
  );

  if (metricKeys.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
        />
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#a78bfa' }}
        >
          Voice & Communication
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {metricKeys.map((key, i) => (
          <ScoreBar key={key} label={key} score={metrics[key].score} delay={i * 100} />
        ))}
      </div>

      {/* Expandable details for each metric */}
      <div className="mt-4 space-y-3">
        {metricKeys.map((key) => {
          const m = metrics[key];
          const hasDetails = (m.positives?.length > 0) || (m.to_improve?.length > 0);
          if (!hasDetails) return null;

          return (
            <MetricDetail key={key} label={key} metric={m} />
          );
        })}
      </div>
    </div>
  );
}

/* ── Metric Detail (expandable) ── */
function MetricDetail({ label, metric }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.08)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-xs font-medium capitalize" style={{ color: '#94a3b8' }}>
          {label.replace(/_/g, ' ')} details
        </span>
        <svg
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ color: '#475569', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {metric.positives?.length > 0 && (
            <ul className="space-y-1">
              {metric.positives.map((p, i) => (
                <li key={i} className="text-xs flex gap-2 items-start" style={{ color: '#a7f3d0' }}>
                  <span className="shrink-0 mt-0.5" style={{ color: '#34d399' }}>+</span>
                  {p}
                </li>
              ))}
            </ul>
          )}
          {metric.to_improve?.length > 0 && (
            <ul className="space-y-1">
              {metric.to_improve.map((t, i) => (
                <li key={i} className="text-xs flex gap-2 items-start" style={{ color: '#fde68a' }}>
                  <span className="shrink-0 mt-0.5" style={{ color: '#fbbf24' }}>-</span>
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Topic Breakdown (accordion) ── */
function TopicBreakdown({ topic, index }) {
  const [open, setOpen] = useState(index === 0);

  const scores = topic.scores || {};
  const scoreKeys = ['structure', 'opening_impact', 'key_message_clarity', 'persuasiveness', 'confidence', 'audience_awareness']
    .filter((k) => typeof scores[k] === 'number');

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 50, 0.5), rgba(20, 25, 60, 0.3))',
        border: '1px solid rgba(99, 102, 241, 0.1)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
              color: '#818cf8',
            }}
          >
            {index + 1}
          </div>
          <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
            {topic.name}
          </span>
        </div>
        <svg
          className="w-4 h-4 transition-transform duration-200"
          style={{ color: '#475569', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 space-y-5">
          {/* Score bars in 2-col grid */}
          {scoreKeys.length > 0 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {scoreKeys.map((key, i) => (
                <ScoreBar key={key} label={key} score={scores[key]} delay={i * 80} />
              ))}
            </div>
          )}

          {/* Went well */}
          {topic.went_well?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full" style={{ background: '#34d399' }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#34d399' }}>
                  Went well
                </span>
              </div>
              <ul className="space-y-1.5">
                {topic.went_well.map((item, i) => (
                  <li key={i} className="text-xs flex gap-2 items-start" style={{ color: '#a7f3d0' }}>
                    <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]"
                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* To improve */}
          {topic.to_improve?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full" style={{ background: '#fbbf24' }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#fbbf24' }}>
                  To improve
                </span>
              </div>
              <ul className="space-y-1.5">
                {topic.to_improve.map((item, i) => (
                  <li key={i} className="text-xs flex gap-2 items-start" style={{ color: '#fde68a' }}>
                    <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]"
                      style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missed points */}
          {topic.missed_points?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full" style={{ background: '#f87171' }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#f87171' }}>
                  Missed points
                </span>
              </div>
              <ul className="space-y-1.5">
                {topic.missed_points.map((item, i) => (
                  <li key={i} className="text-xs flex gap-2 items-start" style={{ color: '#fca5a5' }}>
                    <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]"
                      style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}>-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model rewrite */}
          {topic.rewrite && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full" style={{ background: '#a78bfa' }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>
                  Model version
                </span>
              </div>
              <p
                className="text-xs italic leading-relaxed pl-3"
                style={{
                  color: '#c4b5fd',
                  borderLeft: '2px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                &ldquo;{topic.rewrite}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main EvaluationCard ── */
export default function EvaluationCard({ evaluation }) {
  if (!evaluation) return null;

  // Failed — silently hide
  if (evaluation.status === 'failed') return null;

  // Pending / processing — show spinner
  if (evaluation.status === 'pending' || evaluation.status === 'processing') {
    return (
      <div
        className="glass rounded-2xl p-6 mt-4 animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 20, 50, 0.7), rgba(20, 25, 60, 0.5))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-full"
              style={{
                border: '2px solid rgba(99, 102, 241, 0.1)',
                borderTopColor: '#6366f1',
                animation: 'spin-slow 1s linear infinite',
              }}
            />
            <div
              className="absolute inset-1.5 rounded-full"
              style={{
                border: '2px solid rgba(139, 92, 246, 0.1)',
                borderBottomColor: '#8b5cf6',
                animation: 'spin-slow 1.5s linear infinite reverse',
              }}
            />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              Deep analysis in progress...
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              Evaluating topics, voice quality & communication skills
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div
          className="mt-4 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(99, 102, 241, 0.1)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
              animation: 'progressPulse 2s ease-in-out infinite',
              width: '60%',
            }}
          />
        </div>
        <style>{`
          @keyframes progressPulse {
            0%, 100% { width: 20%; margin-left: 0%; }
            50% { width: 60%; margin-left: 20%; }
          }
        `}</style>
      </div>
    );
  }

  // Completed — render full evaluation
  const { voice_metrics, topics } = evaluation;

  return (
    <div
      className="glass rounded-2xl p-6 mt-4 space-y-6 animate-fade-in-up"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 50, 0.7), rgba(20, 25, 60, 0.5))',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Section title */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
          }}
        >
          <svg className="w-3 h-3" style={{ color: '#818cf8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#818cf8' }}
        >
          Deep Analysis
        </h2>
      </div>

      {/* Voice metrics */}
      <VoiceMetricsSection metrics={voice_metrics} />

      {/* Divider */}
      {topics?.length > 0 && voice_metrics && (
        <div
          className="h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent)',
          }}
        />
      )}

      {/* Topic breakdowns */}
      {topics?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
            />
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#fbbf24' }}
            >
              Topic Breakdown
            </h3>
          </div>
          <div className="space-y-3">
            {topics.map((topic, i) => (
              <TopicBreakdown key={i} topic={topic} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
