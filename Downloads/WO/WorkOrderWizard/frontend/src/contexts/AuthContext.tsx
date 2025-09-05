'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import axios from 'axios'

const firebaseConfig = {
  apiKey: "AIzaSyDB5GQ0dmr-Y_NYJXgOu5nOdBY9NPe99rI",
  authDomain: "solsino-ba946.firebaseapp.com",
  projectId: "solsino-ba946",
  storageBucket: "solsino-ba946.firebasestorage.app",
  messagingSenderId: "315067129676",
  appId: "1:315067129676:web:2fd8c27105e3202a2779e9",
  measurementId: "G-E34R0C6GJP"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

interface AuthContextType {
  user: User | null
  userProfile: any
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const token = await user.getIdToken()
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            idToken: token
          })
          setUserProfile(response.data.user)
        } catch (error) {
          console.error('Failed to get user profile:', error)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
