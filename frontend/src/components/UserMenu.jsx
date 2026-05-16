import { useState, useRef, useEffect } from 'react'

export const UserMenu = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initial = (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          height: '36px', padding: '4px 8px 4px 4px', borderRadius: '999px',
          background: open ? 'var(--accent-bg)' : 'var(--bg-input)',
          border: open ? '1px solid var(--accent-border)' : '1px solid var(--bg-input-border)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          fontSize: '13px', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {initial}
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '220px', borderRadius: '16px',
          background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          overflow: 'hidden', zIndex: 100,
        }}>
          {/* User info */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '2px' }}>
              {user.displayName}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>
              {user.email}
            </p>
          </div>

          {/* Sign out */}
          <button
            onClick={() => { setOpen(false); onSignOut() }}
            style={{
              width: '100%', padding: '12px 16px', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, color: '#f87171',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
          >
            <span>↩</span> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
