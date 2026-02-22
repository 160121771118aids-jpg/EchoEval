import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    async function processCallback() {
      try {
        // Supabase JS client automatically picks up the session from the URL hash
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw new Error(sessionError.message);
        if (!data.session) throw new Error('No session found');

        const accessToken = data.session.access_token;

        // Sync with backend (creates profile if first-time Google user)
        const user = await handleOAuthCallback(accessToken);

        navigate(user.onboarding_complete ? '/coach' : '/onboarding', { replace: true });
      } catch (err) {
        setError(err.message || 'Authentication failed');
      }
    }

    processCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: '#f87171' }}>{error}</p>
          <a href="/login" className="text-sm font-medium" style={{ color: '#818cf8' }}>
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
      <div className="premium-spinner" />
    </div>
  );
}
