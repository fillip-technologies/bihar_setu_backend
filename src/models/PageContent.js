import mongoose, { Schema } from 'mongoose'

// Editable website content, one document per page. `sections` maps a section key (e.g. "hero") to its content.
// Sections that were never edited are absent, and the website falls back to its built-in defaults for them.
const pageContentSchema = new Schema(
  {
    page: { type: String, required: true, unique: true },
    sections: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
)

export const PageContent = mongoose.model('PageContent', pageContentSchema)

export const PAGE_SECTIONS = {
  home: [
    'header', 'dignitaries', 'hero', 'impact', 'about', 'explore', 'connect',
    'attend', 'tracks', 'sectors', 'activation', 'faq', 'contact', 'footer',
  ],
  // The other pages also show sections of the Home page ("about" on the About page, "contact" on all of them).
  about: ['hero', 'platform', 'transform'],
  agenda: ['hero', 'schedule', 'register'],
  speakers: ['hero', 'speakers'],
  partners: ['hero', 'showcase'],
  getInvolved: ['hero', 'pricing'],
  enquire: ['hero', 'form'],
}
