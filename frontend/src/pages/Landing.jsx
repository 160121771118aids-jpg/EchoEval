import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: 'Real Scenarios',
    desc: 'Practice elevator pitches, tough feedback, stakeholder updates, and more.',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08))',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    iconColor: '#818cf8',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Instant Feedback',
    desc: 'Get coached on hedging, filler words, structure, and conciseness after every session.',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(251, 146, 60, 0.06))',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    iconColor: '#fbbf24',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
    title: 'Build the Habit',
    desc: 'Track your streak and watch your communication skills improve day by day.',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(249, 115, 22, 0.06))',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    iconColor: '#f87171',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient background */}
      <div className="ambient-bg" />
      <div className="grid-bg" />

      {/* Content */}
      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto animate-fade-in">
          <span
            className="text-xl font-bold tracking-tight gradient-text"
          >
            EchoEval
          </span>
          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="text-sm transition-colors duration-300"
              style={{ color: '#94a3b8' }}
              onMouseEnter={(e) => e.target.style.color = '#e2e8f0'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Log in
            </Link>
            <Link to="/signup" className="btn-primary text-sm !px-5 !py-2.5">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="max-w-4xl mx-auto px-8 pt-20 pb-32 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
              <span style={{ color: '#f1f5f9' }}>Speak like a </span>
              <span className="font-serif-accent italic gradient-text">leader.</span>
              <br />
              <span style={{ color: '#94a3b8' }}>Practice with </span>
              <span className="gradient-text">AI.</span>
            </h1>
          </div>

          <p
            className="mt-7 text-lg max-w-2xl mx-auto leading-relaxed animate-fade-in-up fill-backwards delay-200"
            style={{ color: '#64748b' }}
          >
            EchoEval is your private voice coach. Practice real business scenarios,
            get instant feedback on clarity, confidence, and structure — and build
            the habit of speaking with impact.
          </p>

          <div className="mt-10 flex justify-center gap-4 animate-fade-in-up fill-backwards delay-400">
            <Link to="/signup" className="btn-primary text-lg !px-10 !py-3.5">
              Start Practicing Free
            </Link>
          </div>

          {/* Social proof hint */}
          <div
            className="mt-12 flex items-center justify-center gap-3 animate-fade-in fill-backwards delay-600"
          >
            <div className="flex -space-x-2">
              {['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'].map((color, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2"
                  style={{
                    background: color,
                    borderColor: 'var(--bg-deep)',
                  }}
                />
              ))}
            </div>
            <span className="text-sm" style={{ color: '#64748b' }}>
              Trusted by professionals building better communication skills
            </span>
          </div>

          {/* Features */}
          <div className="mt-28 grid sm:grid-cols-3 gap-5 text-left">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl p-6 transition-all duration-500 animate-fade-in-up fill-backwards cursor-default"
                style={{
                  animationDelay: `${600 + i * 120}ms`,
                  background: f.gradient,
                  border: `1px solid ${f.borderColor}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.2)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    color: f.iconColor,
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: '#e2e8f0' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer
          className="text-center pb-10 text-xs"
          style={{ color: '#334155' }}
        >
          Built for professionals who want to communicate with more impact.
        </footer>
      </div>
    </div>
  );
}
