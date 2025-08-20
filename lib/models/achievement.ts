import mongoose from 'mongoose'

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['gaming', 'social', 'financial', 'special'],
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  maxProgress: {
    type: Number,
    required: true
  },
  reward: {
    type: {
      type: String,
      enum: ['points', 'coins', 'badge', 'bonus'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  unlocked: {
    type: Boolean,
    default: false
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  unlockedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true })

export const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema)
