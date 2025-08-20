import mongoose from 'mongoose'

const dailyRewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  reward: {
    type: {
      type: String,
      enum: ['coins', 'points', 'bonus', 'special'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  },
  claimed: {
    type: Boolean,
    default: false
  },
  claimedAt: {
    type: Date
  },
  weekStartDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
dailyRewardSchema.index({ userId: 1, weekStartDate: 1, day: 1 }, { unique: true })

export const DailyReward = mongoose.models.DailyReward || mongoose.model('DailyReward', dailyRewardSchema)
