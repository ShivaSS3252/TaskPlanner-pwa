import { useState, useEffect } from 'react'
import { auth, onAuthStateChanged, signInWithGoogle, signOut } from '../firebase'

export const useAuth = () => {
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null)
    })
    return unsubscribe
  }, [])

  const getIdToken = async () => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken()
  }

  return { user, signInWithGoogle, signOut, getIdToken }
}
