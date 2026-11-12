import multer from 'multer'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'])
export const MAX_IMAGE_MB = 8

// Files are kept in memory, then written to the uploads folder or streamed to Cloudinary (see config/storage.js).
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype)) return cb(null, true)
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname)
    err.message = 'Only JPG, PNG, WebP, AVIF, GIF or SVG images can be uploaded.'
    cb(err)
  },
})
