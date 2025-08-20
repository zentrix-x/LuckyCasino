import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/casino'

async function connectMongo() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected')
  }
}

async function checkCommissionData() {
  await connectMongo()

  try {
    console.log(`\n🔍 Checking Commission Data at ${new Date().toISOString()}`)

    const CommissionLedger = mongoose.connection.collection('commissionledgers')
    const User = mongoose.connection.collection('users')
    const Bet = mongoose.connection.collection('bets')

    // Check if commission ledger exists
    const totalCommissions = await CommissionLedger.countDocuments()
    console.log(`\n💰 Commission Ledger:`)
    console.log(`   Total commission records: ${totalCommissions}`)

    if (totalCommissions > 0) {
      // Get recent commissions
      const recentCommissions = await CommissionLedger.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()

      console.log(`\n📊 Recent Commission Records:`)
      recentCommissions.forEach((commission, index) => {
        console.log(`   ${index + 1}. Level ${commission.level}: ${commission.amount} points`)
        console.log(`      Master: ${commission.masterId}`)
        console.log(`      User: ${commission.userId}`)
        console.log(`      Date: ${commission.createdAt}`)
      })

      // Check commissions by level
      const commissionsByLevel = await CommissionLedger.aggregate([
        { $group: { 
          _id: '$level', 
          totalCommissions: { $sum: '$amount' },
          commissionCount: { $sum: 1 }
        }}
      ])

      console.log(`\n🎯 Commissions by Level:`)
      commissionsByLevel.forEach(level => {
        console.log(`   Level ${level._id}: ${level.totalCommissions} points (${level.commissionCount} transactions)`)
      })

      // Check commissions by master
      const commissionsByMaster = await CommissionLedger.aggregate([
        { $group: { 
          _id: '$masterId', 
          totalCommissions: { $sum: '$amount' },
          commissionCount: { $sum: 1 }
        }},
        { $sort: { totalCommissions: -1 } }
      ])

      console.log(`\n👑 Commissions by Master:`)
      commissionsByMaster.forEach(master => {
        console.log(`   Master ${master._id}: ${master.totalCommissions} points (${master.commissionCount} transactions)`)
      })

    } else {
      console.log(`   ❌ No commission records found!`)
    }

    // Check if there are bets that should generate commissions
    const totalBets = await Bet.countDocuments()
    console.log(`\n🎲 Bet Analysis:`)
    console.log(`   Total bets: ${totalBets}`)

    if (totalBets > 0) {
      const betsWithUsers = await Bet.find({})
        .limit(5)
        .toArray()

      console.log(`   Recent bets:`)
      betsWithUsers.forEach((bet, index) => {
        console.log(`     ${index + 1}. User: ${bet.userId}, Amount: ${bet.amount}, Game: ${bet.gameType}`)
      })
    }

    // Check commission rates from config
    console.log(`\n📋 Commission Rates (from client requirements):`)
    console.log(`   Associate Master: 3% of user bet amount`)
    console.log(`   Master: 1.5% of user bet amount`)
    console.log(`   Senior Master: 0.8% of user bet amount`)
    console.log(`   Super Master: 0.4% of user bet amount`)

    // Check if commission service is working
    console.log(`\n🔧 Commission Service Status:`)
    console.log(`   Expected: Commissions should be generated when users place bets`)
    console.log(`   Current: ${totalCommissions} commission records exist`)
    
    if (totalBets > 0 && totalCommissions === 0) {
      console.log(`   ⚠️  WARNING: Bets exist but no commissions generated!`)
      console.log(`   This suggests the commission service may not be working properly.`)
    } else if (totalBets > 0 && totalCommissions > 0) {
      console.log(`   ✅ Commissions are being generated correctly!`)
    } else {
      console.log(`   ℹ️  No bets yet, so no commissions expected.`)
    }

  } catch (error) {
    console.error('Error checking commission data:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkCommissionData()




