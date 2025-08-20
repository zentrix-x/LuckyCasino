import mongoose, { Schema, models, model } from 'mongoose'

export const roles = ['user', 'associate_master', 'master', 'senior_master', 'super_master', 'super_admin'] as const

const UserSchema = new Schema({
	username: { type: String, unique: true, required: true },
	passwordHash: { type: String, required: true },
	role: { type: String, enum: roles, required: true },
	parentMasterId: { type: Schema.Types.ObjectId, ref: 'User' },
	points: { type: Number, default: 0 },
	isActive: { type: Boolean, default: true },
	referralCode: { type: String, unique: true, sparse: true },
	referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

// Add compound indexes for better query performance
UserSchema.index({ role: 1, isActive: 1 })
UserSchema.index({ parentMasterId: 1, role: 1 })
UserSchema.index({ points: -1 })
UserSchema.index({ createdAt: -1 })

const GameRoundSchema = new Schema({
	gameType: { type: String, enum: ['seven_up_down', 'spin_win', 'lottery_0_99'], required: true },
	roundStartAt: { type: Date, required: true },
	roundEndAt: { type: Date, required: true },
	status: { type: String, enum: ['betting', 'locked', 'settled'], default: 'betting' },
	winningOutcome: { type: String },
	totalsJson: { type: Schema.Types.Mixed },
}, { timestamps: true })

const BetSchema = new Schema({
	roundId: { type: Schema.Types.ObjectId, ref: 'GameRound', index: true, required: true },
	userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
	gameType: { type: String, enum: ['seven_up_down', 'spin_win', 'lottery_0_99'], required: true },
	outcome: { type: String, required: true },
	amount: { type: Number, required: true },
	status: { type: String, enum: ['placed', 'won', 'lost', 'refunded'], default: 'placed' },
	payout: { type: Number, default: 0 },
	idempotencyKey: { type: String, index: true, unique: true, sparse: true },
}, { timestamps: true })

// Add compound indexes for bet aggregation and queries
BetSchema.index({ roundId: 1, gameType: 1 })
BetSchema.index({ userId: 1, createdAt: -1 })
BetSchema.index({ gameType: 1, status: 1 })
BetSchema.index({ amount: -1 })
BetSchema.index({ createdAt: -1 })

const TransactionSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
	type: { type: String, enum: ['bet_debit', 'payout_credit', 'adjustment', 'commission'], required: true },
	amount: { type: Number, required: true },
	balanceAfter: { type: Number, required: true },
	meta: { type: Schema.Types.Mixed },
}, { timestamps: true })

const CommissionLedgerSchema = new Schema({
	roundId: { type: Schema.Types.ObjectId, ref: 'GameRound', required: true },
	masterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	level: { type: Number, required: true },
	amount: { type: Number, required: true },
}, { timestamps: true })

const PresenceSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true },
	lastSeen: { type: Date, required: true },
}, { timestamps: true })

export const User = models.User || model('User', UserSchema)
export const GameRound = models.GameRound || model('GameRound', GameRoundSchema)
export const Bet = models.Bet || model('Bet', BetSchema)
export const Transaction = models.Transaction || model('Transaction', TransactionSchema)
export const CommissionLedger = models.CommissionLedger || model('CommissionLedger', CommissionLedgerSchema)
export const Presence = models.Presence || model('Presence', PresenceSchema)
