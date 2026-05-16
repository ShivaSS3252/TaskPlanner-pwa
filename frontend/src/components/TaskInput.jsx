// src/components/TaskInput.jsx
import { useState } from 'react'

const PRIORITIES = [
  { value: 'low',    label: 'Low',  color: '#a3e635' },
  { value: 'medium', label: 'Med',  color: '#f59e0b' },
  { value: 'high',   label: 'High', color: '#ef4444' },
]

export const TaskInput = ({ onAdd, bottomBar }) => {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const colorScheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text, { priority, dueDate: dueDate || null })
    setText('')
    setPriority('medium')
    setDueDate('')
    setShowOptions(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const optionsPanel = showOptions && (
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
      borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
      ...(bottomBar ? { marginBottom: '10px' } : { marginTop: '10px' }),
    }}>
      {/* Priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Priority</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              style={{
                padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
                background: priority === p.value ? `${p.color}22` : 'transparent',
                border: priority === p.value ? `1px solid ${p.color}55` : '1px solid var(--border-subtle)',
                color: priority === p.value ? p.color : 'var(--text-faint)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

      {/* Due date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Due</span>
        <input
          type="date"
          value={dueDate}
          min={today}
          onChange={(e) => setDueDate(e.target.value)}
          style={{
            background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)',
            borderRadius: '8px', padding: '3px 8px',
            color: dueDate ? 'var(--text-primary)' : 'var(--text-faint)',
            fontSize: '11px', fontWeight: 600, outline: 'none', cursor: 'pointer',
            colorScheme,
          }}
        />
        {dueDate && (
          <button
            type="button"
            onClick={() => setDueDate('')}
            style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}
          >×</button>
        )}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      {bottomBar && optionsPanel}

      {/* Main input row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-card)', border: `1px solid ${text ? 'var(--accent-border)' : 'var(--bg-card-border)'}`,
        borderRadius: '20px', padding: '12px 12px 12px 20px',
        boxShadow: text ? '0 0 0 3px var(--accent-bg)' : 'none',
        transition: 'all 0.2s',
      }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500,
            padding: '12px 0',
          }}
        />
        {/* Options toggle */}
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          title="Set priority & due date"
          style={{
            flexShrink: 0, width: '40px', height: '40px', borderRadius: '12px',
            background: showOptions ? 'var(--accent-bg)' : 'var(--bg-input)',
            border: showOptions ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
            color: showOptions ? 'var(--accent)' : 'var(--text-faint)',
            cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >⊕</button>
        <button
          type="submit"
          disabled={!text.trim()}
          style={{
            flexShrink: 0, padding: '12px 28px', borderRadius: '14px',
            fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
            background: text.trim() ? 'var(--accent)' : 'var(--bg-input)',
            color: text.trim() ? '#fff' : 'var(--text-faint)',
            border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
            boxShadow: text.trim() ? 'var(--accent-glow)' : 'none',
          }}
        >
          Add
        </button>
      </div>

      {!bottomBar && optionsPanel}
    </form>
  )
}
