import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { api } from '../lib/api'
import { Item, Payment, ReportRow, CATEGORIES } from '../types'
import { barTodayStr, shiftDate, fmt, fmtN } from '../lib/utils'
import ReportPaper from '../components/ReportPaper'
import html2canvas from 'html2canvas'

interface Props {
  branchId: number
  branchName: string
  initialDate?: string
  branches: { id: number; name: string }[]
}

interface FixedPay {
  pos: string
  belen: string
  zarlaga: string
  zarlagaNote: string
  tsagiin: string
  nemelt: string
  nemeltNote: string
}

const EMPTY_PAY: FixedPay = {
  pos: '', belen: '', zarlaga: '', zarlagaNote: '', tsagiin: '', nemelt: '', nemeltNote: '',
}

function payToList(pay: FixedPay): Payment[] {
  const list: Payment[] = []
  if (parseInt(pay.pos))     list.push({ type: 'pos',     amount: parseInt(pay.pos),     note: '' })
  if (parseInt(pay.belen))   list.push({ type: 'belen',   amount: parseInt(pay.belen),   note: '' })
  if (parseInt(pay.zarlaga)) list.push({ type: 'expense', amount: parseInt(pay.zarlaga), note: pay.zarlagaNote })
  if (parseInt(pay.tsagiin)) list.push({ type: 'tsagiin', amount: parseInt(pay.tsagiin), note: '' })
  if (parseInt(pay.nemelt))  list.push({ type: 'nemelt',  amount: parseInt(pay.nemelt),  note: pay.nemeltNote })
  return list
}

function draftKey(branchId: number, date: string) {
  return `bar_draft_${branchId}_${date}`
}

export default function ReportPage({ branchId, branchName, initialDate, branches }: Props) {
  const [date, setDate] = useState(initialDate || barTodayStr())
  const [showTatalt, setShowTatalt] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [rows, setRows] = useState<Record<number, { opening: string; tatalt: string; etsiin: string }>>({})
  const [pay, setPay] = useState<FixedPay>(EMPTY_PAY)
  const [showReport, setShowReport] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const paperRef = useRef<HTMLDivElement>(null)
  const userModified = useRef(false)

  // Transfer state
  const [transferOut, setTransferOut] = useState<Record<number, string>>({})
  const [transferToBranch, setTransferToBranch] = useState<number>(0)
  const [incomingTransfers, setIncomingTransfers] = useState<Record<number, number>>({})

  const otherBranches = branches.filter(b => b.id !== branchId)
  const hasTransfer = otherBranches.length > 0

  useEffect(() => { api.getItems().then(setItems) }, [branchId])

  // Default target branch when branches change
  useEffect(() => {
    if (otherBranches.length > 0 && !transferToBranch) {
      setTransferToBranch(otherBranches[0].id)
    }
  }, [branches, branchId])

  // Auto-save draft when user edits
  useEffect(() => {
    if (!userModified.current) return
    localStorage.setItem(draftKey(branchId, date), JSON.stringify({ rows, pay, transferOut, transferToBranch }))
  }, [rows, pay, branchId, date, transferOut, transferToBranch])

  const loadForDate = useCallback(async (d: string) => {
    setShowReport(false)
    setSaved(false)
    userModified.current = false
    setTransferOut({})

    // Load incoming transfers
    try {
      const incoming = await api.getIncomingTransfers(branchId, d)
      const inc: Record<number, number> = {}
      incoming.forEach((t: any) => { inc[t.item_id] = (inc[t.item_id] || 0) + Number(t.quantity) })
      setIncomingTransfers(inc)
    } catch { setIncomingTransfers({}) }

    try {
      const rep = await api.getReport(branchId, d)
      const restored: Record<number, { opening: string; tatalt: string; etsiin: string }> = {}
      rep.rows.forEach((r: any) => {
        restored[r.item_id] = {
          opening: String(r.opening || ''),
          tatalt: String(r.tatalt || ''),
          etsiin: String(r.etsiin ?? ''),
        }
      })
      setRows(restored)
      const fp: FixedPay = { ...EMPTY_PAY }
      rep.payments.forEach((p: any) => {
        if (p.type === 'pos')          fp.pos = String(p.amount)
        else if (p.type === 'belen')   fp.belen = String(p.amount)
        else if (p.type === 'expense') { fp.zarlaga = String(p.amount); fp.zarlagaNote = p.note || '' }
        else if (p.type === 'tsagiin') fp.tsagiin = String(p.amount)
        else if (p.type === 'nemelt')  { fp.nemelt = String(p.amount); fp.nemeltNote = p.note || '' }
      })
      setPay(fp)
    } catch {
      // No saved report — try draft first, then carry
      const draftStr = localStorage.getItem(draftKey(branchId, d))
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr)
          setRows(draft.rows || {})
          setPay(draft.pay || EMPTY_PAY)
          setTransferOut(draft.transferOut || {})
          if (draft.transferToBranch) setTransferToBranch(draft.transferToBranch)
          return
        } catch {}
      }
      setPay(EMPTY_PAY)
      try {
        const carry = await api.getCarry(branchId, d)
        if (carry.rows?.length) {
          const carried: Record<number, { opening: string; tatalt: string; etsiin: string }> = {}
          carry.rows.forEach((r: any) => {
            carried[r.item_id] = { opening: String(r.etsiin ?? 0), tatalt: '', etsiin: '' }
          })
          setRows(carried)
        } else {
          setRows({})
        }
      } catch {
        setRows({})
      }
    }
  }, [branchId])

  useEffect(() => { loadForDate(date) }, [date, branchId, loadForDate])

  function updateRow(itemId: number, field: 'opening' | 'tatalt' | 'etsiin', val: string) {
    userModified.current = true
    setRows(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId] || { opening: '', tatalt: '', etsiin: '' }, [field]: val }
    }))
  }

  function updatePay(k: keyof FixedPay, v: string) {
    userModified.current = true
    setPay(prev => ({ ...prev, [k]: v }))
  }

  function updateTransferOut(itemId: number, val: string) {
    userModified.current = true
    setTransferOut(prev => ({ ...prev, [itemId]: val }))
  }

  const repRows = useMemo<ReportRow[]>(() => items.map(it => {
    const r = rows[it.id] || { opening: '', tatalt: '', etsiin: '' }
    const isGr = it.unit === 'гр'
    const parseVal = (v: string) => isGr ? (parseFloat(v) || 0) : (parseInt(v) || 0)
    const opening = parseVal(r.opening)
    const tatalt = parseVal(r.tatalt) + (incomingTransfers[it.id] || 0)
    const etsiin = r.etsiin !== '' ? parseVal(r.etsiin) : undefined
    const zarlaga = etsiin !== undefined ? Math.max(0, opening + tatalt - etsiin) : 0
    const mongon_dun = it.price && zarlaga ? Math.round(zarlaga * it.price) : 0
    return {
      item_id: it.id, item_name: it.name, category: it.category, price: it.price,
      opening, tatalt,
      etsiin: etsiin !== undefined ? etsiin : opening + tatalt - zarlaga,
      zarlaga, mongon_dun,
    }
  }), [items, rows, incomingTransfers])

  const total_sale = useMemo(() => repRows.reduce((s, r) => s + r.mongon_dun, 0), [repRows])
  const total_in = (parseInt(pay.pos) || 0) + (parseInt(pay.belen) || 0)
  const diff = total_in - total_sale

  const catTotals = useMemo(() =>
    CATEGORIES.map(cat => ({
      cat,
      total: repRows.filter(r => r.category === cat).reduce((s, r) => s + r.mongon_dun, 0),
    })),
    [repRows]
  )

  function buildReport() {
    return {
      date, branch_id: branchId,
      rows: repRows,
      payments: payToList(pay),
      total_sale, total_in, diff, note: '',
    }
  }

  async function doSave() {
    setLoading(true)
    try {
      await api.saveReport(buildReport())
      // Save inter-branch transfers
      if (hasTransfer && transferToBranch) {
        const transferItems = items
          .map(it => ({ item_id: it.id, quantity: parseFloat(transferOut[it.id] || '0') || 0 }))
        await api.saveTransfers({ date, from_branch_id: branchId, to_branch_id: transferToBranch, items: transferItems })
      }
      Object.keys(localStorage)
        .filter(k => k.startsWith(`bar_draft_${branchId}_`))
        .forEach(k => localStorage.removeItem(k))
      setSaved(true)
      setShowReport(true)
      setDate(d => shiftDate(d, 1))
    } catch (e: any) {
      alert('Алдаа: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSaveAndCarry() {
    const hasTatalt = items.some(it => parseInt(rows[it.id]?.tatalt || '') > 0)
    if (!hasTatalt) { setShowTatalt(true); return }
    doSave()
  }

  async function handlePNG() {
    setShowReport(true)
    setTimeout(async () => {
      if (!paperRef.current) return
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#fff' })
      const link = document.createElement('a')
      link.download = `tailan-${date}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }, 200)
  }

  function handlePrint() {
    setShowReport(true)
    setTimeout(() => window.print(), 200)
  }

  const numInp = { type: 'number', inputMode: 'decimal' as const, min: '0', placeholder: '0' }
  const grInp = { type: 'number', inputMode: 'decimal' as const, min: '0', step: '0.5', placeholder: '0' }
  const colSpan = hasTransfer ? 7 : 6
  const targetBranchName = branches.find(b => b.id === transferToBranch)?.name || 'Нөгөө'

  return (
    <div>
      {/* TATALT MODAL */}
      {showTatalt && (
        <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:20,padding:24,maxWidth:320,width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.25)',textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:10}}>⚠️</div>
            <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>Татлат оруулаагүй байна!</div>
            <div style={{fontSize:13,color:'#888',marginBottom:20}}>Өнөөдөр авч ирсэн барааг татлат хэсэгт оруулсан уу?</div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn" style={{flex:1}} onClick={() => { setShowTatalt(false); setTimeout(() => document.querySelector('.tatalt-inp')?.scrollIntoView({behavior:'smooth',block:'center'}), 100) }}>
                ✏️ Оруулна
              </button>
              <button className="btn btn-dark" style={{flex:1}} onClick={() => { setShowTatalt(false); doSave() }}>
                Татлатгүй хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATE NAV */}
      <div className="card">
        <div className="ctitle">Огноо</div>
        <div className="flex items-center gap-2">
          <button className="btn !px-3 !py-2.5 text-lg flex-shrink-0" onClick={() => setDate(d => shiftDate(d, -1))}>‹</button>
          <input className="inp flex-1" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn !px-3 !py-2.5 text-lg flex-shrink-0" onClick={() => setDate(d => shiftDate(d, 1))}>›</button>
        </div>
        {saved && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-emerald-700 text-sm">Хадгалагдлаа!</div>
              <div className="text-xs text-stone-500 mt-0.5">Дараагийн өдрийн эхний үлдэгдэл бэлэн боллоо</div>
            </div>
          </div>
        )}
      </div>

      {/* INVENTORY */}
      <div className="card no-print">
        <div className="ctitle flex items-center gap-2">
          <span>Барааны хөдөлгөөн</span>
          <span className="text-blue-500 normal-case font-semibold tracking-normal">— Эцсийн үлдэгдэл оруулна</span>
        </div>

        {/* Transfer target branch selector */}
        {hasTransfer && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-violet-600 whitespace-nowrap">→ Дамжуулах:</span>
            {otherBranches.length === 1
              ? <span className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-1">{otherBranches[0].name}</span>
              : <select className="inp !py-1 !text-sm flex-1" value={transferToBranch}
                  onChange={e => { userModified.current = true; setTransferToBranch(Number(e.target.value)) }}>
                  {otherBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            }
          </div>
        )}

        <div className="overflow-x-auto -mx-4 px-4">
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth: hasTransfer ? 430 : 360}}>
            <thead>
              <tr>
                <th style={{padding:'8px 6px',border:'1px solid #e5e5e0',background:'#f8f8f4',textAlign:'left',fontSize:10,fontWeight:700,color:'#888',whiteSpace:'nowrap',minWidth:100}}>Нэрс</th>
                <th style={{padding:'8px 6px',border:'1px solid #e5e5e0',background:'#f8f8f4',fontSize:10,fontWeight:700,color:'#888',textAlign:'center',minWidth:55}}>Эхний<br/>үлдэгдэл</th>
                <th style={{padding:'8px 6px',border:'1px solid #e5e5e0',background:'#f8f8f4',fontSize:10,fontWeight:700,color:'#888',textAlign:'center',minWidth:55}}>Татлат</th>
                {hasTransfer && (
                  <th style={{padding:'8px 6px',border:'1px solid #e5e5e0',background:'#f0eeff',fontSize:10,fontWeight:700,color:'#7c3aed',textAlign:'center',minWidth:50}}>→ {targetBranchName}</th>
                )}
                <th style={{padding:'8px 6px',border:'1px solid #e5e5e0',background:'#f8f8f4',fontSize:10,fontWeight:700,color:'#b52020',textAlign:'center',minWidth:50}}>Зарлага<br/><span style={{color:'#b52020',fontSize:9}}>(авто)</span></th>
                <th style={{padding:'8px 6px',border:'1px solid #e5e5e0',background:'#f8f8f4',fontSize:10,fontWeight:700,color:'#b07800',textAlign:'center',minWidth:70}}>Мөнгөн дүн<br/><span style={{color:'#888',fontSize:9}}>(авто)</span></th>
                <th style={{padding:'8px 6px',border:'1px solid #e5e5e0',background:'#f8f8f4',fontSize:10,fontWeight:700,color:'#1a6535',textAlign:'center',minWidth:55}}>Эцсийн<br/>үлдэгдэл</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const its = items.filter(i => i.category === cat)
                if (!its.length) return null
                return [
                  <tr key={cat}>
                    <td colSpan={colSpan} style={{background:'#1a1a1a',color:'#fff',fontWeight:700,fontSize:10,letterSpacing:1.5,padding:'5px 8px',textAlign:'center'}}>{cat}</td>
                  </tr>,
                  ...its.map((it, idx) => {
                    const r = rows[it.id] || { opening: '', tatalt: '', etsiin: '' }
                    const isGr = it.unit === 'гр'
                    const pv = (v: string) => isGr ? (parseFloat(v) || 0) : (parseInt(v) || 0)
                    const op = pv(r.opening)
                    const incTransfer = incomingTransfers[it.id] || 0
                    const tt = pv(r.tatalt) + incTransfer
                    const ets = r.etsiin !== '' ? pv(r.etsiin) : undefined
                    const zar = ets !== undefined ? Math.max(0, op + tt - ets) : undefined
                    const md = it.price && zar ? Math.round(zar * it.price) : undefined
                    const trOut = parseFloat(transferOut[it.id] || '0') || 0
                    return (
                      <tr key={it.id} style={{background: idx % 2 === 0 ? '#fff' : '#fafaf7'}}>
                        <td style={{border:'1px solid #e5e5e0',padding:'6px',fontWeight:500,fontSize:13,whiteSpace:'nowrap'}}>
                          {it.name}
                          {it.unit === 'гр' && <span style={{fontSize:9,fontWeight:700,background:'#fef3c7',color:'#b45309',borderRadius:4,padding:'1px 4px',marginLeft:4}}>гр</span>}
                        </td>

                        {/* OPENING */}
                        <td style={{border:'1px solid #e5e5e0',padding:'4px',textAlign:'center'}}>
                          <input className="inp-sm" {...(isGr ? grInp : numInp)} value={r.opening} onChange={e => updateRow(it.id, 'opening', e.target.value)} />
                          {isGr && op > 0 && (
                            <div style={{fontSize:9,color:'#b45309',fontWeight:700,lineHeight:1.2,marginTop:1}}>{Math.round(op * 100)}гр</div>
                          )}
                        </td>

                        {/* TATALT */}
                        <td style={{border:'1px solid #e5e5e0',padding:'4px',textAlign:'center'}}>
                          <input className="inp-sm tatalt-inp" {...(isGr ? grInp : numInp)} value={r.tatalt} onChange={e => updateRow(it.id, 'tatalt', e.target.value)} />
                          {isGr && pv(r.tatalt) > 0 && (
                            <div style={{fontSize:9,color:'#b45309',fontWeight:700,lineHeight:1.2,marginTop:1}}>{Math.round(pv(r.tatalt) * 100)}гр</div>
                          )}
                          {incTransfer > 0 && (
                            <div style={{fontSize:9,color:'#1a6535',fontWeight:700,lineHeight:1.2,marginTop:1}}>+{incTransfer} ирэлт</div>
                          )}
                        </td>

                        {/* TRANSFER OUT */}
                        {hasTransfer && (
                          <td style={{border:'1px solid #e5e5e0',padding:'4px',textAlign:'center',background:'#f5f3ff'}}>
                            <input className="inp-sm" {...(isGr ? grInp : numInp)}
                              value={transferOut[it.id] || ''}
                              onChange={e => updateTransferOut(it.id, e.target.value)}
                              style={{color:'#7c3aed'}} />
                            {isGr && trOut > 0 && (
                              <div style={{fontSize:9,color:'#7c3aed',fontWeight:700,lineHeight:1.2,marginTop:1}}>{Math.round(trOut * 100)}гр</div>
                            )}
                          </td>
                        )}

                        {/* ZARLAGA (auto) */}
                        <td style={{border:'1px solid #e5e5e0',padding:'4px',textAlign:'center',fontWeight:700,color:'#b52020',fontSize:13}}>
                          {zar !== undefined && zar > 0 ? zar : ''}
                          {isGr && zar !== undefined && zar > 0 && (
                            <div style={{fontSize:9,color:'#b52020',fontWeight:700,lineHeight:1.2}}>{Math.round(zar * 100)}гр</div>
                          )}
                        </td>

                        {/* MONGON DUN */}
                        <td style={{border:'1px solid #e5e5e0',padding:'4px',textAlign:'center',fontWeight:700,color:'#b07800',fontSize:13}}>
                          {md ? fmtN(md) : ''}
                        </td>

                        {/* ETSIIN */}
                        <td style={{border:'1px solid #e5e5e0',padding:'4px',textAlign:'center'}}>
                          <input className="inp-sm" {...(isGr ? grInp : numInp)}
                            value={r.etsiin}
                            style={{borderColor: r.etsiin ? '#1a6535' : undefined, color:'#1a6535', fontWeight: r.etsiin ? 700 : undefined}}
                            onChange={e => updateRow(it.id, 'etsiin', e.target.value)} />
                          {isGr && pv(r.etsiin) > 0 && (
                            <div style={{fontSize:9,color:'#1a6535',fontWeight:700,lineHeight:1.2,marginTop:1}}>{Math.round(pv(r.etsiin) * 100)}гр</div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ]
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENTS — fixed rows */}
      <div className="card no-print">
        <div className="ctitle">Орлого оруулах</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <tbody>
            <tr>
              <td style={{padding:'6px 4px 6px 0',fontWeight:600,width:'38%',fontSize:13,whiteSpace:'nowrap'}}>POS</td>
              <td style={{padding:'4px 0'}}>
                <input className="inp" {...numInp} value={pay.pos} onChange={e => updatePay('pos', e.target.value)} />
              </td>
            </tr>
            <tr>
              <td style={{padding:'6px 4px 6px 0',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>Бэлэн мөнгө</td>
              <td style={{padding:'4px 0'}}>
                <input className="inp" {...numInp} value={pay.belen} onChange={e => updatePay('belen', e.target.value)} />
              </td>
            </tr>
            <tr>
              <td style={{padding:'6px 4px 6px 0',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>Зарлага</td>
              <td style={{padding:'4px 0'}}>
                <div className="flex gap-2">
                  <input className="inp flex-1" {...numInp} value={pay.zarlaga} onChange={e => updatePay('zarlaga', e.target.value)} />
                  <input className="inp flex-1" type="text" placeholder="Тэмдэглэл..." value={pay.zarlagaNote} onChange={e => updatePay('zarlagaNote', e.target.value)} />
                </div>
              </td>
            </tr>
            <tr>
              <td style={{padding:'6px 4px 6px 0',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>Цагийн мөнгө</td>
              <td style={{padding:'4px 0'}}>
                <input className="inp" {...numInp} value={pay.tsagiin} onChange={e => updatePay('tsagiin', e.target.value)} />
              </td>
            </tr>
            <tr>
              <td style={{padding:'6px 4px 6px 0',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>Нэмэлт</td>
              <td style={{padding:'4px 0'}}>
                <div className="flex gap-2">
                  <input className="inp flex-1" {...numInp} value={pay.nemelt} onChange={e => updatePay('nemelt', e.target.value)} />
                  <input className="inp flex-1" type="text" placeholder="Тэмдэглэл..." value={pay.nemeltNote} onChange={e => updatePay('nemeltNote', e.target.value)} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ALWAYS-VISIBLE SUMMARY */}
      <div className="card no-print">
        <div className="ctitle">Дүн</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {catTotals.map(({ cat, total }) => (
            <div key={cat} className="flex-1 min-w-[90px] bg-stone-50 border border-stone-200 rounded-xl p-2 text-center">
              <div style={{fontSize:9,fontWeight:700,color:'#aaa',letterSpacing:0.5,marginBottom:2,lineHeight:1.2}}>{cat}</div>
              <div style={{fontSize:13,fontWeight:700,color: total > 0 ? '#b07800' : '#ccc'}}>{total > 0 ? fmtN(total) : '—'}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[120px] bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-1">Нийт борлуулалт</div>
            <div className="text-lg font-bold text-amber-700">{fmt(total_sale)}</div>
          </div>
          <div className="flex-1 min-w-[120px] bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-1">POS + Бэлэн орлого</div>
            <div className="text-lg font-bold text-blue-700">{fmt(total_in)}</div>
          </div>
          <div className={`flex-1 min-w-[120px] rounded-xl p-3 text-center border ${diff > 0 ? 'bg-emerald-50 border-emerald-200' : diff < 0 ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-200'}`}>
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1 text-stone-400">Зөрүү</div>
            <div className={`text-lg font-bold ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-stone-500'}`}>
              {diff >= 0 ? '+' : ''}{fmt(diff)}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <button className="btn btn-dark w-full mb-2 no-print" onClick={handleSaveAndCarry} disabled={loading}>
        {loading ? '⏳ Хадгалж байна...' : '✅ Тайлан хадгалаад дараагийн өдөр болгох'}
      </button>
      <div className="flex gap-2 mb-4 no-print">
        <button className="btn flex-1" onClick={handlePNG} title="PNG татах">📥 PNG татах</button>
        <button className="btn flex-1" onClick={handlePrint} title="Хэвлэх">🖨️ Хэвлэх</button>
      </div>

      {/* REPORT PAPER (PNG/print үед) */}
      {showReport && (
        <div className="mb-4 overflow-x-auto">
          <ReportPaper ref={paperRef} report={buildReport()} branchName={branchName} />
        </div>
      )}
    </div>
  )
}
