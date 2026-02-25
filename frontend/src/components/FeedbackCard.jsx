import { useEffect, useState } from 'react';

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    let start = 0;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{display}{suffix}</>;
}

export default function FeedbackCard({ feedback }) {
  if (!feedback) return null;

  return (
    <div
      className="glass rounded-2xl p-6 space-y-5 animate-fade-in-up"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 50, 0.7), rgba(20, 25, 60, 0.5))',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
            />
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#34d399' }}
            >
              What you did well
            </h3>
          </div>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li
                key={i}
                className="text-sm flex gap-2.5 items-start animate-fade-in-up fill-backwards"
                style={{ animationDelay: `${i * 80}ms`, color: '#cbd5e1' }}
              >
                <span
                  className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
                >
                  ✓
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Divider */}
      {feedback.micro_skill && (
        <div
          className="h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent)',
          }}
        />
      )}

      {/* Micro-skill */}
      {feedback.micro_skill && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
            />
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#fbbf24' }}
            >
              One thing to practice
            </h3>
          </div>
          <p className="text-sm" style={{ color: '#cbd5e1' }}>{feedback.micro_skill}</p>
        </div>
      )}

      {/* Model answer */}
      {feedback.model_answer && (
        <>
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent)',
            }}
          />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
              />
              <h3
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#a78bfa' }}
              >
                How a leader might say it
              </h3>
            </div>
            <p
              className="text-sm italic leading-relaxed pl-4"
              style={{
                color: '#cbd5e1',
                borderLeft: '2px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              &ldquo;{feedback.model_answer}&rdquo;
            </p>
          </div>
        </>
      )}

      {/* Metrics */}
      {(feedback.hedging_count !== undefined || feedback.filler_count !== undefined || feedback.conciseness_score !== undefined || feedback.recommendation_first !== undefined) && (
        <>
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent)',
            }}
          />
          <div className="grid grid-cols-4 gap-3 pt-1">
            {feedback.hedging_count !== undefined && (
              <div className="text-center">
                <div
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  <AnimatedNumber value={feedback.hedging_count} />
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#64748b' }}>Hedging</div>
              </div>
            )}
            {feedback.filler_count !== undefined && (
              <div className="text-center">
                <div
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  <AnimatedNumber value={feedback.filler_count} />
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#64748b' }}>Fillers</div>
              </div>
            )}
            {feedback.conciseness_score !== undefined && (
              <div className="text-center">
                <div
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  <AnimatedNumber value={feedback.conciseness_score} suffix="/10" />
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#64748b' }}>Concise</div>
              </div>
            )}
            {feedback.recommendation_first !== undefined && (
              <div className="text-center">
                <div
                  className="text-xl font-bold"
                  style={{
                    color: feedback.recommendation_first ? '#34d399' : '#f87171',
                  }}
                >
                  {feedback.recommendation_first ? '✓' : '✗'}
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#64748b' }}>Led w/ rec</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
