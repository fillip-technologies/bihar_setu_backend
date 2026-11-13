import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { FormDefinition } from '../models/FormDefinition.js'
import { Submission } from '../models/Submission.js'
import { PageContent, PAGE_SECTIONS } from '../models/PageContent.js'
import { validateSubmission } from '../utils/validate.js'
import { generateReferenceId } from '../utils/referenceId.js'

const router = Router()

// Website forms only need the fields that are currently shown.
router.get('/forms/:key', async (req, res) => {
  const form = await FormDefinition.findOne({ key: req.params.key }).lean()
  if (!form) return res.status(404).json({ message: 'Form not found' })
  res.set('Cache-Control', 'no-store')
  res.json({ key: form.key, title: form.title, fields: form.fields.filter((f) => !f.hidden) })
})

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions from this device. Please try again later.' },
})

router.post('/forms/:key/submissions', submitLimiter, async (req, res) => {
  const form = await FormDefinition.findOne({ key: req.params.key }).lean()
  if (!form) return res.status(404).json({ message: 'Form not found' })

  const { data, errors } = validateSubmission(form.fields, req.body ?? {})
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please correct the highlighted fields.', errors })
  }

  const fieldsSnapshot = form.fields
    .filter((f) => !f.hidden)
    .map((f) => ({ key: f.key, label: f.label.en, type: f.type }))

  // Reference IDs are random, so a collision is very unlikely - retry a few times if one happens.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const submission = await Submission.create({
        form: form.key,
        referenceId: generateReferenceId(form.referencePrefix),
        data,
        fieldsSnapshot,
      })
      return res.status(201).json({ referenceId: submission.referenceId, data })
    } catch (err) {
      if (err.code !== 11000) throw err
    }
  }
  throw new Error('Could not generate a unique reference ID')
})

// Editable page content (only sections changed in the admin panel - the website has defaults for the rest).
// Every page at once, so the website needs a single request before it renders.
router.get('/content', async (_req, res) => {
  const pages = Object.fromEntries(Object.keys(PAGE_SECTIONS).map((page) => [page, {}]))
  const docs = await PageContent.find({ page: { $in: Object.keys(pages) } }).lean()
  for (const doc of docs) pages[doc.page] = doc.sections ?? {}
  res.set('Cache-Control', 'no-store')
  res.json({ pages })
})

// One page, for the admin editor.
router.get('/content/:page', async (req, res) => {
  if (!PAGE_SECTIONS[req.params.page]) return res.status(404).json({ message: 'Page not found' })
  const doc = await PageContent.findOne({ page: req.params.page }).lean()
  res.set('Cache-Control', 'no-store')
  res.json({ page: req.params.page, sections: doc?.sections ?? {} })
})

export default router
