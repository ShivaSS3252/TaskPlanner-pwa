// src/App.jsx
import { useState, useEffect } from 'react'
import { useTasks } from './hooks/useTasks'
import { useCategories } from './hooks/useCategories'
import { useSSE } from './hooks/useSSE'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './hooks/useAuth'
import { TaskInput } from './components/TaskInput'
import { TaskItem } from './components/TaskItem'
import { OnlineStatus } from './components/OnlineStatus'
import { NotificationSetup } from './components/NotificationSetup'
import { CategoryBar } from './components/CategoryBar'
import { Toast } from './components/Toast'
import { SSEStatus } from './components/SSEStatus'
import { Analytics } from './components/Analytics'
import { LoginPage } from './components/LoginPage'
import { UserMenu } from './components/UserMenu'

const StatChip = ({ children, color }) => (
  <span style={{
    fontSize: '13px', fontWeight: 700, padding: '6px 14px', borderRadius: '999px',
    background: color === 'rose'
      ? 'var(--accent-bg)'
      : color === 'lime'
        ? 'var(--lime-bg)'
        : 'rgba(251,191,36,0.1)',
    border: color === 'rose'
      ? '1px solid var(--accent-border)'
      : color === 'lime'
        ? '1px solid var(--lime-border)'
        : '1px solid rgba(251,191,36,0.25)',
    color: color === 'rose'
      ? 'var(--accent)'
      : color === 'lime'
        ? 'var(--lime)'
        : '#fbbf24',
  }}>
    {children}
  </span>
)

const PAGE_SIZE = 10

// ── All hooks + UI live here — only rendered when user is signed in ────────
function AuthenticatedApp({ user, signOut }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState('tasks')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const { theme, toggleTheme } = useTheme()

  const showToast = (message, type = 'info') => setToast({ message, type })

  useEffect(() => {
    const handler = (e) => showToast(e.detail.message, e.detail.type)
    window.addEventListener('show-toast', handler)
    return () => window.removeEventListener('show-toast', handler)
  }, [])

  const {
    categories, loading: catLoading,
    createCategory, updateCategory, deleteCategory,
    addCategoryFromSSE, updateCategoryFromSSE, removeCategoryFromSSE,
  } = useCategories()

  const { tasks, allVisibleTasks, loading, createTask, editTask, toggleTask, removeTask, updateTaskMeta, addSubtask, toggleSubtask, deleteSubtask, editSubtask } = useTasks(selectedCategory)

  const { sseStatus } = useSSE({
    onNewCategory: async (cat) => { await addCategoryFromSSE(cat); showToast(`"${cat.name}" synced ✨`, 'success') },
    onUpdatedCategory: async (cat) => { await updateCategoryFromSSE(cat); showToast(`"${cat.name}" updated`, 'info') },
    onDeletedCategory: async (id) => { await removeCategoryFromSSE(id); showToast('Category removed', 'warning') },
  })

  const getCatName = (catId) => categories.find((c) => c._id === catId)?.name || null

  const handleCreateTask = async (text, category, options) => {
    const result = await createTask(text, category, options)
    const catName = getCatName(category)
    const label = catName ? `Task added to "${catName}" ✅` : `Task added ✅`
    showToast(navigator.onLine ? label : `Task saved offline ⏳`, navigator.onLine ? 'success' : 'warning')
    return result
  }

  const handleEditTask = async (id, newText) => {
    const task = tasks.find((t) => t.id === id)
    await editTask(id, newText)
    const catName = getCatName(task?.category)
    const label = catName ? `Task updated in "${catName}" ✅` : `Task updated ✅`
    showToast(navigator.onLine ? label : `Task updated offline ⏳`, navigator.onLine ? 'success' : 'warning')
  }

  const handleRemoveTask = async (id) => {
    const task = tasks.find((t) => t.id === id)
    const catName = getCatName(task?.category)
    await removeTask(id)
    const label = catName ? `Task deleted from "${catName}"` : `Task deleted`
    showToast(navigator.onLine ? label : `Deleted offline ⏳`, navigator.onLine ? 'info' : 'warning')
  }

  const handleCreateCategory = async (name, color) => {
    const result = await createCategory(name, color)
    showToast(result?.syncStatus === 'pending' ? `"${name}" saved offline ⏳` : `"${name}" created!`, result?.syncStatus === 'pending' ? 'warning' : 'success')
    return result
  }
  const handleUpdateCategory = async (id, name, color) => {
    await updateCategory(id, name, color)
    showToast(navigator.onLine ? `"${name}" updated ✅` : `"${name}" updated offline ⏳`, navigator.onLine ? 'success' : 'warning')
  }
  const handleDeleteCategory = async (id) => {
    const cat = categories.find((c) => c._id === id)
    await deleteCategory(id)
    if (selectedCategory === id) setSelectedCategory(null)
    showToast(navigator.onLine ? `"${cat?.name}" deleted` : 'Deleted offline ⏳', navigator.onLine ? 'info' : 'warning')
  }

  const pending   = tasks.filter((t) => t.syncStatus === 'pending').length
  const completed = tasks.filter((t) => t.completed).length
  const total     = tasks.length

  const filteredTasks = searchQuery.trim()
    ? tasks.filter((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : tasks

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [searchQuery, selectedCategory])

  const visibleTasks = filteredTasks.slice(0, visibleCount)
  const hiddenCount  = filteredTasks.length - visibleTasks.length

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-app)', color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header style={{
        flexShrink: 0, zIndex: 50,
        background: 'var(--bg-navbar)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--bg-navbar-border)',
      }}>
        <div style={{
          width: '100%', padding: '0 32px',
          height: '68px', display: 'flex', alignItems: 'center', gap: '14px',
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '15px', color: '#fff',
              boxShadow: 'var(--accent-glow)',
            }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.3px', color: 'var(--text-heading)' }}>
              TaskPlanner PWA
            </span>
          </div>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            {view === 'tasks' ? (
              <>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)',
                    borderRadius: '10px', padding: '10px 36px 10px 14px',
                    color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500,
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--border-input-focus)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--bg-input-border)' }}
                />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '16px', lineHeight: 1,
                  }}>×</button>
                ) : (
                  <span style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-faint)', fontSize: '13px', pointerEvents: 'none',
                  }}>⌕</span>
                )}
              </>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-faint)', fontWeight: 500 }}>
                Productivity at a glance
              </span>
            )}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => setView((v) => v === 'tasks' ? 'analytics' : 'tasks')}
              style={{
                height: '36px', padding: '0 16px', borderRadius: '10px',
                background: view === 'analytics' ? 'var(--accent-bg)' : 'var(--bg-input)',
                border: view === 'analytics' ? '1px solid var(--accent-border)' : '1px solid var(--bg-input-border)',
                color: view === 'analytics' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>{view === 'analytics' ? '☰' : '◫'}</span>
              {view === 'analytics' ? 'Tasks' : 'Stats'}
            </button>

            <button
              onClick={toggleTheme}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>

            <NotificationSetup />
            <SSEStatus status={sseStatus} />
            <UserMenu user={user} onSignOut={signOut} />
          </div>
        </div>
      </header>

      {/* ── STICKY CATEGORY BAR ─────────────────────────────────────── */}
      {view === 'tasks' && !catLoading && (
        <div style={{
          flexShrink: 0, zIndex: 40,
          background: 'var(--bg-navbar)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--bg-navbar-border)',
        }}>
          <div style={{ width: '100%', padding: '0 32px' }}>
            <CategoryBar
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              onCreate={handleCreateCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
            />
          </div>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT ───────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ width: '100%', padding: '0 32px' }}>

          <div style={{ paddingTop: '36px', paddingBottom: '20px' }}>
            <h1 style={{
              fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px',
              lineHeight: 1, color: 'var(--text-heading)', marginBottom: '14px',
            }}>
              {view === 'analytics' ? 'Analytics' : 'My Tasks'}
            </h1>

            {view === 'tasks' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <StatChip color="rose">{total} tasks</StatChip>
                <StatChip color="lime">{completed} done</StatChip>
                {pending > 0 && <StatChip color="amber">{pending} unsynced</StatChip>}
              </div>
            )}
          </div>

          {view === 'analytics' && (
            <Analytics allTasks={allVisibleTasks} categories={categories} theme={theme} />
          )}

          {view === 'tasks' && (
            <>
              {searchQuery.trim() && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
                  {filteredTasks.length} result{filteredTasks.length !== 1 ? 's' : ''} for &ldquo;{searchQuery.trim()}&rdquo;
                </p>
              )}

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '14px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '2px solid var(--accent-bg)', borderTopColor: 'var(--accent)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '64px 32px', borderRadius: '20px',
                  border: '1px dashed var(--bg-card-border)', background: 'var(--bg-card)',
                }}>
                  <p style={{ fontSize: '52px', marginBottom: '12px' }}>
                    {searchQuery ? '🔍' : selectedCategory ? '📂' : '✦'}
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {searchQuery ? `No tasks match "${searchQuery}"` : selectedCategory ? 'No tasks in this category' : 'No tasks yet — add one below'}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ columns: 2, columnGap: '12px' }}>
                    {visibleTasks.map((task, index) => (
                      <div key={task.id} style={{ breakInside: 'avoid', marginBottom: '12px' }}>
                        <TaskItem
                          task={task}
                          index={index}
                          onToggle={toggleTask}
                          onDelete={handleRemoveTask}
                          onEdit={handleEditTask}
                          onUpdateMeta={updateTaskMeta}
                          onAddSubtask={(taskId, text) => addSubtask(taskId, text)}
                          onToggleSubtask={(taskId, subtaskId) => toggleSubtask(taskId, subtaskId)}
                          onDeleteSubtask={(taskId, subtaskId) => deleteSubtask(taskId, subtaskId)}
                          onEditSubtask={(taskId, subtaskId, text) => editSubtask(taskId, subtaskId, text)}
                        />
                      </div>
                    ))}
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                      style={{
                        marginTop: '12px',
                        width: '100%', padding: '14px', borderRadius: '16px',
                        background: 'var(--bg-card)', border: '1px dashed var(--bg-card-border)',
                        color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      Show {Math.min(hiddenCount, PAGE_SIZE)} more tasks ({hiddenCount} remaining)
                    </button>
                  )}
                </>
              )}

              <div style={{ height: '16px' }} />
            </>
          )}
        </div>
      </div>

      {/* ── BOTTOM INPUT BAR ─────────────────────────────────────────── */}
      {view === 'tasks' && (
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid var(--bg-navbar-border)',
          background: 'var(--bg-navbar)', backdropFilter: 'blur(20px)',
          padding: '18px 32px',
        }}>
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <TaskInput
              onAdd={(text, options) => handleCreateTask(text, selectedCategory, options)}
              bottomBar
            />
          </div>
        </div>
      )}

      <OnlineStatus />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ── Root — only decides what to render based on auth state ────────────────
function App() {
  const { user, signOut } = useAuth()

  // Firebase resolving auth state — show spinner
  if (user === undefined) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-app)',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '2px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (user === null) return <LoginPage />

  return <AuthenticatedApp user={user} signOut={signOut} />
}

export default App
