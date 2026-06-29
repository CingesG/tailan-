export function fmt(n: number) {
  return (n || 0).toLocaleString('mn-MN') + '₮'
}
export function fmtN(n: number) {
  return (n || 0).toLocaleString('mn-MN')
}
export function formatDate(s: string) {
  if (!s) return ''
  return new Date(s + 'T00:00:00').toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  })
}
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Баарны өдөр: 15:00-04:00. 00:00-03:59 → өмнөх өдөр
export function barTodayStr(): string {
  const now = new Date()
  if (now.getHours() < 4) {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return localDateStr(d)
  }
  return localDateStr(now)
}
export function todayStr(): string {
  return barTodayStr()
}
export function shiftDate(date: string, delta: number) {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return localDateStr(d)
}
