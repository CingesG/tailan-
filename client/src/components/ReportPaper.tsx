import { forwardRef } from 'react'
import { Report, PAY_TYPES } from '../types'
import { fmt, fmtN, formatDate } from '../lib/utils'
import { CATEGORIES } from '../types'

interface Props {
  report: Report
  branchName: string
}

const ReportPaper = forwardRef<HTMLDivElement, Props>(({ report, branchName }, ref) => {
  const { rows, payments, total_sale, total_in, diff } = report

  const ptot: Record<string, number> = {}
  payments.forEach(p => ptot[p.type] = (ptot[p.type] || 0) + p.amount)
  const incomePays = payments.filter(p => p.type === 'pos' || p.type === 'shiljuuleg' || p.type === 'belen')

  return (
    <div ref={ref} className="print-paper bg-white p-5 font-mono text-xs" style={{ minWidth: 360 }}>
      {/* HEADER */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <div className="text-lg font-bold">🍺 АЖЛЫН ТАЙЛАН</div>
        <div className="text-xs text-stone-600 mt-0.5">
          {formatDate(report.date)} &nbsp;|&nbsp; {branchName}
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 380 }}>
          <thead>
            <tr>
              {['Нэрс', 'Эхний үлд.', 'Татлат', 'Зарлага', 'Мөнгөн дүн', 'Бусад', 'Эцсийн үлд.'].map(h => (
                <th key={h} style={{ border: '1px solid #777', padding: '4px 5px', background: '#ddd', fontWeight: 700, textAlign: h === 'Нэрс' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => {
              const catRows = rows.filter(r => r.category === cat)
              if (!catRows.length) return null
              return [
                <tr key={cat}>
                  <td colSpan={7} style={{ background: '#222', color: '#fff', fontWeight: 700, letterSpacing: 1, fontSize: 10, padding: '4px 6px', textAlign: 'center' }}>{cat}</td>
                </tr>,
                ...catRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8f8f4' }}>
                    <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'left' }}>{r.item_name}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{r.opening || ''}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{r.tatalt || ''}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{r.zarlaga || ''}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{r.mongon_dun ? fmtN(r.mongon_dun) : ''}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}></td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{r.etsiin !== undefined ? r.etsiin : ''}</td>
                  </tr>
                ))
              ]
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: 10, borderTop: '2px solid #111', paddingTop: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Бэлэн/POS/Шилжүүлэг', 'Зээл', 'Бусад зарлага', 'Нийт борлуулалт', 'Нийт орлого'].map(h => (
                <th key={h} style={{ border: '1px solid #ccc', padding: '5px 6px', background: '#eee', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'center', fontSize: 10 }}>
                {incomePays.map((p, i) => <div key={i}>{PAY_TYPES[p.type]}: {fmtN(p.amount)}</div>)}
                <strong>{fmtN(total_in)}</strong>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'center' }}>{ptot.zeel ? fmtN(ptot.zeel) : '—'}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'center' }}>{ptot.expense ? fmtN(ptot.expense) : '—'}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'center' }}><strong>{fmtN(total_sale)}</strong></td>
              <td style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'center' }}><strong>{fmtN(total_in)}</strong></td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'right', fontWeight: 700, background: '#eee' }}>Зөрүү:</td>
              <td colSpan={2} style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'center', background: '#eee', fontWeight: 700, fontSize: 13, color: diff > 0 ? '#1a6535' : diff < 0 ? '#b52020' : '#555' }}>
                {diff >= 0 ? '+' : ''}{fmtN(diff)} {diff > 0 ? '(илүү)' : diff < 0 ? '(дутуу)' : '✓'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* DIFF BANNER */}
      <div className={`mt-3 p-3 rounded-lg border ${diff > 0 ? 'bg-emerald-50 border-emerald-200' : diff < 0 ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-200'}`}>
        <div className={`text-lg font-bold ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-stone-500'}`}>
          {diff >= 0 ? '+' : ''}{fmt(diff)}
        </div>
        <div className={`text-xs mt-0.5 ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-stone-400'}`}>
          {diff > 0 ? 'Орлого илүү байна' : diff < 0 ? 'Орлого дутуу байна' : 'Орлого таарч байна ✓'}
        </div>
      </div>
    </div>
  )
})

ReportPaper.displayName = 'ReportPaper'
export default ReportPaper
