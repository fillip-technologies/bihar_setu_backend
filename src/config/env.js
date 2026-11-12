import 'dotenv/config'

const required = (key) => {
  const value = process.env[key]
  if (!value) {
    console.error(`Missing required environment variable: ${key}`)
    process.exit(1)
  }
  return value
}

// Accepts either CLOUDINARY_URL (cloudinary://key:secret@cloud, as shown in the Cloudinary dashboard)
// or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.
function readCloudinary() {
  const url = process.env.CLOUDINARY_URL
  if (url) {
    try {
      const u = new URL(url)
      return { cloudName: u.hostname, apiKey: decodeURIComponent(u.username), apiSecret: decodeURIComponent(u.password) }
    } catch {
      console.error('CLOUDINARY_URL is not a valid cloudinary:// URL')
      process.exit(1)
    }
  }
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bihar_setu',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  adminEmail: required('ADMIN_EMAIL').trim().toLowerCase(),
  adminPassword: required('ADMIN_PASSWORD'),
  jwtSecret: required('JWT_SECRET'),
  cloudinary: readCloudinary(),
}
