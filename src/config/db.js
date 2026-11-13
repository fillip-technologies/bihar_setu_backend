import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 })
    console.log(`MongoDB connected: ${mongoose.connection.name}`)
  } catch (err) {
    // Hide the password so it doesn't end up in the server logs.
    console.error(`MongoDB connection failed (${env.mongoUri.replace(/\/\/[^@/]*@/, '//***@')}): ${err.message}`)
    process.exit(1)
  }
}
