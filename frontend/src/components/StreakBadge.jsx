export default function StreakBadge({ count, label = 'day streak' }) {
  const isHot = count >= 3;

  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 transition-all duration-300"
      style={{
        background: isHot
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1))'
          : 'rgba(15, 20, 50, 0.6)',
        border: `1px solid ${isHot ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.12)'}`,
        boxShadow: isHot ? '0 0 20px rgba(245, 158, 11, 0.1)' : 'none',
      }}
    >
      <span
        className="text-lg"
        style={{
          animation: isHot ? 'flameFlicker 0.8s ease-in-out infinite' : 'none',
          display: 'inline-block',
          filter: isHot ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' : 'none',
        }}
      >
        {count > 0 ? '🔥' : '✦'}
      </span>
      <span
        className="font-bold text-lg"
        style={{
          background: isHot
            ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
            : 'linear-gradient(135deg, #a5b4fc, #818cf8)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {count}
      </span>
      <span className="text-sm" style={{ color: 'rgba(148, 163, 184, 0.7)' }}>{label}</span>
    </div>
  );
}
