import { Router, Response } from 'express'
import { db } from '../db/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
const router = Router()
router.use(authMiddleware)

router.get('/incoming', async (req: AuthRequest, res: Response) => {
  try {
    const { branch_id, date } = req.query
    if (!branch_id || !date) return res.status(400).json({ error: 'branch_id, date шаардлагатай' })
    const rows = await db('transfers as t')
      .join('branches as b', 'b.id', 't.from_branch_id')
      .where('t.to_branch_id', Number(branch_id))
      .where('t.date', String(date))
      .select('t.item_id', 't.quantity', 'b.name as from_branch_name')
    res.json(rows)
  } catch(e) { res.status(500).json({ error: String(e) }) }
})

router.get('/outgoing', async (req: AuthRequest, res: Response) => {
  try {
    const { from_branch_id, date, to_branch_id } = req.query
    if (!from_branch_id || !date) return res.status(400).json({ error: 'from_branch_id, date шаардлагатай' })
    let q = db('transfers').where('from_branch_id', Number(from_branch_id)).where('date', String(date))
    if (to_branch_id) q = q.where('to_branch_id', Number(to_branch_id))
    res.json(await q.select('item_id', 'quantity', 'to_branch_id'))
  } catch(e) { res.status(500).json({ error: String(e) }) }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { date, from_branch_id, to_branch_id, items } = req.body
    if (!date || !from_branch_id || !to_branch_id) return res.status(400).json({ error: 'date, from_branch_id, to_branch_id шаардлагатай' })
    await db('transfers').where({ date, from_branch_id: Number(from_branch_id), to_branch_id: Number(to_branch_id) }).delete()
    const toInsert = (items || []).filter((i: any) => Number(i.quantity) > 0).map((i: any) => ({
      date, from_branch_id: Number(from_branch_id), to_branch_id: Number(to_branch_id),
      item_id: Number(i.item_id), quantity: Number(i.quantity),
    }))
    if (toInsert.length) await db('transfers').insert(toInsert)
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})

export default router
