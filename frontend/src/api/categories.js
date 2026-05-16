import { auth } from '../firebase'

const BASE_URL = import.meta.env.VITE_API_URL

const authHeaders = async () => {
  const token = await auth.currentUser?.getIdToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const parseError = async (res) => {
  try {
    const data = await res.json()
    return data.error || `Request failed with status ${res.status}`
  } catch {
    return `Request failed with status ${res.status}`
  }
}

export const getCategoriesAPI = async () => {
  const res = await fetch(`${BASE_URL}/api/categories`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export const createCategoryAPI = async (category) => {
  const res = await fetch(`${BASE_URL}/api/categories`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(category),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export const updateCategoryAPI = async (id, updates) => {
  const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export const deleteCategoryAPI = async (id) => {
  const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
