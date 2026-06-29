import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await login(u, p)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍺</div>
          <h1 className="text-2xl font-bold">Баарны тайлан</h1>
          <p className="text-stone-500 text-sm mt-1">Нэвтрэх</p>
        </div>
        <form onSubmit={handleLogin} className="card">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Нэвтрэх нэр</label>
            <input className="inp" value={u} onChange={e => setU(e.target.value)}
              placeholder="admin" autoComplete="username" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Нууц үг</label>
            <input className="inp" type="password" value={p} onChange={e => setP(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" />
          </div>
          {err && <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-lg p-2">{err}</p>}
          <button className="btn btn-dark w-full" type="submit" disabled={loading}>
            {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх →'}
          </button>
        </form>
      </div>
    </div>
  )
}
