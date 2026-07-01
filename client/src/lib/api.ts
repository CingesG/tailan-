const BASE = '/api'

function getToken() {
  return localStorage.getItem('bar_token') || ''
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Алдаа гарлаа')
  return data as T
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    req<{ token: string; username: string }>('POST', '/auth/login', { username, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    req('POST', '/auth/change-password', { currentPassword, newPassword }),

  // Branches
  getBranches: () => req<any[]>('GET', '/branches'),
  addBranch: (name: string) => req<any>('POST', '/branches', { name }),
  deleteBranch: (id: number) => req('DELETE', `/branches/${id}`),

  // Items
  getItems: (all = false) => req<any[]>('GET', `/items${all ? '?all=1' : ''}`),
  addItem: (data: { name: string; category: string; price: number; unit?: string; gram_unit?: number }) => req<any>('POST', '/items', data),
  updateItem: (id: number, data: { name: string; category: string; price: number; unit?: string; gram_unit?: number }) =>
    req('PUT', `/items/${id}`, data),
  toggleItem: (id: number) => req<{ ok: boolean; active: number }>('PATCH', `/items/${id}/toggle`),
  deleteItem: (id: number) => req('DELETE', `/items/${id}`),

  // Transfers
  getIncomingTransfers: (branchId: number, date: string) =>
    req<any[]>('GET', `/transfers/incoming?branch_id=${branchId}&date=${date}`),
  getOutgoingTransfers: (fromBranchId: number, date: string, toBranchId?: number) =>
    req<any[]>('GET', `/transfers/outgoing?from_branch_id=${fromBranchId}&date=${date}${toBranchId ? `&to_branch_id=${toBranchId}` : ''}`),
  saveTransfers: (data: { date: string; from_branch_id: number; to_branch_id: number; items: { item_id: number; quantity: number }[] }) =>
    req<{ ok: boolean }>('POST', '/transfers', data),

  // Reports
  getReportMonths: () => req<string[]>('GET', '/reports/months/all'),
  deleteReportMonth: (yearMonth: string) => req<{ ok: boolean }>('DELETE', `/reports/month/${yearMonth}`),
  getReports: (branch_id: number, year?: string, month?: string) => {
    const q = new URLSearchParams({ branch_id: String(branch_id) })
    if (year) q.set('year', year)
    if (month) q.set('month', month)
    return req<any[]>('GET', `/reports?${q}`)
  },
  getReport: (branchId: number, date: string) =>
    req<any>('GET', `/reports/${branchId}/${date}`),
  getCarry: (branchId: number, date: string) =>
    req<any>('GET', `/reports/carry/${branchId}/${date}`),
  saveReport: (data: unknown) => req<{ ok: boolean; id: number }>('POST', '/reports', data),
  deleteReport: (id: number) => req('DELETE', `/reports/${id}`),
}
