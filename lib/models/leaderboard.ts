import mongoose from 'mongoose'

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  score: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  totalWinnings: {
    type: Number,
    default: 0
  },
  totalBets: {
    type: Number,
    default: 0
  },
  timeframe: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  rank: {
    type: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
leaderboardSchema.index({ timeframe: 1, periodStart: 1, score: -1 })
leaderboardSchema.index({ userId: 1, timeframe: 1, periodStart: 1 }, { unique: true })

// Virtual for win rate
leaderboardSchema.virtual('winRate').get(function() {
  if (this.gamesPlayed === 0) return 0
  return Math.round((this.gamesWon / this.gamesPlayed) * 100 * 10) / 10
})

export const Leaderboard = mongoose.models.Leaderboard || mongoose.model('Leaderboard', leaderboardSchema)
