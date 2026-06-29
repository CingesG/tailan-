import { useState } from 'react'
import { Payment, PAY_TYPES, PAY_COLORS, PAY_BG } from '../types'
import { fmt } from '../lib/utils'

interface Props {
  payments: Payment[]
  onChange: (payments: Payment[]) => void
}

const PAY_TYPE_LIST = Object.entries(PAY_TYPES) as [Payment['type'], string][]

export default function PaymentSection({ payments, onChange }: Props) {
  const [type, setType] = useState<Payment['type']>('pos')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  function add() {
    const amt = parseInt(amount) || 0
    if (!amt) return
    onChange([...payments, { type, amount: amt, note }])
    setAmount('')
    setNote('')
  }

  function remove(i: number) {
    onChange(payments.filter((_, idx) => idx !== i))
  }

  // totals
  const tot: Record<string, number> = {}
  payments.forEach(p => tot[p.type] = (tot[p.type] || 0) + p.amount)
  const totalIn = (tot.pos || 0) + (tot.shiljuuleg || 0) + (tot.belen || 0)

  return (
    <div>
      {/* ADD ROW */}
      <div className="flex gap-2 mb-2">
        <select className="inp flex-1 text-sm"
          value={type} onChange={e => setType(e.target.value as Payment['type'])}>
          {PAY_TYPE_LIST.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="inp-num flex-1 text-sm" type="number" inputMode="numeric"
          placeholder="0" value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn btn-dark px-4 py-2.5 text-sm rounded-lg" onClick={add}>➕</button>
      </div>
      <div className="flex gap-2 mb-3">
        <input className="inp text-sm" placeholder="Тэмдэглэл..." value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
      </div>

      {/* LIST */}
      {payments.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
          <span className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
            style={{ background: PAY_BG[p.type], color: PAY_COLORS[p.type] }}>
            {PAY_TYPES[p.type]}
          </span>
          {p.note && <span className="text-xs text-stone-500 flex-1 truncate">{p.note}</span>}
          {!p.note && <span className="flex-1" />}
          <span className="font-bold text-sm flex-shrink-0">{fmt(p.amount)}</span>
          <button className="btn btn-red btn-sm !py-1 !px-2" onClick={() => remove(i)}>✕</button>
        </div>
      ))}

      {/* TOTALS */}
      {payments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-100">
          {Object.entries(tot).map(([k, v]) => (
            <div key={k} className="flex-1 min-w-[90px] bg-stone-50 border border-stone-200 rounded-lg p-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
                style={{ color: PAY_COLORS[k] }}>{PAY_TYPES[k as Payment['type']] || k}</div>
              <div className="text-base font-bold" style={{ color: PAY_COLORS[k] }}>{fmt(v)}</div>
            </div>
          ))}
          <div className="flex-1 min-w-[90px] bg-stone-50 border border-stone-200 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1">Нийт орлого</div>
            <div className="text-base font-bold text-amber-700">{fmt(totalIn)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
