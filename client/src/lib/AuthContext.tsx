import { createContext, useContext, useState, ReactNode } from 'react'
import { api } from '../lib/api'

interface AuthCtx {
  username: string | null
  login: (u: string, p: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('bar_username')
  )

  async function login(u: string, p: string) {
    const data = await api.login(u, p)
    localStorage.setItem('bar_token', data.token)
    localStorage.setItem('bar_username', data.username)
    setUsername(data.username)
  }

  function logout() {
    localStorage.removeItem('bar_token')
    localStorage.removeItem('bar_username')
    setUsername(null)
  }

  return <Ctx.Provider value={{ username, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
