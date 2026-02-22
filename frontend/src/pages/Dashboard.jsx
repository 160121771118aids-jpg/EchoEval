import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import StreakBadge from '../components/StreakBadge';
import FeedbackCard from '../components/FeedbackCard';
import EvaluationCard from '../components/EvaluationCard';

function StatCard({ value, label, gradient, delay }) {
  return (
    <div
      className="gradient-border rounded-2xl p-5 text-center animate-fade-in-up fill-backwards"
      style={{
        animationDelay: `${delay}ms`,
        background: 'var(--bg-elevated)',
      }}
    >
      <div
        className="text-3xl font-bold"
        style={{
          background: gradient,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider mt-2 font-medium" style={{ color: '#475569' }}>
        {label}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setDashboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const viewSession = async (sessionId) => {
    setSelectedSession(sessionId);
    try {
      const data = await api.getSession(sessionId);
      setSessionDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="premium-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient background */}
      <div className="ambient-bg" />

      <div className="relative z-10">
        {/* Header */}
        <nav
          className="flex items-center justify-between px-8 py-4 animate-fade-in"
          style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.08)' }}
        >
          <Link to="/" className="text-lg font-bold tracking-tight gradient-text">EchoEval</Link>
          <div className="flex items-center gap-4">
            <Link to="/coach" className="btn-primary text-sm !px-5 !py-2">
              Practice
            </Link>
            <button
              onClick={logout}
              className="text-sm transition-colors duration-300"
              style={{ color: '#475569' }}
              onMouseEnter={(e) => e.target.style.color = '#e2e8f0'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}
            >
              Log out
            </button>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          {/* Welcome + Streak */}
          <div className="flex items-center justify-between animate-fade-in-up">
            <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>
              Hey, <span className="font-serif-accent italic gradient-text">{user?.first_name || 'there'}</span>
            </h1>
            <StreakBadge count={dashboard?.current_streak || 0} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              value={dashboard?.total_sessions || 0}
              label="Total Sessions"
              gradient="linear-gradient(135deg, #a5b4fc, #6366f1)"
              delay={100}
            />
            <StatCard
              value={dashboard?.current_streak || 0}
              label="Current Streak"
              gradient="linear-gradient(135deg, #fbbf24, #f59e0b)"
              delay={200}
            />
            <StatCard
              value={dashboard?.longest_streak || 0}
              label="Best Streak"
              gradient="linear-gradient(135deg, #f87171, #ef4444)"
              delay={300}
            />
          </div>

          {/* Current Focus */}
          {dashboard?.current_micro_skill && (
            <div
              className="gradient-border rounded-2xl p-6 animate-fade-in-up fill-backwards"
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#fbbf24' }}
                >
                  Current Focus
                </h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
                {dashboard.current_micro_skill}
              </p>
            </div>
          )}

          {/* Top Strengths */}
          {dashboard?.top_strengths?.length > 0 && (
            <div
              className="gradient-border rounded-2xl p-6 animate-fade-in-up fill-backwards"
              style={{ animationDelay: '500ms' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#34d399' }}
                >
                  Your Strengths
                </h3>
              </div>
              <ul className="space-y-2.5">
                {dashboard.top_strengths.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2.5 items-start" style={{ color: '#cbd5e1' }}>
                    <span
                      className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
                    >
                      +
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Sessions */}
          <div className="animate-fade-in-up fill-backwards" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <h3
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#64748b' }}
              >
                Recent Sessions
              </h3>
            </div>
            {dashboard?.recent_sessions?.length > 0 ? (
              <div className="space-y-2">
                {dashboard.recent_sessions.map((session, i) => (
                  <button
                    key={session.id}
                    onClick={() => viewSession(session.id)}
                    className="w-full rounded-xl p-4 text-left transition-all duration-300 group"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid rgba(99, 102, 241, 0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      e.currentTarget.style.background = '#161d3a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.08)';
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                          Practice
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#334155' }}>
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                        <svg
                          className="w-4 h-4 transition-transform duration-300"
                          style={{ color: '#475569' }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-10 rounded-xl"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(99, 102, 241, 0.08)',
                }}
              >
                <p className="text-sm" style={{ color: '#475569' }}>No sessions yet.</p>
                <Link
                  to="/coach"
                  className="inline-block mt-3 text-sm font-medium"
                  style={{ color: '#818cf8' }}
                >
                  Start practicing
                </Link>
              </div>
            )}
          </div>

          {/* Session Detail Modal */}
          {selectedSession && sessionDetail && (
            <div
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
              style={{
                background: 'rgba(6, 9, 24, 0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animation: 'backdropIn 0.3s ease-out',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedSession(null);
                  setSessionDetail(null);
                }
              }}
            >
              <div
                className="glass rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6"
                style={{
                  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), 0 0 80px rgba(99, 102, 241, 0.06)',
                  animation: 'modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg" style={{ color: '#f1f5f9' }}>Session Detail</h3>
                  <button
                    onClick={() => { setSelectedSession(null); setSessionDetail(null); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#64748b',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                      e.currentTarget.style.color = '#64748b';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {sessionDetail.session?.scenario && (
                  <p className="text-sm mb-5 leading-relaxed" style={{ color: '#64748b' }}>
                    {sessionDetail.session.scenario}
                  </p>
                )}
                {sessionDetail.feedback ? (
                  <FeedbackCard feedback={sessionDetail.feedback} />
                ) : (
                  <p className="text-sm" style={{ color: '#475569' }}>
                    No feedback available for this session.
                  </p>
                )}
                <EvaluationCard evaluation={sessionDetail.evaluation} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
