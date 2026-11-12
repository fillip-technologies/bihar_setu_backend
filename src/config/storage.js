import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isCloudinaryConfigured, uploadImage } from './cloudinary.js'

// server/uploads - served at /uploads. Used until CLOUDINARY_URL is set in .env.
export const UPLOADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads')

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

export const storageMode = isCloudinaryConfigured ? 'cloudinary' : 'local'

// Saves an uploaded image and returns the URL the website should use for it.
export async function saveImage(file) {
  if (isCloudinaryConfigured) return (await uploadImage(file)).secure_url

  // SVGs can carry scripts, and local files are served from the site's own origin, so only Cloudinary takes them.
  if (file.mimetype === 'image/svg+xml') {
    const err = new Error('SVG images can only be uploaded once Cloudinary is set up. Please use PNG or JPG.')
    err.status = 400
    throw err
  }
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXTENSIONS[file.mimetype]}`
  await fs.writeFile(path.join(UPLOADS_DIR, name), file.buffer)
  return `/uploads/${name}`
}
