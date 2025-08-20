import mongoose from 'mongoose'

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  rewardEarned: {
    type: Number,
    default: 0
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  activatedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
referralSchema.index({ referrerId: 1, referredId: 1 }, { unique: true })
referralSchema.index({ referralCode: 1 })

export const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema)
