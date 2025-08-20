import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'associate_master', 'master', 'senior_master', 'super_master', 'super_admin'],
    default: 'user'
  },
  points: { 
    type: Number, 
    default: 0 
  },
  coins: { 
    type: Number, 
    default: 0 
  },
  avatar: { 
    type: String 
  },
  referralCode: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  referredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  parentMasterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  totalReferrals: { 
    type: Number, 
    default: 0 
  },
  totalEarnings: { 
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
  lastLoginAt: { 
    type: Date 
  },
  lastDailyRewardClaim: { 
    type: Date 
  },
  dailyStreak: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
userSchema.index({ username: 1 })
userSchema.index({ referralCode: 1 })
userSchema.index({ role: 1 })
userSchema.index({ points: -1 })

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  if (this.gamesPlayed === 0) return 0
  return Math.round((this.gamesWon / this.gamesPlayed) * 100 * 10) / 10
})

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
  if (!this.referralCode) {
    this.referralCode = `USER${this._id.toString().slice(-6).toUpperCase()}`
  }
  return this.referralCode
}

// Method to update game stats
userSchema.methods.updateGameStats = function(won: boolean, betAmount: number, winAmount: number = 0) {
  this.gamesPlayed += 1
  if (won) {
    this.gamesWon += 1
    this.totalEarnings += winAmount
  }
  return this.save()
}

export const User = mongoose.models.User || mongoose.model('User', userSchema)
