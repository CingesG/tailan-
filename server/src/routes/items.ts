import { Router, Response } from 'express'
import { db } from '../db/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
const router = Router()
router.use(authMiddleware)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const q = db('items').orderBy(['category','sort_order','name'])
    if (req.query.all !== '1') q.where('active', 1)
    res.json(await q)
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, price, unit, gram_unit } = req.body
    if (!name?.trim() || !category) return res.status(400).json({ error: 'Нэр, ангилал оруулна уу' })
    const maxRow = await db('items').where('category', category).max('sort_order as m').first() as any
    const [id] = await db('items').insert({ name: name.trim(), category, price: price||0, sort_order: (maxRow?.m||0)+1, unit: unit||'ш', gram_unit: gram_unit||100 })
    res.json({ id, name: name.trim(), category, price: price||0, unit: unit||'ш', gram_unit: gram_unit||100 })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, price, unit, gram_unit } = req.body
    await db('items').where('id', Number(req.params.id)).update({ name, category, price: price||0, unit: unit||'ш', gram_unit: gram_unit||100 })
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const item = await db('items').where('id', Number(req.params.id)).first()
    if (!item) return res.status(404).json({ error: 'Олдсонгүй' })
    const newActive = item.active === 1 ? 0 : 1
    await db('items').where('id', item.id).update({ active: newActive })
    res.json({ ok: true, active: newActive })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try { await db('items').where('id', Number(req.params.id)).delete(); res.json({ ok: true }) }
  catch(e) { res.status(500).json({ error: String(e) }) }
})
export default router
