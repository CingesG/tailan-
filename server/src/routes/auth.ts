import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/database'
import { JWT_SECRET, authMiddleware } from '../middleware/auth'
const router = Router()
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Нэвтрэх нэр, нууц үг оруулна уу' })
    const user = await db('users').where('username', username).first()
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Буруу нэр эсвэл нууц үг' })
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ token, username: user.username })
  } catch(e) { return res.status(500).json({ error: String(e) }) }
})
router.post('/change-password', authMiddleware, async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Нууц үг 6+ тэмдэгт' })
    const user = await db('users').where('id', req.userId).first()
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Одоогийн нууц үг буруу' })
    await db('users').where('id', req.userId).update({ password: bcrypt.hashSync(newPassword, 10) })
    return res.json({ ok: true })
  } catch(e) { return res.status(500).json({ error: String(e) }) }
})
export default router
