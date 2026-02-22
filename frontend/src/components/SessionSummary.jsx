import { useEffect, useState } from 'react';
import FeedbackCard from './FeedbackCard';

function Sparkle({ delay, left, size }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        top: '20%',
        background: 'rgba(129, 140, 248, 0.6)',
        animation: `confettiDrift 2s ease-out ${delay}s infinite`,
      }}
    />
  );
}

export default function SessionSummary({ session, feedback, onContinue, continueLabel }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="space-y-6 relative"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Celebration sparkles */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <Sparkle
            key={i}
            delay={i * 0.2}
            left={10 + i * 11}
            size={3 + (i % 3) * 2}
          />
        ))}
      </div>

      <div className="text-center pt-2">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)',
          }}
        >
          <svg className="w-7 h-7" style={{ color: '#818cf8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{
            background: 'linear-gradient(135deg, #e2e8f0, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Session Complete
        </h2>
        {session?.scenario && (
          <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748b' }}>
            {session.scenario}
          </p>
        )}
      </div>

      <FeedbackCard feedback={feedback} />

      {onContinue && (
        <button
          onClick={onContinue}
          className="w-full btn-primary py-3.5 rounded-xl text-sm font-medium"
        >
          {continueLabel || 'Try another situation'}
        </button>
      )}
    </div>
  );
}
