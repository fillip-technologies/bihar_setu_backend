import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { syncAdmin } from './models/Admin.js'
import { FormDefinition } from './models/FormDefinition.js'
import { seedForms } from './data/defaultForms.js'
import { storageMode } from './config/storage.js'
import app from './app.js'

await connectDB()
await syncAdmin({ email: env.adminEmail, password: env.adminPassword })
await seedForms(FormDefinition)
app.listen(env.port, () => {
  console.log(`Bihar Setu API listening on http://localhost:${env.port}`)
  console.log(`Image uploads: ${storageMode === 'cloudinary' ? 'Cloudinary' : 'local server/uploads folder'}`)
})
