import { Router } from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { requireAdmin } from '../middleware/auth.js'
import { Admin, hashPassword } from '../models/Admin.js'
import { FormDefinition } from '../models/FormDefinition.js'
import { Submission } from '../models/Submission.js'
import { defaultForms } from '../data/defaultForms.js'
import { sanitizeContent, sanitizeFields } from '../utils/validate.js'
import { PageContent, PAGE_SECTIONS } from '../models/PageContent.js'
import { imageUpload } from '../middleware/upload.js'
import { saveImage } from '../config/storage.js'

const router = Router()

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

router.post(
  '/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again later.' },
  }),
  async (req, res) => {
    const { email = '', password = '' } = req.body ?? {}
    const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() })
    // Compare against a dummy hash when the email is unknown so timing doesn't reveal valid emails.
    const ok = admin ? await admin.verifyPassword(String(password)) : (await hashPassword('x'), false)
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign({ role: 'admin', sub: String(admin._id) }, env.jwtSecret, { expiresIn: '8h' })
    res.json({ token, email: admin.email })
  },
)

router.use(requireAdmin)

router.get('/me', (req, res) => res.json({ email: req.admin.email }))

// Sidebar: every form with its submission counts.
router.get('/forms', async (_req, res) => {
  const [forms, counts] = await Promise.all([
    FormDefinition.find().select('key title fields.key').sort({ key: 1 }).lean(),
    Submission.aggregate([
      { $group: { _id: '$form', total: { $sum: 1 }, new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } } } },
    ]),
  ])
  const byForm = Object.fromEntries(counts.map((c) => [c._id, c]))
  res.json(
    forms.map((f) => ({
      key: f.key,
      title: f.title,
      fieldCount: f.fields.length,
      total: byForm[f.key]?.total ?? 0,
      new: byForm[f.key]?.new ?? 0,
    })),
  )
})

async function loadForm(req, res, next) {
  const form = await FormDefinition.findOne({ key: req.params.key })
  if (!form) return res.status(404).json({ message: 'Form not found' })
  req.form = form
  next()
}

router.get('/forms/:key', loadForm, (req, res) => res.json(req.form))

router.put('/forms/:key', loadForm, async (req, res) => {
  const { fields, error } = sanitizeFields(req.body?.fields)
  if (error) return res.status(400).json({ message: error })
  req.form.fields = fields
  await req.form.save()
  res.json(req.form)
})

router.post('/forms/:key/reset', loadForm, async (req, res) => {
  const defaults = defaultForms.find((f) => f.key === req.form.key)
  if (!defaults) return res.status(400).json({ message: 'This form has no default fields' })
  req.form.fields = defaults.fields
  await req.form.save()
  res.json(req.form)
})

// Table columns: the form's current fields, then fields that were removed but still exist in older submissions.
async function columnsFor(form) {
  const columns = form.fields.map((f) => ({ key: f.key, label: f.label.en, type: f.type, hidden: f.hidden }))
  const known = new Set(columns.map((c) => c.key))
  const snapshot = await Submission.aggregate([
    { $match: { form: form.key } },
    { $sort: { createdAt: 1 } },
    { $unwind: '$fieldsSnapshot' },
    { $group: { _id: '$fieldsSnapshot.key', label: { $last: '$fieldsSnapshot.label' }, type: { $last: '$fieldsSnapshot.type' } } },
  ])
  for (const s of snapshot) {
    if (!known.has(s._id)) columns.push({ key: s._id, label: s.label || s._id, type: s.type, removed: true })
  }
  return columns
}

function submissionFilter(form, columns, { q, status }) {
  const filter = { form: form.key }
  if (status === 'new' || status === 'reviewed') filter.status = status
  const term = String(q ?? '').trim()
  if (term) {
    const rx = new RegExp(escapeRegex(term.slice(0, 100)), 'i')
    filter.$or = [{ referenceId: rx }, ...columns.map((c) => ({ [`data.${c.key}`]: rx }))]
  }
  return filter
}

router.get('/forms/:key/submissions', loadForm, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const columns = await columnsFor(req.form)
  const filter = submissionFilter(req.form, columns, req.query)

  const [items, total] = await Promise.all([
    Submission.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Submission.countDocuments(filter),
  ])
  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1), columns })
})

const csvCell = (value) => {
  let s = Array.isArray(value) ? value.join('; ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '')
  // Stop spreadsheet apps from evaluating submitted text as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

router.get('/forms/:key/submissions/export', loadForm, async (req, res) => {
  const columns = await columnsFor(req.form)
  const items = await Submission.find(submissionFilter(req.form, columns, req.query))
    .sort({ createdAt: -1 })
    .limit(20000)
    .lean()

  const header = ['Reference ID', 'Submitted at', 'Status', ...columns.map((c) => c.label)]
  const rows = items.map((s) => [
    s.referenceId,
    s.createdAt.toISOString(),
    s.status,
    ...columns.map((c) => s.data?.[c.key]),
  ])
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')

  const date = new Date().toISOString().slice(0, 10)
  res.set('Content-Type', 'text/csv; charset=utf-8')
  res.set('Content-Disposition', `attachment; filename="${req.form.key}-submissions-${date}.csv"`)
  // BOM so Excel opens Hindi text as UTF-8.
  res.send(`﻿${csv}`)
})

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Submission not found' })
  next()
}

router.patch('/submissions/:id', validId, async (req, res) => {
  const { status } = req.body ?? {}
  if (status !== 'new' && status !== 'reviewed') return res.status(400).json({ message: 'Invalid status' })
  const submission = await Submission.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' }).lean()
  if (!submission) return res.status(404).json({ message: 'Submission not found' })
  res.json(submission)
})

router.delete('/submissions/:id', validId, async (req, res) => {
  const submission = await Submission.findByIdAndDelete(req.params.id)
  if (!submission) return res.status(404).json({ message: 'Submission not found' })
  res.json({ ok: true })
})

// Page content editor: one section at a time.
function validSection(req, res, next) {
  if (!PAGE_SECTIONS[req.params.page]?.includes(req.params.section)) return res.status(404).json({ message: 'Section not found' })
  next()
}

router.put('/content/:page/:section', validSection, async (req, res) => {
  const data = req.body?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ message: 'data must be an object' })
  const { page, section } = req.params
  const doc = await PageContent.findOneAndUpdate(
    { page },
    { $set: { [`sections.${section}`]: sanitizeContent(data) } },
    { upsert: true, returnDocument: 'after' },
  ).lean()
  res.json({ section, data: doc.sections[section] })
})

// Image upload for the content editor: multer keeps the file in memory, then it is saved to server/uploads
// (or to Cloudinary once CLOUDINARY_URL is set).
router.post('/uploads', imageUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image to upload.' })
  res.status(201).json({ url: await saveImage(req.file) })
})

export default router
