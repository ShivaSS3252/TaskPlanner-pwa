// src/components/TaskItem.jsx
import { useState, useRef, useEffect } from 'react'
import { breakdownTask } from '../api/gemini'

const PRIORITIES = [
  { value: 'low',    label: 'Low',  color: '#a3e635', bg: 'rgba(163,230,53,0.12)',  border: 'rgba(163,230,53,0.3)'  },
  { value: 'medium', label: 'Med',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.2)'  },
  { value: 'high',   label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'  },
]

const getDueDateInfo = (dueDate, completed) => {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24))
  const formatted = due.toLocaleDateString('en', { month: 'short', day: 'numeric' })

  if (completed) return { label: formatted, color: 'var(--text-faint)', isOverdue: false }
  if (diff < 0)  return { label: `Overdue · ${formatted}`, color: '#ef4444', isOverdue: true }
  if (diff === 0) return { label: 'Due Today', color: '#f59e0b', isOverdue: false }
  if (diff === 1) return { label: 'Due Tomorrow', color: 'var(--text-secondary)', isOverdue: false }
  return { label: `Due ${formatted}`, color: 'var(--text-muted)', isOverdue: false }
}

export const TaskItem = ({ task, onToggle, onDelete, onEdit, onUpdateMeta, onAddSubtask, index }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const [editPriority, setEditPriority] = useState(task.priority || 'medium')
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '')

  const [isBreakingDown, setIsBreakingDown] = useState(false)
  const [subtasks, setSubtasks] = useState([])
  const [breakdownError, setBreakdownError] = useState('')
  const [addedIndices, setAddedIndices] = useState(new Set())

  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) {
      setEditPriority(task.priority || 'medium')
      setEditDueDate(task.dueDate || '')
    }
  }, [task.priority, task.dueDate, isEditing])

  const handleSave = async () => {
    const trimmed = editText.trim()
    const textChanged = trimmed && trimmed !== task.text
    const metaChanged = editPriority !== (task.priority || 'medium') || editDueDate !== (task.dueDate || '')

    if (textChanged) await onEdit(task.id, trimmed)
    if (metaChanged && onUpdateMeta) await onUpdateMeta(task.id, { priority: editPriority, dueDate: editDueDate || null })

    if (!trimmed) setEditText(task.text)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditText(task.text)
      setEditPriority(task.priority || 'medium')
      setEditDueDate(task.dueDate || '')
    }
  }

  const handleBreakdown = async () => {
    if (isBreakingDown) return
    setBreakdownError('')
    setSubtasks([])
    setAddedIndices(new Set())
    setIsBreakingDown(true)
    try {
      const result = await breakdownTask(task.text)
      setSubtasks(result)
    } catch (err) {
      if (err.message === 'NO_KEY') {
        setBreakdownError('Add VITE_GEMINI_API_KEY to your .env file to use AI breakdown.')
      } else {
        setBreakdownError('AI breakdown failed. Check your API key or try again.')
      }
    } finally {
      setIsBreakingDown(false)
    }
  }

  const handleAddSubtask = (text, idx) => {
    if (onAddSubtask) onAddSubtask(text, task.category, { priority: task.priority || 'medium', dueDate: task.dueDate || null })
    setAddedIndices((prev) => new Set([...prev, idx]))
  }

  const handleAddAll = () => {
    subtasks.forEach((text, idx) => {
      if (!addedIndices.has(idx)) handleAddSubtask(text, idx)
    })
  }

  const isPending    = task.syncStatus === 'pending'
  const dueDateInfo  = getDueDateInfo(task.dueDate, task.completed)
  const isOverdue    = dueDateInfo?.isOverdue && !task.completed
  const priority     = PRIORITIES.find((p) => p.value === (task.priority || 'medium'))
  const today        = new Date().toISOString().split('T')[0]
  const allAdded     = subtasks.length > 0 && addedIndices.size === subtasks.length
  const colorScheme  = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'

  const cardBg = isPending
    ? 'var(--card-pending-bg)'
    : task.completed
      ? 'var(--card-completed-bg)'
      : 'var(--bg-card)'

  const cardBorder = isOverdue
    ? '1px solid rgba(239,68,68,0.3)'
    : isPending
      ? '1px solid var(--card-pending-border)'
      : task.completed
        ? '1px solid var(--card-completed-border)'
        : '1px solid var(--bg-card-border)'

  return (
    <div
      style={{
        background: cardBg, border: cardBorder, borderRadius: '20px',
        transition: 'all 0.2s',
        animation: `fadeIn 0.25s ease ${Math.min(index, 8) * 0.04}s both`,
        boxShadow: isOverdue ? '0 0 0 1px rgba(239,68,68,0.08)' : 'var(--card-shadow)',
        overflow: 'hidden', minWidth: 0,
      }}
    >
      {/* Main task row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px 20px' }}>
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          style={{
            flexShrink: 0, marginTop: '1px',
            width: '24px', height: '24px', borderRadius: '50%',
            cursor: 'pointer', transition: 'all 0.2s',
            background: task.completed ? 'linear-gradient(135deg, var(--lime), #84cc16)' : 'transparent',
            border: task.completed ? 'none' : '2px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: task.completed ? '0 2px 8px rgba(163,230,53,0.35)' : 'none',
          }}
        >
          {task.completed && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <>
              <input
                ref={inputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%', background: 'var(--bg-input)',
                  border: '1px solid var(--border-input-focus)',
                  borderRadius: '10px', padding: '8px 12px',
                  color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500,
                  outline: 'none', lineHeight: '1.6',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setEditPriority(p.value)}
                    style={{
                      padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: editPriority === p.value ? p.bg : 'transparent',
                      border: editPriority === p.value ? `1px solid ${p.border}` : '1px solid var(--border-subtle)',
                      color: editPriority === p.value ? p.color : 'var(--text-faint)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
                <input
                  type="date"
                  value={editDueDate}
                  min={today}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)',
                    borderRadius: '7px', padding: '2px 7px',
                    color: editDueDate ? 'var(--text-primary)' : 'var(--text-faint)',
                    fontSize: '10px', fontWeight: 600, outline: 'none', cursor: 'pointer',
                    colorScheme,
                  }}
                />
                {editDueDate && (
                  <button
                    type="button"
                    onClick={() => setEditDueDate('')}
                    style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}
                  >×</button>
                )}
              </div>
            </>
          ) : (
            <p style={{
              fontSize: '15px', fontWeight: 500, lineHeight: '1.6',
              color: task.completed ? 'var(--text-faint)' : 'var(--text-primary)',
              textDecoration: task.completed ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}>
              {task.text}
            </p>
          )}

          {/* Meta badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {!isEditing && priority && priority.value !== 'medium' && (
              <span style={{
                fontSize: '11px', fontWeight: 800, color: priority.color,
                background: priority.bg, padding: '4px 10px',
                borderRadius: '999px', border: `1px solid ${priority.border}`,
                letterSpacing: '0.4px', textTransform: 'uppercase',
              }}>
                {priority.value === 'high' ? '↑ High' : '↓ Low'}
              </span>
            )}
            {!isEditing && dueDateInfo && (
              <span style={{
                fontSize: '11px', fontWeight: 700, color: dueDateInfo.color,
                background: dueDateInfo.isOverdue ? 'rgba(239,68,68,0.08)' : 'transparent',
                padding: '4px 10px', borderRadius: '999px',
                border: dueDateInfo.isOverdue ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border-subtle)',
              }}>
                {dueDateInfo.isOverdue ? '⚠ ' : '📅 '}{dueDateInfo.label}
              </span>
            )}
            {isPending && (
              <span style={{
                fontSize: '11px', fontWeight: 800, color: '#fbbf24',
                background: 'rgba(251,191,36,0.12)', padding: '4px 10px',
                borderRadius: '999px', border: '1px solid rgba(251,191,36,0.25)',
                letterSpacing: '0.5px', textTransform: 'uppercase',
              }}>⏳ Pending</span>
            )}
            {task.category && (
              <span style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                background: 'var(--bg-card)', padding: '4px 10px',
                borderRadius: '999px', border: '1px solid var(--border-subtle)',
              }}>
                {typeof task.category === 'object' ? task.category.name : '📂'}
              </span>
            )}
            {task.completed && (
              <span style={{ fontSize: '11px', color: 'var(--lime)', opacity: 0.5, fontWeight: 600 }}>Done</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* AI breakdown button — violet kept as AI brand distinction */}
          {!task.completed && !isEditing && (
            <button
              onClick={handleBreakdown}
              title="Break down with AI"
              disabled={isBreakingDown}
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: subtasks.length > 0 ? 'rgba(139,92,246,0.20)' : 'rgba(139,92,246,0.12)',
                border: subtasks.length > 0 ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(139,92,246,0.30)',
                color: subtasks.length > 0 ? '#a78bfa' : 'rgba(167,139,250,0.85)',
                cursor: isBreakingDown ? 'wait' : 'pointer',
                fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                animation: isBreakingDown ? 'pulse 1s ease infinite' : 'none',
              }}
            >
              {isBreakingDown ? '⋯' : '✦'}
            </button>
          )}
          {!task.completed && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              title="Edit task"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'var(--btn-edit-bg)', border: '1px solid var(--btn-edit-border)',
                color: 'var(--btn-edit-color)', cursor: 'pointer',
                fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >✎</button>
          )}
          {isEditing && (
            <button
              onClick={handleSave}
              title="Save"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.25)',
                color: 'rgba(163,230,53,0.8)', cursor: 'pointer',
                fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✓</button>
          )}
          {!isEditing && (
            <button
              onClick={() => onDelete(task.id)}
              title="Delete task"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)',
                color: '#f87171', cursor: 'pointer',
                fontSize: '18px', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* AI subtask panel */}
      {(subtasks.length > 0 || breakdownError) && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px 20px 18px',
          background: 'rgba(139,92,246,0.03)',
        }}>
          {breakdownError ? (
            <p style={{ fontSize: '12px', color: '#f87171', fontWeight: 500 }}>⚠ {breakdownError}</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  ✦ AI Subtasks
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!allAdded && (
                    <button
                      onClick={handleAddAll}
                      style={{
                        fontSize: '10px', fontWeight: 700, padding: '3px 10px',
                        borderRadius: '999px', cursor: 'pointer',
                        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                        color: '#a78bfa',
                      }}
                    >
                      Add All ({subtasks.length - addedIndices.size})
                    </button>
                  )}
                  <button
                    onClick={() => { setSubtasks([]); setBreakdownError('') }}
                    style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                      borderRadius: '999px', cursor: 'pointer',
                      background: 'var(--btn-cancel-bg)', border: '1px solid var(--btn-cancel-border)',
                      color: 'var(--btn-cancel-color)',
                    }}
                  >Dismiss</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subtasks.map((text, idx) => {
                  const added = addedIndices.has(idx)
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 14px', borderRadius: '12px',
                        background: added ? 'rgba(163,230,53,0.06)' : 'var(--bg-input)',
                        border: added ? '1px solid rgba(163,230,53,0.2)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: added ? 'rgba(163,230,53,0.6)' : 'rgba(139,92,246,0.5)', flexShrink: 0 }}>
                        {added ? '✓' : '◦'}
                      </span>
                      <span style={{
                        flex: 1, fontSize: '13px', fontWeight: 500,
                        color: added ? 'var(--text-faint)' : 'var(--text-primary)',
                        textDecoration: added ? 'line-through' : 'none',
                      }}>
                        {text}
                      </span>
                      {!added && (
                        <button
                          onClick={() => handleAddSubtask(text, idx)}
                          style={{
                            fontSize: '10px', fontWeight: 800, padding: '2px 8px',
                            borderRadius: '999px', cursor: 'pointer', flexShrink: 0,
                            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                            color: 'var(--accent)',
                          }}
                        >+ Add</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
