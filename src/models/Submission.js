import mongoose, { Schema } from 'mongoose'

const submissionSchema = new Schema(
  {
    form: { type: String, required: true, index: true },
    referenceId: { type: String, required: true, unique: true },
    // Answers keyed by field key.
    data: { type: Schema.Types.Mixed, default: {} },
    // Field labels and types at submission time, so answers stay readable after a field is renamed or removed.
    fieldsSnapshot: {
      type: [{ _id: false, key: String, label: String, type: { type: String } }],
      default: [],
    },
    status: { type: String, enum: ['new', 'reviewed'], default: 'new', index: true },
  },
  { timestamps: true, minimize: false },
)

submissionSchema.index({ form: 1, createdAt: -1 })

export const Submission = mongoose.model('Submission', submissionSchema)
