import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import vapi from '../lib/vapi';
import VoiceOrb from '../components/VoiceOrb';
import FeedbackCard from '../components/FeedbackCard';

const STEPS = {
  WELCOME: 'welcome',
  PRACTICE_ACTIVE: 'practice_active',
  PRACTICE_DONE: 'practice_done',
};

const STEP_ORDER = [
  STEPS.WELCOME,
  STEPS.PRACTICE_ACTIVE,
  STEPS.PRACTICE_DONE,
];

function ProgressBar({ step }) {
  const idx = STEP_ORDER.indexOf(step);
  const progress = ((idx + 1) / STEP_ORDER.length) * 100;

  return (
    <div className="w-full max-w-xs mx-auto mb-10">
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(99, 102, 241, 0.1)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>
          Getting started
        </span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.WELCOME);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const currentSessionRef = useRef(currentSession);
  const stepRef = useRef(step);
  const pollCancelledRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);
  useEffect(() => { stepRef.current = step; }, [step]);

  // Register VAPI listeners once
  useEffect(() => {
    const onCallStart = () => setIsCallActive(true);
    const onCallEnd = () => {
      setIsCallActive(false);
      setIsSpeaking(false);

      const session = currentSessionRef.current;
      if (!session) return;

      pollCancelledRef.current = false;
      let attempts = 0;
      const pollFeedback = async () => {
        if (pollCancelledRef.current) return;
        try {
          const data = await api.getSession(session.session_id);
          if (data.feedback) {
            setFeedback(data.feedback);
            setStep(STEPS.PRACTICE_DONE);
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
          setStep(STEPS.PRACTICE_DONE);
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
      vapi.removeAllListeners();
    };
  }, []);

  const startCall = async () => {
    setLoading(true);
    try {
      const data = await api.startSession({ session_type: 'practice' });
      setCurrentSession(data);
      setFeedback(null);

      await vapi.start({
        ...data.vapi_config.assistant,
        metadata: data.vapi_config.metadata,
      });
    } catch (err) {
      console.error('Failed to start call:', err);
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = async () => {
    await api.completeOnboarding();
    await refreshUser();
    navigate('/coach');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient background */}
      <div className="ambient-bg" />

      <div className="w-full max-w-md relative z-10">
        <ProgressBar step={step} />

        {/* Welcome */}
        {step === STEPS.WELCOME && (
          <div className="text-center space-y-6 animate-fade-in-up">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))',
                boxShadow: '0 0 30px rgba(99, 102, 241, 0.1)',
              }}
            >
              <svg className="w-8 h-8" style={{ color: '#818cf8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1
              className="text-3xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #f1f5f9, #a5b4fc)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Hey{user?.first_name ? `, ${user.first_name}` : ''}!
            </h1>
            <p className="leading-relaxed" style={{ color: '#64748b' }}>
              This is a private space to practice speaking. You don&apos;t need to be good.
              Just speak naturally and I&apos;ll guide you.
            </p>
            <button
              onClick={() => {
                setStep(STEPS.PRACTICE_ACTIVE);
                startCall();
              }}
              disabled={loading}
              className="btn-primary px-8 py-3.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </span>
              ) : (
                'Start your first practice'
              )}
            </button>
          </div>
        )}

        {/* Practice Active */}
        {step === STEPS.PRACTICE_ACTIVE && (
          <div className="text-center space-y-8 animate-fade-in">
            <VoiceOrb isActive={isCallActive} isSpeaking={isSpeaking} />
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: isCallActive ? '#34d399' : '#f59e0b',
                  boxShadow: isCallActive ? '0 0 8px rgba(52, 211, 153, 0.5)' : '0 0 8px rgba(245, 158, 11, 0.5)',
                  animation: 'glowPulse 1.5s ease-in-out infinite',
                }}
              />
              <p className="text-sm" style={{ color: '#64748b' }}>
                {isCallActive ? 'Listening...' : 'Connecting...'}
              </p>
            </div>
            {isCallActive && (
              <button
                onClick={() => vapi.stop()}
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: '#475569' }}
                onMouseEnter={(e) => e.target.style.color = '#e2e8f0'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}
              >
                End call
              </button>
            )}
          </div>
        )}

        {/* Practice Done */}
        {step === STEPS.PRACTICE_DONE && (
          <div className="space-y-6 animate-slide-in-up">
            <div className="text-center">
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #f1f5f9, #a5b4fc)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Great practice!
              </h2>
              <p className="text-sm" style={{ color: '#64748b' }}>Here&apos;s your feedback:</p>
            </div>
            <FeedbackCard feedback={feedback} />
            <button
              onClick={finishOnboarding}
              className="w-full btn-primary py-3.5 rounded-xl text-sm font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
