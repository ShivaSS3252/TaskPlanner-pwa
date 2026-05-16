// src/components/Analytics.jsx
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#a3e635' }

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: theme === 'dark' ? '#1a1010' : '#fff',
      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      borderRadius: '10px', padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    }}>
      {label && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: '12px', fontWeight: 700, color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)',
    borderRadius: '16px', padding: '16px 20px', boxShadow: 'var(--card-shadow)',
    display: 'flex', flexDirection: 'column', gap: '4px',
  }}>
    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
    <p style={{ fontSize: '32px', fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>{sub}</p>}
  </div>
)

const SectionTitle = ({ children }) => (
  <h3 style={{
    fontSize: '12px', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.8px', color: 'var(--text-muted)',
    marginBottom: '14px',
  }}>{children}</h3>
)

export const Analytics = ({ allTasks, categories, theme }) => {
  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.4)'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // ── Overview stats ───────────────────────────────────────────────────
  const total     = allTasks.length
  const completed = allTasks.filter((t) => t.completed).length
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0
  const overdue   = allTasks.filter((t) => {
    if (!t.dueDate || t.completed) return false
    const due = new Date(t.dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }).length

  // ── Last 7 days ──────────────────────────────────────────────────────
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)
      const label = i === 6 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' })
      const created = allTasks.filter((t) => {
        const c = new Date(t.createdAt)
        c.setHours(0, 0, 0, 0)
        return c.getTime() === d.getTime()
      }).length
      const done = allTasks.filter((t) => {
        if (!t.completedAt) return false
        const c = new Date(t.completedAt)
        c.setHours(0, 0, 0, 0)
        return c.getTime() === d.getTime()
      }).length
      return { day: label, Created: created, Completed: done }
    })
  }, [allTasks])

  // ── Category progress ────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    return (categories || [])
      .map((cat) => {
        const catTasks = allTasks.filter((t) => t.category === cat._id)
        if (catTasks.length === 0) return null
        return {
          name: cat.name.length > 10 ? cat.name.slice(0, 10) + '…' : cat.name,
          Total: catTasks.length,
          Done: catTasks.filter((t) => t.completed).length,
          color: cat.color,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 6)
  }, [allTasks, categories])

  // ── Priority breakdown ───────────────────────────────────────────────
  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }
    allTasks.forEach((t) => { counts[t.priority || 'medium']++ })
    return [
      { name: 'High',   value: counts.high,   color: '#ef4444' },
      { name: 'Medium', value: counts.medium, color: '#f59e0b' },
      { name: 'Low',    value: counts.low,    color: '#a3e635' },
    ].filter((p) => p.value > 0)
  }, [allTasks])

  // ── Completion by priority ────────────────────────────────────────────
  const priorityCompletion = useMemo(() => {
    return ['high', 'medium', 'low'].map((p) => {
      const pTasks = allTasks.filter((t) => (t.priority || 'medium') === p)
      const done   = pTasks.filter((t) => t.completed).length
      return {
        name: p.charAt(0).toUpperCase() + p.slice(1),
        Total: pTasks.length,
        Done: done,
        color: PRIORITY_COLORS[p],
      }
    }).filter((p) => p.Total > 0)
  }, [allTasks])

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: '48px', marginBottom: '12px' }}>📊</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600 }}>No data yet</p>
        <p style={{ color: 'var(--text-faint)', fontSize: '13px', marginTop: '4px' }}>Add some tasks to see your analytics</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '20px' }}>

      {/* ── Overview cards ─────────────────────────────────────────── */}
      <div>
        <SectionTitle>Overview</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <StatCard label="Total Tasks"  value={total}           color="var(--accent)" />
          <StatCard label="Completed"    value={completed}       color="var(--lime)"   sub={`${rate}% done`} />
          <StatCard label="Active"       value={total - completed} color="#f59e0b"     sub="in progress" />
          <StatCard label="Overdue"      value={overdue}         color={overdue > 0 ? '#f87171' : 'var(--text-muted)'} sub={overdue > 0 ? 'need attention' : 'all on track ✓'} />
        </div>
      </div>

      {/* ── Last 7 days ─────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Last 7 Days Activity</SectionTitle>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)',
          borderRadius: '16px', padding: '20px 12px 12px', boxShadow: 'var(--card-shadow)',
        }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7Days} barGap={2} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: tickColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: 'rgba(244,63,94,0.05)' }} />
              <Bar dataKey="Created"   fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Completed" fill="#a3e635" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f43f5e', display: 'inline-block' }} />Created
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#a3e635', display: 'inline-block' }} />Completed
            </span>
          </div>
        </div>
      </div>


      {/* ── Priority pie ─────────────────────────────────────────────── */}
      {priorityData.length > 1 && (
        <div>
          <SectionTitle>Priority Distribution</SectionTitle>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)',
            borderRadius: '16px', padding: '16px', boxShadow: 'var(--card-shadow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                >
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Legend
                  formatter={(value) => <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


    </div>
  )
}
