import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'bar-secret-2024-change-in-production'

export interface AuthRequest extends Request {
  userId?: number
  username?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' })
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; username: string }
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    return res.status(401).json({ error: 'Token хүчингүй' })
  }
}

export { JWT_SECRET }
