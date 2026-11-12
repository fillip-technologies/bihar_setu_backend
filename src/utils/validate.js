import { FIELD_KEY_RE, FIELD_TYPES, OPTION_TYPES } from '../models/FormDefinition.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_LENGTH = { textarea: 5000 }
const DEFAULT_MAX_LENGTH = 300
const MAX_FIELDS = 60
const MAX_OPTIONS = 200

const str = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const isTruthy = (v) => v === true || v === 'true' || v === 'on'

// Checks a public submission against the form's visible fields. Unknown and hidden keys are dropped.
export function validateSubmission(fields, body = {}) {
  const data = {}
  const errors = {}

  for (const field of fields) {
    if (field.hidden) continue
    const { key, type, required } = field
    const label = field.label?.en || key
    const raw = body[key]
    const optionValues = new Set((field.options || []).map((o) => o.value))

    if (type === 'checkbox') {
      const checked = isTruthy(raw)
      if (required && !checked) errors[key] = 'Please tick this box to continue.'
      data[key] = checked
      continue
    }

    if (type === 'checkboxes') {
      const values = [...new Set((Array.isArray(raw) ? raw : raw ? [raw] : []).map(str).filter(Boolean))]
      if (values.some((v) => !optionValues.has(v))) errors[key] = `Please choose valid options for ${label}.`
      else if (required && !values.length) errors[key] = `Please choose at least one option for ${label}.`
      data[key] = values
      continue
    }

    let value = str(raw)
    if (type === 'tel') value = value.replace(/[\s-]/g, '')

    if (!value) {
      if (required) errors[key] = `${label} is required.`
      data[key] = ''
      continue
    }

    const max = MAX_LENGTH[type] ?? DEFAULT_MAX_LENGTH
    if (value.length > max) errors[key] = `${label} must be at most ${max} characters.`
    else if (type === 'email' && !EMAIL_RE.test(value)) errors[key] = 'Please enter a valid email address.'
    else if (type === 'tel' && !/^\d{10}$/.test(value)) errors[key] = 'Please enter a valid 10-digit mobile number.'
    else if (type === 'number' && !Number.isFinite(Number(value))) errors[key] = `${label} must be a number.`
    else if (type === 'date' && (!DATE_RE.test(value) || Number.isNaN(Date.parse(value))))
      errors[key] = `${label} must be a valid date.`
    else if ((type === 'select' || type === 'radio') && !optionValues.has(value))
      errors[key] = `Please choose a valid option for ${label}.`

    data[key] = type === 'email' ? value.toLowerCase() : value
  }

  return { data, errors }
}

const text = (v, max) => str(v).slice(0, max)
const i18n = (v, max) => ({ en: text(v?.en, max), hi: text(v?.hi, max) })

// Normalises the field list sent by the admin form builder. Returns { fields } or { error }.
export function sanitizeFields(input) {
  if (!Array.isArray(input)) return { error: 'fields must be an array' }
  if (!input.length) return { error: 'A form needs at least one field.' }
  if (input.length > MAX_FIELDS) return { error: `A form can have at most ${MAX_FIELDS} fields.` }

  const seen = new Set()
  const fields = []

  for (const [i, f] of input.entries()) {
    const where = `Field ${i + 1}`
    const key = str(f?.key)
    if (!FIELD_KEY_RE.test(key))
      return { error: `${where}: key must start with a letter and use only letters, numbers or _ (max 40).` }
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return { error: `${where}: "${key}" is reserved.` }
    if (seen.has(key)) return { error: `${where}: duplicate key "${key}".` }
    seen.add(key)

    const type = str(f.type)
    if (!FIELD_TYPES.includes(type)) return { error: `${where}: unknown field type "${type}".` }

    const label = i18n(f.label, 500)
    if (!label.en) return { error: `${where} (${key}): an English label is required.` }

    let options = []
    if (OPTION_TYPES.includes(type)) {
      const values = new Set()
      for (const o of Array.isArray(f.options) ? f.options : []) {
        const value = text(o?.value, 200)
        if (!value || values.has(value)) continue
        values.add(value)
        options.push({ value, label: { en: text(o.label?.en, 200) || value, hi: text(o.label?.hi, 200) } })
      }
      if (!options.length) return { error: `${where} (${label.en}): add at least one option.` }
      if (options.length > MAX_OPTIONS) return { error: `${where} (${label.en}): at most ${MAX_OPTIONS} options.` }
    }

    const defaultValue = str(f.defaultValue)
    fields.push({
      key,
      type,
      label,
      placeholder: i18n(f.placeholder, 200),
      required: Boolean(f.required),
      hidden: Boolean(f.hidden),
      width: f.width === 'full' ? 'full' : 'half',
      options,
      defaultValue: (type === 'select' || type === 'radio') && options.some((o) => o.value === defaultValue) ? defaultValue : '',
    })
  }

  return { fields }
}

const MAX_DEPTH = 6
const MAX_STRING = 10000
const MAX_ITEMS = 200

// Copies admin-edited page content, keeping only plain JSON values. Keys that MongoDB treats specially
// ($operators, dotted paths) or that could pollute prototypes are dropped.
export function sanitizeContent(value, depth = 0) {
  if (depth > MAX_DEPTH) return null
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') return value.slice(0, MAX_STRING)
  if (Array.isArray(value)) return value.slice(0, MAX_ITEMS).map((v) => sanitizeContent(v, depth + 1))
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,59}$/.test(k)) continue
      out[k] = sanitizeContent(v, depth + 1)
    }
    return out
  }
  return null
}
