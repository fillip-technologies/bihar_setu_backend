import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
)

export const hashPassword = (plain) => bcrypt.hash(plain, 12)
adminSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

export const Admin = mongoose.model('Admin', adminSchema)

// ADMIN_EMAIL / ADMIN_PASSWORD in .env are the source of truth: the account is created on first boot,
// and its password is re-hashed whenever the .env password changes.
export async function syncAdmin({ email, password }) {
  const admin = await Admin.findOne({ email })
  if (!admin) {
    await Admin.create({ email, passwordHash: await hashPassword(password) })
    console.log(`Admin account created for ${email}`)
  } else if (!(await admin.verifyPassword(password))) {
    admin.passwordHash = await hashPassword(password)
    await admin.save()
    console.log(`Admin password for ${email} updated from .env`)
  }
}
