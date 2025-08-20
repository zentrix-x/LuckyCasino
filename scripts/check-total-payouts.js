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

async function checkTotalPayouts() {
  await connectMongo()

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    console.log(`Checking payouts since: ${twentyFourHoursAgo.toISOString()}`)

    // Get the GameRound collection directly
    const GameRound = mongoose.connection.collection('gamerounds')

    // Check all game rounds in last 24 hours
    const recentRounds = await GameRound.find({
      createdAt: { $gte: twentyFourHoursAgo }
    }).sort({ createdAt: -1 }).toArray()

    console.log(`\n📊 Found ${recentRounds.length} game rounds in last 24 hours:`)
    
    let totalPayout = 0
    recentRounds.forEach((round, index) => {
      console.log(`${index + 1}. ${round.gameType} - Status: ${round.status} - Payout: ${round.totalPayout || 0}`)
      totalPayout += (round.totalPayout || 0)
    })

    console.log(`\n💰 Total Payouts: ${totalPayout} points`)

    // Check if there are any settled rounds
    const settledRounds = recentRounds.filter(r => r.status === 'settled')
    console.log(`\n✅ Settled rounds: ${settledRounds.length}`)
    
    if (settledRounds.length === 0) {
      console.log('⚠️  No settled rounds found - this explains why Total Payouts shows 0')
    }

    // Check all time payouts
    const allTimePayouts = await GameRound.aggregate([
      {
        $group: {
          _id: null,
          totalPayout: { $sum: '$totalPayout' }
        }
      }
    ]).toArray()

    console.log(`\n🏆 All-time total payouts: ${allTimePayouts[0]?.totalPayout || 0} points`)

  } catch (error) {
    console.error('Error checking total payouts:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkTotalPayouts()
