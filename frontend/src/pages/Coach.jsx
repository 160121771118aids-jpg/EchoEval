import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import vapi from '../lib/vapi';
import VoiceOrb from '../components/VoiceOrb';
import SessionSummary from '../components/SessionSummary';
import EvaluationCard from '../components/EvaluationCard';
import StreakBadge from '../components/StreakBadge';
import { Link } from 'react-router-dom';

const STATES = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PROCESSING: 'processing',
  FEEDBACK: 'feedback',
};

export default function Coach() {
  const { user } = useAuth();
  const [state, setState] = useState(STATES.IDLE);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const currentSessionRef = useRef(currentSession);
  const pollCancelledRef = useRef(false);
  const evalPollCancelledRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  // Timer
  useEffect(() => {
    if (!isCallActive) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Register VAPI listeners once
  useEffect(() => {
    const onCallStart = () => setIsCallActive(true);
    const onCallEnd = () => {
      setIsCallActive(false);
      setIsSpeaking(false);
      setState(STATES.PROCESSING);

      const session = currentSessionRef.current;
      if (!session) return;

      pollCancelledRef.current = false;
      evalPollCancelledRef.current = false;
      let attempts = 0;
      const pollFeedback = async () => {
        if (pollCancelledRef.current) return;
        try {
          const data = await api.getSession(session.session_id);
          // Capture evaluation if it comes with feedback response
          if (data.evaluation) {
            setEvaluation(data.evaluation);
          }
          if (data.feedback) {
            setFeedback(data.feedback);
            setCurrentSession((prev) => ({ ...prev, session: data.session }));
            setState(STATES.FEEDBACK);
            // Start evaluation polling if not yet completed
            if (!data.evaluation || data.evaluation.status !== 'completed') {
              startEvalPolling(session.session_id);
            }
            return;
          }
        } catch { /* ignore */ }

        attempts++;
        if (attempts < 15) setTimeout(pollFeedback, 2000);
        else {
          setFeedback({
            strengths: ['You showed up and practiced — that counts!'],
            micro_skill: 'Keep practicing and your feedback will appear here.',
          });
          setState(STATES.FEEDBACK);
          startEvalPolling(session.session_id);
        }
      };
      setTimeout(pollFeedback, 3000);
    };
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);

    return () => {
      pollCancelledRef.current = true;
      evalPollCancelledRef.current = true;
      vapi.removeAllListeners();
    };
  }, []);

  // Evaluation polling function
  const startEvalPolling = (sessionId) => {
    evalPollCancelledRef.current = false;
    let evalAttempts = 0;
    const pollEval = async () => {
      if (evalPollCancelledRef.current) return;
      try {
        const data = await api.getSession(sessionId);
        if (data.evaluation) {
          setEvaluation(data.evaluation);
          if (data.evaluation.status === 'completed' || data.evaluation.status === 'failed') {
            return; // Done polling
          }
        }
      } catch { /* ignore */ }

      evalAttempts++;
      if (evalAttempts < 30) setTimeout(pollEval, 3000); // Up to 90s
    };
    setTimeout(pollEval, 3000);
  };

  const startPractice = async () => {
    setLoading(true);
    setTimer(0);
    setFeedback(null);
    setEvaluation(null);
    evalPollCancelledRef.current = true;
    try {
      const data = await api.startSession({ session_type: 'practice' });
      setCurrentSession(data);
      setState(STATES.ACTIVE);

      await vapi.start(data.vapi_config.assistantId, {
        metadata: data.vapi_config.assistantOverrides.metadata,
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      setState(STATES.IDLE);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
          <div className="flex items-center gap-5">
            <StreakBadge count={user?.current_streak || 0} />
            <Link
              to="/dashboard"
              className="text-sm font-medium transition-colors duration-300"
              style={{ color: '#64748b' }}
              onMouseEnter={(e) => e.target.style.color = '#e2e8f0'}
              onMouseLeave={(e) => e.target.style.color = '#64748b'}
            >
              Dashboard
            </Link>
          </div>
        </nav>

        <main className="max-w-lg mx-auto px-4 py-12">
          {/* Idle */}
          {state === STATES.IDLE && (
            <div className="text-center space-y-8 animate-fade-in-up">
              <VoiceOrb isActive={false} isSpeaking={false} />
              <div>
                <h1
                  className="text-3xl font-bold mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #f1f5f9, #a5b4fc)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Ready to practice?
                </h1>
                <p className="text-sm" style={{ color: '#64748b' }}>
                  Start a session and tell Alexa what you want to work on.
                </p>
              </div>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={startPractice}
                  disabled={loading}
                  className="btn-primary py-3.5 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </span>
                  ) : (
                    'Start Practice'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Active Call */}
          {state === STATES.ACTIVE && (
            <div className="text-center space-y-8 animate-fade-in">
              <VoiceOrb isActive={isCallActive} isSpeaking={isSpeaking} />
              <div>
                <div
                  className="text-4xl font-bold tracking-wider mb-3"
                  style={{
                    fontFamily: "'DM Sans', monospace",
                    fontVariantNumeric: 'tabular-nums',
                    background: 'linear-gradient(135deg, #e2e8f0, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {formatTime(timer)}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: isCallActive
                        ? (isSpeaking ? '#818cf8' : '#34d399')
                        : '#f59e0b',
                      boxShadow: isCallActive
                        ? (isSpeaking ? '0 0 8px rgba(129, 140, 248, 0.5)' : '0 0 8px rgba(52, 211, 153, 0.5)')
                        : '0 0 8px rgba(245, 158, 11, 0.5)',
                      animation: 'glowPulse 1.5s ease-in-out infinite',
                    }}
                  />
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    {isCallActive ? (isSpeaking ? 'Speaking...' : 'Listening...') : 'Connecting...'}
                  </p>
                </div>
              </div>
              {isCallActive && (
                <button
                  onClick={() => vapi.stop()}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.18)';
                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  End Session
                </button>
              )}
            </div>
          )}

          {/* Processing */}
          {state === STATES.PROCESSING && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="flex justify-center py-8">
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-full animate-spin-slow"
                    style={{
                      border: '2px solid rgba(99, 102, 241, 0.1)',
                      borderTopColor: '#6366f1',
                      animation: 'spin-slow 1s linear infinite',
                    }}
                  />
                  <div
                    className="absolute inset-2 rounded-full animate-spin-slow"
                    style={{
                      border: '2px solid rgba(139, 92, 246, 0.1)',
                      borderBottomColor: '#8b5cf6',
                      animation: 'spin-slow 1.5s linear infinite reverse',
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>Analyzing your response</p>
                <p className="text-xs mt-1" style={{ color: '#475569' }}>This usually takes a few seconds...</p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {state === STATES.FEEDBACK && (
            <div className="animate-slide-in-up">
              <SessionSummary
                session={currentSession?.session}
                feedback={feedback}
                onContinue={() => {
                  setState(STATES.IDLE);
                  setEvaluation(null);
                  evalPollCancelledRef.current = true;
                }}
                continueLabel="Practice again"
              />
              <EvaluationCard evaluation={evaluation} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
