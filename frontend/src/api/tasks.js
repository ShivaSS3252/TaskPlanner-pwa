import { auth } from '../firebase'

const BASE_URL = import.meta.env.VITE_API_URL

const authHeaders = async () => {
  const token = await auth.currentUser?.getIdToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const getTasksAPI = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const res = await fetch(`${BASE_URL}/api/tasks${params ? `?${params}` : ''}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export const createTaskAPI = async (task) => {
  const res = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(task),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export const updateTaskAPI = async (clientId, updates) => {
  const res = await fetch(`${BASE_URL}/api/tasks/${clientId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export const deleteTaskAPI = async (clientId) => {
  const res = await fetch(`${BASE_URL}/api/tasks/${clientId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete task')
  return res.json()
}

export const syncTasksAPI = async (tasks) => {
  const res = await fetch(`${BASE_URL}/api/tasks/sync`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ tasks }),
  })
  if (!res.ok) {
    const err = await res.json()
    console.error('Sync API error:', err)
    throw new Error('Failed to sync tasks')
  }
  return res.json()
}
