import { Router, Response } from 'express'
import { db } from '../db/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
const router = Router()
router.use(authMiddleware)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { branch_id, year, month } = req.query
    if (!branch_id) return res.status(400).json({ error: 'branch_id шаардлагатай' })
    let q = db('reports as r').join('branches as b','b.id','r.branch_id').where('r.branch_id', Number(branch_id)).select('r.*','b.name as branch_name').orderBy('r.date','desc')
    if (year && month) q = q.whereLike('r.date', String(year)+'-'+String(month).padStart(2,'0')+'%')
    else if (year) q = q.whereLike('r.date', String(year)+'%')
    res.json(await q)
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.get('/months/all', async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db('reports').distinct(db.raw("substr(date,1,7) as month")).orderBy('month','asc')
    res.json(rows.map((r: any) => r.month))
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.get('/carry/:branchId/:date', async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, date } = req.params
    const prev = await db('reports').where('branch_id', Number(branchId)).where('date','<',date).orderBy('date','desc').first()
    if (!prev) return res.json({ rows: [] })
    const rows = await db('report_rows').where('report_id', prev.id)
    res.json({ date: prev.date, rows })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.get('/:branchId/:date', async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, date } = req.params
    const report = await db('reports').where('branch_id', Number(branchId)).where('date', date).first()
    if (!report) return res.status(404).json({ error: 'Тайлан олдсонгүй' })
    const rows = await db('report_rows').where('report_id', report.id)
    const payments = await db('report_payments').where('report_id', report.id)
    res.json({ ...report, rows, payments })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { branch_id, date, rows, payments, total_sale, total_in, diff, note } = req.body
    if (!branch_id || !date) return res.status(400).json({ error: 'branch_id, date шаардлагатай' })
    const existing = await db('reports').where('branch_id', branch_id).where('date', date).first()
    let reportId: number
    if (existing) {
      await db('reports').where('id', existing.id).update({ total_sale:total_sale||0, total_in:total_in||0, diff:diff||0, note:note||'', saved_at: new Date().toISOString() })
      reportId = existing.id
      await db('report_rows').where('report_id', reportId).delete()
      await db('report_payments').where('report_id', reportId).delete()
    } else {
      const [id] = await db('reports').insert({ branch_id, date, total_sale:total_sale||0, total_in:total_in||0, diff:diff||0, note:note||'' })
      reportId = id
    }
    if (rows?.length) await db('report_rows').insert(rows.map((r: any) => ({ report_id:reportId, item_id:r.item_id||0, item_name:r.item_name, category:r.category||'', price:r.price||0, opening:r.opening||0, tatalt:r.tatalt||0, zarlaga:r.zarlaga||0, etsiin:r.etsiin||0, mongon_dun:r.mongon_dun||0 })))
    if (payments?.length) await db('report_payments').insert(payments.map((p: any) => ({ report_id:reportId, type:p.type, amount:p.amount||0, note:p.note||'' })))
    res.json({ ok: true, id: reportId })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.delete('/month/:yearMonth', async (req: AuthRequest, res: Response) => {
  try {
    const reports = await db('reports').where('date','like', req.params.yearMonth + '%').select('id')
    for (const r of reports) {
      await db('report_payments').where('report_id', r.id).delete()
      await db('report_rows').where('report_id', r.id).delete()
    }
    await db('reports').where('date','like', req.params.yearMonth + '%').delete()
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await db('report_rows').where('report_id', Number(req.params.id)).delete()
    await db('report_payments').where('report_id', Number(req.params.id)).delete()
    await db('reports').where('id', Number(req.params.id)).delete()
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
export default router
