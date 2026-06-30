export interface Branch {
  id: number
  name: string
}

export interface Item {
  id: number
  name: string
  category: string
  price: number
  sort_order: number
  unit?: string
}

export interface Payment {
  id?: number
  type: 'pos' | 'shiljuuleg' | 'belen' | 'zeel' | 'expense' | 'tsagiin' | 'nemelt'
  amount: number
  note: string
}

export interface ReportRow {
  item_id: number
  item_name: string
  category: string
  opening: number
  tatalt: number
  etsiin: number | undefined
  zarlaga: number   // computed: opening + tatalt - etsiin
  mongon_dun: number // computed: zarlaga * price
  price: number
}

export interface Report {
  id?: number
  branch_id: number
  date: string
  total_sale: number
  total_in: number
  diff: number
  note: string
  rows: ReportRow[]
  payments: Payment[]
}

export const CATEGORIES = ['ПИВО', 'АРХИ', 'ВИСКИ', 'СОЖУ / ДАРС', 'УНДАА АМТТАН'] as const

export const PAY_TYPES = {
  pos: 'POS',
  shiljuuleg: 'Шилжүүлэг',
  belen: 'Бэлэн мөнгө',
  zeel: 'Зээл',
  expense: 'Зарлага',
  tsagiin: 'Цагийн мөнгө',
  nemelt: 'Нэмэлт',
} as const

export const PAY_COLORS: Record<string, string> = {
  pos: '#1a40b0',
  shiljuuleg: '#0e7490',
  belen: '#1a6535',
  zeel: '#7a309a',
  expense: '#b52020',
  tsagiin: '#b07800',
  nemelt: '#555',
}

export const PAY_BG: Record<string, string> = {
  pos: '#edf2ff',
  shiljuuleg: '#ecfeff',
  belen: '#edfaf3',
  zeel: '#f9eeff',
  expense: '#fef0f0',
  tsagiin: '#fffbeb',
  nemelt: '#f5f5f5',
}
