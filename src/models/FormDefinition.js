import mongoose, { Schema } from 'mongoose'

export const FIELD_TYPES = ['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'radio', 'checkboxes', 'checkbox']
// Types whose answer must be one (or, for checkboxes, several) of the configured options.
export const OPTION_TYPES = ['select', 'radio', 'checkboxes']
// Field keys become MongoDB document keys, so keep them to safe identifiers.
export const FIELD_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/

const i18nText = { en: { type: String, default: '' }, hi: { type: String, default: '' } }

const optionSchema = new Schema(
  {
    value: { type: String, required: true, trim: true },
    label: { en: { type: String, default: '' }, hi: { type: String, default: '' } },
  },
  { _id: false },
)

const fieldSchema = new Schema(
  {
    key: { type: String, required: true, match: FIELD_KEY_RE },
    type: { type: String, required: true, enum: FIELD_TYPES },
    label: i18nText,
    placeholder: i18nText,
    required: { type: Boolean, default: false },
    // Hidden fields stay in the definition (and in old submissions) but are not shown on the website.
    hidden: { type: Boolean, default: false },
    width: { type: String, enum: ['half', 'full'], default: 'half' },
    options: { type: [optionSchema], default: [] },
    defaultValue: { type: String, default: '' },
  },
  { _id: false },
)

const formDefinitionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    // Prefix for the reference ID handed back after a submission, e.g. BST-26-4F7K2Q.
    referencePrefix: { type: String, required: true },
    fields: { type: [fieldSchema], default: [] },
  },
  { timestamps: true },
)

export const FormDefinition = mongoose.model('FormDefinition', formDefinitionSchema)
