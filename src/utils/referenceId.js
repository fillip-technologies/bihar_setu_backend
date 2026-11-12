import crypto from 'node:crypto'

// No 0/O or 1/I so IDs are easy to read out over the phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// e.g. BST-26-4F7K2Q
export function generateReferenceId(prefix) {
  const bytes = crypto.randomBytes(6)
  const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
  const year = String(new Date().getFullYear()).slice(-2)
  return `${prefix}-${year}-${suffix}`
}
