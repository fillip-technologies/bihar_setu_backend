import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { Admin } from '../models/Admin.js'

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authentication required' })

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const admin = await Admin.findById(payload.sub).select('email').lean()
    if (!admin) throw new Error('unknown admin')
    req.admin = { id: String(admin._id), email: admin.email }
    next()
  } catch {
    res.status(401).json({ message: 'Session expired. Please sign in again.' })
  }
}
