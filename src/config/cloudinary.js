import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

const { cloudName, apiKey, apiSecret } = env.cloudinary
export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret)

if (isCloudinaryConfigured) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
}

// Website images (logos, banners, photos) are public, so they are stored as normal "upload" assets.
export function uploadImage(file, folder = 'bihar-setu/site') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image', overwrite: false }, (err, result) => (err ? reject(err) : resolve(result)))
      .end(file.buffer)
  })
}
