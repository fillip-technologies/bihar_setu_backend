import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import { env } from './config/env.js'
import { UPLOADS_DIR } from './config/storage.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'

const app = express()

app.set('trust proxy', env.trustProxy)
app.use(helmet())
app.use(cors({ origin: env.corsOrigins, exposedHeaders: ['Content-Disposition'] }))
app.use(express.json({ limit: '1mb' }))

// Uploaded website images. Cross-origin so the site can load them when the API runs on another domain.
app.use(
  '/uploads',
  helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
  express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true, fallthrough: false }),
)

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }))

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is larger than 8MB. Please upload a smaller file.' : err.message
    return res.status(400).json({ message })
  }
  if (err.status === 400) return res.status(400).json({ message: err.message })
  if (err.status === 404 || err.statusCode === 404) return res.status(404).json({ message: 'Not found' })
  if (err.http_code) return res.status(502).json({ message: `Cloudinary upload failed: ${err.message}` })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' })
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large' })
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message })

  console.error(err)
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
})

export default app
