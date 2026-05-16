// src/components/CategoryBar.jsx
import { useState, useRef, useEffect } from 'react'

const COLORS = [
  '#f43f5e', '#fb923c', '#f59e0b', '#a3e635',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
]

const MAX_PILLS = 6

export const CategoryBar = ({ categories, selected, onSelect, onCreate, onUpdate, onDelete }) => {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#f43f5e')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [showOverflow, setShowOverflow] = useState(false)
  const [overflowSearch, setOverflowSearch] = useState('')
  const overflowSearchRef = useRef(null)

  const addInputRef = useRef(null)
  const editInputRef = useRef(null)

  useEffect(() => {
    if (showAdd && addInputRef.current) addInputRef.current.focus()
  }, [showAdd])

  useEffect(() => {
    if (showOverflow && overflowSearchRef.current) overflowSearchRef.current.focus()
  }, [showOverflow])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // ── ADD ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setAdding(true)
    setAddError('')
    try {
      await onCreate(trimmed, newColor)
      setNewName('')
      setNewColor('#f43f5e')
      setShowAdd(false)
    } catch (err) {
      setAddError(err.message || 'Failed to create category')
    } finally {
      setAdding(false)
    }
  }

  const cycleColor = () =>
    setNewColor(COLORS[(COLORS.indexOf(newColor) + 1) % COLORS.length])

  // ── EDIT ───────────────────────────────────────────────────────────────
  const startEdit = (cat, e) => {
    e.stopPropagation()
    setShowAdd(false)
    setAddError('')
    setEditingId(cat._id)
    setEditName(cat.name)
    setEditColor(cat.color || '#f43f5e')
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
    setEditError('')
    setSaving(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    const trimmed = editName.trim()
    if (!trimmed) return
    const original = categories.find((c) => c._id === editingId)
    if (original && original.name === trimmed && original.color === editColor) {
      cancelEdit()
      return
    }
    setSaving(true)
    setEditError('')
    try {
      await onUpdate(editingId, trimmed, editColor)
      cancelEdit()
    } catch (err) {
      setEditError(err.message || 'Failed to update')
      setSaving(false)
    }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────
  const handleDelete = async (id, name, e) => {
    e.stopPropagation()
    if (categories?.[0]?.isDeletable === false)
      if (!window.confirm(`Category Deletion not allowed ${name}`)) return
    try {
      await onDelete(id)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const visibleCats = (categories || []).slice(0, MAX_PILLS)
  const overflowCats = (categories || []).slice(MAX_PILLS)
  const overflowCount = overflowCats.length
  const filteredOverflow = overflowSearch.trim()
    ? overflowCats.filter((c) => c.name.toLowerCase().includes(overflowSearch.toLowerCase()))
    : overflowCats
  const selectedInOverflow = overflowCats.some((c) => c._id === selected)

  const CatPillGroup = ({ cat }) => {
    const isSelected = selected === cat._id
    const isPending = cat.syncStatus === 'pending'
    return (
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onSelect(isSelected ? null : cat._id)}
          style={{
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
            border: isSelected ? 'none' : `1px solid ${cat.color}55`,
            background: isSelected ? cat.color : 'var(--bg-card)',
            color: isSelected ? '#fff' : 'var(--text-secondary)',
            boxShadow: isSelected ? `0 4px 14px ${cat.color}50` : 'none',
            opacity: isPending ? 0.7 : 1,
            outline: editingId === cat._id ? `2px solid ${cat.color}` : 'none',
            outlineOffset: '2px',
          }}
        >
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: isSelected ? 'rgba(255,255,255,0.8)' : cat.color,
          }} />
          {cat.name}
          {isPending && (
            <span style={{
              fontSize: '9px', fontWeight: 800, color: '#fbbf24',
              background: 'rgba(251,191,36,0.15)', padding: '1px 5px',
              borderRadius: '999px', border: '1px solid rgba(251,191,36,0.3)',
            }}>⏳</span>
          )}
        </button>
        <button onClick={(e) => startEdit(cat, e)} title={`Edit ${cat.name}`}
          style={{
            flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%',
            border: editingId === cat._id ? `1px solid ${cat.color}80` : '1px solid var(--bg-input-border)',
            background: editingId === cat._id ? `${cat.color}20` : 'var(--bg-input)',
            color: editingId === cat._id ? cat.color : 'var(--text-muted)',
            cursor: 'pointer', fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>✎</button>
        <button onClick={(e) => handleDelete(cat._id, cat.name, e)} title={`Delete ${cat.name}`}
          style={{
            flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%',
            border: '1px solid rgba(239,68,68,0.22)', background: 'rgba(239,68,68,0.09)',
            color: '#f87171', cursor: 'pointer', fontSize: '18px', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>×</button>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '10px', paddingBottom: '2px', position: 'relative' }}>

      {/* ── Pill row (includes inline add form) ──────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingBottom: '12px', alignItems: 'center' }}>

        {/* All Tasks */}
        <button
          onClick={() => onSelect(null)}
          style={{
            flexShrink: 0, whiteSpace: 'nowrap',
            padding: '9px 22px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: selected === null
              ? 'linear-gradient(135deg, var(--accent), #fb7185)'
              : 'var(--bg-pill-inactive)',
            color: selected === null ? '#fff' : 'var(--text-pill-inactive)',
            boxShadow: selected === null ? 'var(--accent-glow)' : 'inset 0 0 0 1px var(--bg-card-border)',
          }}
        >All Tasks</button>

        {/* First MAX_PILLS category pills */}
        {visibleCats.map((cat) => <CatPillGroup key={cat._id} cat={cat} />)}

        {/* Overflow toggle */}
        {overflowCount > 0 && (
          <button
            onClick={() => { setShowOverflow((v) => !v); setOverflowSearch('') }}
            style={{
              flexShrink: 0, whiteSpace: 'nowrap',
              padding: '9px 18px', borderRadius: '999px',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
              background: showOverflow || selectedInOverflow ? 'var(--accent-bg)' : 'var(--bg-pill-inactive)',
              border: showOverflow || selectedInOverflow ? '1px solid var(--accent-border)' : '1px solid var(--bg-card-border)',
              color: showOverflow || selectedInOverflow ? 'var(--accent)' : 'var(--text-pill-inactive)',
            }}
          >
            {showOverflow ? '▲ less' : `▾ ${overflowCount} more`}
          </button>
        )}

        {/* ── Inline add form ──────────────────────────────────────────── */}
        {!showAdd ? (
          <button
            onClick={() => { setShowAdd(true); setAddError(''); if (editingId) cancelEdit() }}
            style={{
              flexShrink: 0, whiteSpace: 'nowrap',
              padding: '9px 16px', borderRadius: '999px',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
              background: 'transparent',
              border: `1px dashed var(--border-pill-new)`,
              color: 'var(--text-pill-new)',
            }}
          >＋ New</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Color cycling dot — click to cycle through colors */}
            <button
              type="button"
              onClick={cycleColor}
              title="Click to change color"
              style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: newColor, border: `2px solid ${newColor}60`,
                cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                boxShadow: `0 0 0 2px var(--bg-navbar), 0 0 0 3px ${newColor}`,
              }}
            />
            <input
              ref={addInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setShowAdd(false); setNewName(''); setAddError('') }
              }}
              placeholder="Name..."
              style={{
                width: '130px', background: 'var(--bg-input)',
                border: '1px solid var(--bg-input-border)',
                borderRadius: '999px', padding: '7px 14px',
                color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || adding}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: '999px',
                fontSize: '12px', fontWeight: 700, border: 'none',
                cursor: newName.trim() && !adding ? 'pointer' : 'not-allowed',
                background: newName.trim() && !adding
                  ? `linear-gradient(135deg, ${newColor}, ${newColor}cc)`
                  : 'var(--bg-input)',
                color: newName.trim() && !adding ? '#fff' : 'var(--text-faint)',
                boxShadow: newName.trim() && !adding ? `0 2px 8px ${newColor}40` : 'none',
                transition: 'all 0.2s',
              }}
            >{adding ? '…' : 'Add'}</button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewName(''); setAddError('') }}
              style={{
                flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--bg-input)', border: '1px solid var(--bg-card-border)',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        )}

      </div>

      {/* Error under the add form if needed */}
      {showAdd && addError && (
        <p style={{
          fontSize: '12px', color: '#fcd34d', marginBottom: '8px',
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: '8px', padding: '6px 12px', display: 'inline-block',
        }}>⚠️ {addError}</p>
      )}

      {/* ── Overflow browse panel ─────────────────────────────────────── */}
      {showOverflow && overflowCount > 0 && (
        <div style={{
          marginBottom: '10px', padding: '16px 18px',
          background: 'var(--bg-panel)', border: '1px solid var(--bg-card-border)',
          borderRadius: '18px',
        }}>
          <input
            ref={overflowSearchRef}
            type="text"
            value={overflowSearch}
            onChange={(e) => setOverflowSearch(e.target.value)}
            placeholder={`Search ${overflowCount} categories...`}
            style={{
              width: '100%', background: 'var(--bg-input)',
              border: '1px solid var(--bg-input-border)',
              borderRadius: '10px', padding: '9px 14px',
              color: 'var(--text-primary)', fontSize: '13px',
              outline: 'none', marginBottom: '12px', boxSizing: 'border-box',
            }}
          />
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredOverflow.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>No match</p>
            ) : filteredOverflow.map((cat) => {
              const isSelected = selected === cat._id
              return (
                <div key={cat._id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '12px',
                  background: isSelected ? `${cat.color}18` : 'var(--bg-card)',
                  border: isSelected ? `1px solid ${cat.color}55` : '1px solid var(--bg-card-border)',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span
                    onClick={() => { onSelect(isSelected ? null : cat._id); setShowOverflow(false) }}
                    style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: isSelected ? cat.color : 'var(--text-primary)', cursor: 'pointer' }}
                  >{cat.name}</span>
                  {cat.syncStatus === 'pending' && <span style={{ fontSize: '10px', color: '#fbbf24' }}>⏳</span>}
                  <button onClick={(e) => startEdit(cat, e)} title={`Edit ${cat.name}`}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, border: '1px solid var(--bg-input-border)', background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✎</button>
                  <button onClick={(e) => handleDelete(cat._id, cat.name, e)} title={`Delete ${cat.name}`}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, border: '1px solid rgba(239,68,68,0.22)', background: 'rgba(239,68,68,0.09)', color: '#f87171', cursor: 'pointer', fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Edit form — inline in its own row (no height push) ───────── */}
      {editingId && (
        <form
          onSubmit={handleUpdate}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}
        >
          {/* Row 1: color cycling dot + input + Save + Cancel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setEditColor(COLORS[(COLORS.indexOf(editColor) + 1) % COLORS.length])}
              title="Click to change color"
              style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: editColor, border: `2px solid ${editColor}60`,
                cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                boxShadow: `0 0 0 2px var(--bg-navbar), 0 0 0 3px ${editColor}`,
              }}
            />
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit() }}
              placeholder="Category name..."
              style={{
                width: '150px',
                background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)',
                borderRadius: '999px', padding: '7px 14px',
                color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
              }}
            />
            {/* Color swatches inline */}
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setEditColor(color)}
                style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: color, border: 'none', cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.15s',
                  transform: editColor === color ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: editColor === color
                    ? `0 0 0 1px var(--swatch-ring), 0 0 0 2px ${color}`
                    : `0 1px 3px ${color}50`,
                }}
              />
            ))}
            <button
              type="submit"
              disabled={!editName.trim() || saving}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: '999px',
                fontSize: '12px', fontWeight: 700, border: 'none',
                cursor: editName.trim() && !saving ? 'pointer' : 'not-allowed',
                background: editName.trim() && !saving
                  ? `linear-gradient(135deg, ${editColor}, ${editColor}cc)`
                  : 'var(--bg-input)',
                color: editName.trim() && !saving ? '#fff' : 'var(--text-faint)',
                boxShadow: editName.trim() && !saving ? `0 2px 8px ${editColor}40` : 'none',
                transition: 'all 0.2s',
              }}
            >{saving ? '…' : 'Save'}</button>
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--bg-input)', border: '1px solid var(--bg-card-border)',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
          {editError && (
            <p style={{
              fontSize: '12px', color: '#f87171',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px', padding: '6px 12px', display: 'inline-block',
            }}>⚠️ {editError}</p>
          )}
        </form>
      )}

    </div>
  )
}
