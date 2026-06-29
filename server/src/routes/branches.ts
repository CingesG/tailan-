import { Router, Response } from 'express'
import { db } from '../db/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
const router = Router()
router.use(authMiddleware)
router.get('/', async (_req: AuthRequest, res: Response) => {
  try { res.json(await db('branches').orderBy('id')) } catch(e) { res.status(500).json({ error: String(e) }) }
})
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Нэр оруулна уу' })
    const [id] = await db('branches').insert({ name: name.trim() })
    res.json({ id, name: name.trim() })
  } catch { res.status(400).json({ error: 'Аль хэдийн байна' }) }
})
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const count = (await db('branches').count('id as c').first() as any).c
    if (count <= 1) return res.status(400).json({ error: 'Хамгийн багадаа 1 салбар' })
    await db('branches').where('id', Number(req.params.id)).delete()
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: String(e) }) }
})
export default router
