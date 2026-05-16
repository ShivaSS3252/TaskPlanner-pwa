import { useState } from 'react'
import { signInWithGoogle } from '../firebase'

export const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-app)', color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '32px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'var(--accent)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '22px', color: '#fff',
          boxShadow: 'var(--accent-glow)',
        }}>✦</div>
        <span style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px', color: 'var(--text-heading)' }}>
          TaskPlanner PWA
        </span>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)',
        borderRadius: '24px', padding: '40px 36px',
        boxShadow: 'var(--card-shadow)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-heading)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Sign in to access your tasks from any device
          </p>
        </div>

        {/* Features list */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '⚡', text: 'Works offline — sync when back online' },
            { icon: '✦', text: 'AI task breakdown with Gemini' },
            { icon: '🔔', text: 'Push notifications across devices' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '12px',
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px',
            background: loading ? 'var(--bg-input)' : '#fff',
            border: '1px solid rgba(0,0,0,0.12)',
            color: '#3c4043', fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            boxShadow: loading ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#4285f4',
                animation: 'spin 0.8s linear infinite',
              }} />
              Signing in...
            </>
          ) : (
            <>
              {/* Google G logo */}
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <p style={{ fontSize: '13px', color: '#f87171', fontWeight: 600, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center' }}>
        Your data is private and only visible to you
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
