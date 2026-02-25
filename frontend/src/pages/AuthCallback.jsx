import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    // This listener waits for the token to be ready in the browser
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === 'SIGNED_IN' && session) {
        try {
          // Send the token to FastAPI (which we just fixed in Step 1)
          const userData = await handleOAuthCallback(session.access_token);

          // Redirect to the correct page
          navigate(userData.onboarding_complete ? '/coach' : '/onboarding', { replace: true });
        } catch (err) {
          console.error("Sync error:", err);
          setError(err.message || 'Backend sync failed');
        }
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate, handleOAuthCallback]);

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
