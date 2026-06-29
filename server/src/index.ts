import express from 'express'
import cors from 'cors'
import path from 'path'
import { initDb } from './db/database'
import authRoutes from './routes/auth'
import branchRoutes from './routes/branches'
import itemRoutes from './routes/items'
import reportRoutes from './routes/reports'

const app = express()
const PORT = process.env.PORT || 3001

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: true }))
}
app.use(express.json({ limit: '10mb' }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/reports', reportRoutes)

// Serve built frontend in production
const distPath = path.join(__dirname, '../../client/dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

initDb()
app.listen(PORT, () => {
  console.log(`🍺 Bar server running on http://localhost:${PORT}`)
})
