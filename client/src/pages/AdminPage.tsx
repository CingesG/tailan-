import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { CATEGORIES } from '../types'
import { fmt } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'

interface Item {
  id: number
  name: string
  category: string
  price: number
  sort_order: number
  active: number
}

interface Props {
  branches: any[]
  onBranchesChange: () => void
}

export default function AdminPage({ branches, onBranchesChange }: Props) {
  const { logout } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [newBranch, setNewBranch] = useState('')
  const [aName, setAName] = useState('')
  const [aPrice, setAPrice] = useState('')
  const [aCat, setACat] = useState<string>(CATEGORIES[0])
  const [editId, setEditId] = useState<number | null>(null)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [toggling, setToggling] = useState<number | null>(null)

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    // all=true → admin sees ALL items including inactive
    const data = await api.getItems(true)
    setItems(data)
  }

  async function addBranch() {
    if (!newBranch.trim()) return
    await api.addBranch(newBranch.trim())
    setNewBranch('')
    onBranchesChange()
  }

  async function delBranch(id: number) {
    if (!confirm('Салбарыг устгах уу? Бүх тайлан устна.')) return
    await api.deleteBranch(id)
    onBranchesChange()
  }

  async function addItem() {
    if (!aName.trim()) return
    if (editId !== null) {
      await api.updateItem(editId, { name: aName, category: aCat, price: parseInt(aPrice) || 0 })
      setEditId(null)
    } else {
      await api.addItem({ name: aName, category: aCat, price: parseInt(aPrice) || 0 })
    }
    setAName(''); setAPrice(''); setACat(CATEGORIES[0])
    loadItems()
  }

  function startEdit(it: Item) {
    setEditId(it.id); setAName(it.name); setAPrice(String(it.price)); setACat(it.category)
    // scroll to form
    document.getElementById('item-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function toggleItem(id: number) {
    setToggling(id)
    await api.toggleItem(id)
    await loadItems()
    setToggling(null)
  }

  async function delItem(id: number, name: string) {
    if (!confirm(`"${name}" барааг бүрмөсөн устгах уу?\n(Унтраах бол toggle ашиглана уу)`)) return
    await api.deleteItem(id)
    loadItems()
  }

  async function changePw() {
    setPwMsg('')
    try {
      await api.changePassword(pwCurrent, pwNew)
      setPwMsg('✅ Нууц үг өөрчлөгдлөө')
      setPwCurrent(''); setPwNew('')
    } catch (e: any) { setPwMsg('❌ ' + e.message) }
  }

  const activeCount = items.filter(i => i.active === 1).length
  const inactiveCount = items.filter(i => i.active === 0).length

  return (
    <div>
      {/* BRANCHES */}
      <div className="card">
        <div className="ctitle">Салбар удирдах</div>
        <div className="flex gap-2 mb-3">
          <input className="inp flex-1" placeholder="Шинэ салбарын нэр..."
            value={newBranch} onChange={e => setNewBranch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBranch()} />
          <button className="btn !px-4" onClick={addBranch}>➕</button>
        </div>
        {branches.map(b => (
          <div key={b.id} className="flex items-center gap-2 mb-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5">
            <span className="flex-1 font-semibold text-sm">{b.name}</span>
            {branches.length > 1 && (
              <button className="btn btn-red btn-sm !py-1" onClick={() => delBranch(b.id)}>🗑️</button>
            )}
          </div>
        ))}
      </div>

      {/* ITEM FORM */}
      <div className="card" id="item-form">
        <div className="ctitle">
          {editId !== null ? '✏️ Бараа засах' : '➕ Бараа нэмэх'}
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <input className="inp" placeholder="Барааны нэр" value={aName}
            onChange={e => setAName(e.target.value)} />
          <div className="flex gap-2">
            <input className="inp-num flex-1" type="number" inputMode="numeric"
              placeholder="Үнэ ₮" value={aPrice} onChange={e => setAPrice(e.target.value)} />
            <select className="inp flex-1" value={aCat} onChange={e => setACat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-dark flex-1 !py-3" onClick={addItem}>
              {editId !== null ? '💾 Хадгалах' : '➕ Нэмэх'}
            </button>
            {editId !== null && (
              <button className="btn !px-4" onClick={() => { setEditId(null); setAName(''); setAPrice('') }}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="card">
        <div className="ctitle flex items-center justify-between">
          <span>Бүх бараа</span>
          <span className="text-[11px] normal-case tracking-normal font-semibold text-stone-400">
            <span className="text-emerald-600">{activeCount} идэвхтэй</span>
            {inactiveCount > 0 && <span className="text-red-500 ml-2">{inactiveCount} унтарсан</span>}
          </span>
        </div>

        {CATEGORIES.map(cat => {
          const its = items.filter(i => i.category === cat)
          if (!its.length) return null
          const activeInCat = its.filter(i => i.active === 1).length
          return (
            <div key={cat} className="mb-3">
              {/* Category header */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="text-[10px] font-bold tracking-widest text-stone-500 bg-stone-100 px-2 py-1 rounded">{cat}</div>
                <div className="text-[10px] text-stone-400">{activeInCat}/{its.length}</div>
              </div>

              {its.map(it => {
                const isActive = it.active === 1
                const isToggling = toggling === it.id
                return (
                  <div key={it.id}
                    className={`flex items-center gap-2 mb-1.5 rounded-xl px-3 py-2.5 border transition-all ${
                      isActive
                        ? 'bg-white border-stone-200'
                        : 'bg-stone-50 border-stone-200 opacity-60'
                    }`}>

                    {/* TOGGLE SWITCH */}
                    <button
                      onClick={() => toggleItem(it.id)}
                      disabled={isToggling}
                      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 outline-none border-0 cursor-pointer ${
                        isActive ? 'bg-emerald-500' : 'bg-stone-300'
                      } ${isToggling ? 'opacity-50' : ''}`}
                      title={isActive ? 'Унтраах' : 'Асаах'}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>

                    {/* NAME & PRICE */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${!isActive ? 'line-through text-stone-400' : ''}`}>
                        {it.name}
                      </div>
                      <div className="text-xs text-stone-400">{it.price ? fmt(it.price) : '—'}</div>
                    </div>

                    {/* STATUS BADGE */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      {isActive ? 'Идэвхтэй' : 'Унтарсан'}
                    </span>

                    {/* EDIT & DELETE */}
                    <button
                      className="btn btn-sm !py-1 !px-2.5 flex-shrink-0"
                      onClick={() => startEdit(it)}
                      title="Засах">✏️</button>
                    <button
                      className="btn btn-red btn-sm !py-1 !px-2.5 flex-shrink-0"
                      onClick={() => delItem(it.id, it.name)}
                      title="Бүрмөсөн устгах">🗑️</button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* CHANGE PASSWORD */}
      <div className="card">
        <div className="ctitle">Нууц үг солих</div>
        <div className="flex flex-col gap-2 mb-2">
          <input className="inp" type="password" placeholder="Одоогийн нууц үг"
            value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} />
          <input className="inp" type="password" placeholder="Шинэ нууц үг (6+ тэмдэгт)"
            value={pwNew} onChange={e => setPwNew(e.target.value)} />
          <button className="btn" onClick={changePw}>🔑 Солих</button>
          {pwMsg && <p className="text-sm mt-1">{pwMsg}</p>}
        </div>
      </div>

      {/* LOGOUT */}
      <button className="btn btn-red w-full mb-6" onClick={logout}>🚪 Гарах</button>
    </div>
  )
}
