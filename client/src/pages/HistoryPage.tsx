import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { fmt, formatDate } from '../lib/utils'
import ReportPaper from '../components/ReportPaper'
import html2canvas from 'html2canvas'

interface Props {
  branchId: number
  branchName: string
  onEditDate: (date: string) => void
}

export default function HistoryPage({ branchId, branchName, onEditDate }: Props) {
  const [reports, setReports] = useState<any[]>([])
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [month, setMonth] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [expandedData, setExpandedData] = useState<any>(null)
  const paperRef = useRef<HTMLDivElement>(null)

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  useEffect(() => { loadReports() }, [branchId, year, month])

  async function loadReports() {
    const data = await api.getReports(branchId, year, month || undefined)
    setReports(data)
    setExpanded(null)
  }

  async function expand(rep: any) {
    if (expanded === rep.id) { setExpanded(null); return }
    setExpanded(rep.id)
    const full = await api.getReport(branchId, rep.date)
    setExpandedData(full)
  }

  async function handleDelete(id: number, date: string) {
    if (!confirm(date + ' тайланг устгах уу?')) return
    await api.deleteReport(id)
    loadReports()
  }

  async function handlePNG() {
    if (!paperRef.current) return
    const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#fff' })
    const link = document.createElement('a')
    link.download = `tailan-${expandedData?.date}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const totalSale = reports.reduce((s, r) => s + (r.total_sale || 0), 0)
  const totalIn = reports.reduce((s, r) => s + (r.total_in || 0), 0)

  // Build report object for ReportPaper
  function buildRepObj(full: any) {
    return {
      date: full.date,
      branch_id: branchId,
      rows: (full.rows || []).map((r: any) => ({
        ...r,
        category: r.category || '',
        price: r.price || 0,
        zarlaga: r.zarlaga || 0,
        mongon_dun: r.mongon_dun || 0,
        etsiin: r.etsiin,
      })),
      payments: full.payments || [],
      total_sale: full.total_sale || 0,
      total_in: full.total_in || 0,
      diff: full.diff || 0,
      note: full.note || '',
    }
  }

  return (
    <div>
      <div className="card">
        <div className="ctitle">Тайлангийн түүх — {branchName}</div>

        {/* FILTERS */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <select className="inp flex-1 min-w-[90px]" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y} он</option>)}
          </select>
          <select className="inp flex-1 min-w-[90px]" value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">Бүх сар</option>
            {Array.from({length:12},(_,i)=>i+1).map(m=>(
              <option key={m} value={String(m).padStart(2,'0')}>{m}-р сар</option>
            ))}
          </select>
        </div>

        {/* MONTHLY SUMMARY */}
        {reports.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <div className="flex-1 min-w-[100px] bg-stone-50 border border-stone-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-1">{reports.length} өдөр</div>
              <div className="text-sm font-bold">{reports.length} тайлан</div>
            </div>
            <div className="flex-1 min-w-[100px] bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Нийт борлуулалт</div>
              <div className="text-sm font-bold text-amber-700">{fmt(totalSale)}</div>
            </div>
            <div className="flex-1 min-w-[100px] bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">Нийт орлого</div>
              <div className="text-sm font-bold text-blue-700">{fmt(totalIn)}</div>
            </div>
          </div>
        )}

        {/* LIST */}
        {!reports.length && (
          <p className="text-stone-400 text-sm py-4 text-center">Тайлан байхгүй байна</p>
        )}

        {reports.map(rep => {
          const diff = rep.diff || 0
          const isOpen = expanded === rep.id
          return (
            <div key={rep.id} className="border border-stone-200 rounded-xl mb-2 overflow-hidden">
              {/* ROW */}
              <div className="flex items-center gap-2 p-3 bg-white cursor-pointer" onClick={() => expand(rep)}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{formatDate(rep.date)}</div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    Зөрүү:&nbsp;
                    <span className={`font-bold ${diff>0?'text-emerald-600':diff<0?'text-red-600':'text-stone-400'}`}>
                      {diff>=0?'+':''}{fmt(diff)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-amber-700">{fmt(rep.total_sale)}</div>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5">{fmt(rep.total_in)}</div>
                </div>
                <div className="text-stone-400 text-lg ml-1">{isOpen ? '▲' : '▼'}</div>
              </div>

              {/* EXPANDED */}
              {isOpen && expandedData && expandedData.date === rep.date && (
                <div className="border-t border-stone-100 bg-stone-50 p-3">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <button className="btn btn-sm flex-1"
                      onClick={() => { onEditDate(rep.date) }}>
                      ✏️ Засах
                    </button>
                    <button className="btn btn-sm flex-1" onClick={handlePNG}>📥 PNG</button>
                    <button className="btn btn-sm flex-1" onClick={() => window.print()}>🖨️</button>
                    <button className="btn btn-red btn-sm" onClick={() => handleDelete(rep.id, rep.date)}>🗑️</button>
                  </div>
                  <div className="overflow-x-auto">
                    <ReportPaper
                      ref={paperRef}
                      report={buildRepObj(expandedData)}
                      branchName={branchName}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
