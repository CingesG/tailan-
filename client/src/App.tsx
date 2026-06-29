import { useState, useEffect } from 'react'
import { useAuth } from './lib/AuthContext'
import { api } from './lib/api'
import LoginPage from './pages/LoginPage'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'
import { barTodayStr } from './lib/utils'

type Tab = 'report' | 'history' | 'admin'

function fmtYM(ym: string) {
  const [y, m] = ym.split('-')
  return `${y} оны ${parseInt(m)}-р сар`
}

function getOldMonths(allMonths: string[]): string[] {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 6)
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`
  return allMonths.filter(m => m < cutoffStr).sort()
}

export default function App() {
  const { username } = useAuth()
  const [tab, setTab] = useState<Tab>('report')
  const [branches, setBranches] = useState<any[]>([])
  const [curBranch, setCurBranch] = useState<any>(null)
  const [editDate, setEditDate] = useState<string | null>(null)

  // Cleanup modal state
  const [cleanupQueue, setCleanupQueue] = useState<string[]>([])
  const [cleanupAccum, setCleanupAccum] = useState<string[]>([])
  const [cleanupLoading, setCleanupLoading] = useState(false)

  useEffect(() => {
    if (username) {
      loadBranches()
      runCleanupCheck()
    }
  }, [username])

  async function runCleanupCheck() {
    const key = `bar_cleanup_${barTodayStr()}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    try {
      const all = await api.getReportMonths()
      const old = getOldMonths(all)
      if (old.length > 0) setCleanupQueue(old)
    } catch {}
  }

  async function handleCleanupYes() {
    const toDelete = [...cleanupAccum, cleanupQueue[0]]
    setCleanupLoading(true)
    try {
      for (const ym of toDelete) await api.deleteReportMonth(ym)
    } catch {}
    setCleanupLoading(false)
    setCleanupAccum([])
    setCleanupQueue(q => q.slice(1))
  }

  function handleCleanupNo() {
    setCleanupAccum(a => [...a, cleanupQueue[0]])
    setCleanupQueue(q => q.slice(1))
  }

  async function loadBranches() {
    const data = await api.getBranches()
    setBranches(data)
    const saved = localStorage.getItem('bar_branch')
    const found = data.find((b: any) => b.id === Number(saved)) || data[0]
    setCurBranch(found)
  }

  function selectBranch(b: any) {
    setCurBranch(b)
    setEditDate(null)
    localStorage.setItem('bar_branch', String(b.id))
  }

  function handleEditDate(date: string) {
    setEditDate(date)
    setTab('report')
  }

  if (!username) return <LoginPage />

  const showCleanup = cleanupQueue.length > 0
  const pendingMonths = [...cleanupAccum, cleanupQueue[0]].filter(Boolean)
  const monthCount = pendingMonths.length

  return (
    <div className="min-h-screen bg-stone-100 pb-16">

      {/* CLEANUP MODAL */}
      {showCleanup && (
        <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:20,padding:24,maxWidth:340,width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.25)',textAlign:'center'}}>
            <div style={{fontSize:36,marginBottom:10}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>
              {monthCount === 1
                ? `Та энэ сарын тайланг бичсэн үү?`
                : `Та энэ ${monthCount} сарын тайлангуудыг бичсэн үү?`}
            </div>
            <div style={{fontSize:13,color:'#b52020',fontWeight:600,marginBottom:4}}>
              {pendingMonths.map(fmtYM).join(', ')}
            </div>
            <div style={{fontSize:12,color:'#888',marginBottom:20}}>
              "Тийм" дарвал эдгээр сарын бүх тайлан устгагдана.
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn" style={{flex:1}} onClick={handleCleanupNo} disabled={cleanupLoading}>
                Үгүй, хадгал
              </button>
              <button className="btn btn-dark" style={{flex:1,background:'#b52020'}} onClick={handleCleanupYes} disabled={cleanupLoading}>
                {cleanupLoading ? '⏳' : 'Тийм, устга'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div className="bg-white border-b border-stone-200 px-4 py-2.5 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
          <span className="font-bold text-base">🍺 Баарны тайлан</span>
          {branches.length > 0 && (
            <select
              className="text-sm font-bold px-3 py-1.5 rounded-lg border border-stone-200 bg-white outline-none cursor-pointer"
              style={{ WebkitAppearance: 'none' }}
              value={curBranch?.id || ''}
              onChange={e => selectBranch(branches.find(b => b.id === Number(e.target.value)))}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
        <div className="text-[11px] text-stone-400 mt-0.5 max-w-2xl mx-auto">
          {new Date().toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          {new Date().getHours() < 4 && <span style={{marginLeft:6,background:'#fef3c7',color:'#92400e',padding:'1px 8px',borderRadius:99,fontSize:10,fontWeight:700}}>🌙 {barTodayStr()} тайлан</span>}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto px-3 pt-3">
        {curBranch && (
          <>
            {tab === 'report' && (
              <ReportPage
                key={`${curBranch.id}-${editDate || 'today'}`}
                branchId={curBranch.id}
                branchName={curBranch.name}
                initialDate={editDate || undefined}
              />
            )}
            {tab === 'history' && (
              <HistoryPage
                branchId={curBranch.id}
                branchName={curBranch.name}
                onEditDate={handleEditDate}
              />
            )}
            {tab === 'admin' && (
              <AdminPage branches={branches} onBranchesChange={loadBranches} />
            )}
          </>
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 grid grid-cols-3 h-[60px] z-50">
        {([
          ['report', '📋', 'Тайлан'],
          ['history', '📜', 'Түүх'],
          ['admin', '⚙️', 'Админ'],
        ] as [Tab, string, string][]).map(([t, ic, label]) => (
          <button key={t} onClick={() => { setTab(t); setEditDate(null) }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide transition-colors border-none outline-none bg-transparent cursor-pointer ${tab === t ? 'text-stone-900' : 'text-stone-400'}`}>
            <span className="text-[22px] leading-none">{ic}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
