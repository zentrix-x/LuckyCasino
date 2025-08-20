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

async function settleOldRounds() {
  await connectMongo()

  try {
    console.log(`\n🔧 Settling old rounds at ${new Date().toISOString()}`)

    // Get the GameRound collection directly
    const GameRound = mongoose.connection.collection('gamerounds')

    // Find all rounds that are still in betting status and have ended
    const now = new Date()
    const oldBettingRounds = await GameRound.find({
      status: 'betting',
      roundEndAt: { $lt: now }
    }).toArray()

    console.log(`\n📊 Found ${oldBettingRounds.length} old rounds that need settling:`)
    
    let settledCount = 0
    for (const round of oldBettingRounds) {
      console.log(`\n🎯 Settling: ${round.gameType} - Round ID: ${round._id}`)
      console.log(`   Start: ${new Date(round.roundStartAt).toISOString()}`)
      console.log(`   End: ${new Date(round.roundEndAt).toISOString()}`)
      console.log(`   Status: ${round.status}`)
      
      // Update the round to settled status
      await GameRound.updateOne(
        { _id: round._id },
        { 
          $set: { 
            status: 'settled',
            totalBets: round.totalBets || 0,
            totalPayout: round.totalPayout || 0
          } 
        }
      )
      
      console.log(`   ✅ Settled!`)
      settledCount++
    }

    console.log(`\n🎉 Successfully settled ${settledCount} old rounds!`)

    // Check active games count after settling
    const currentBettingRounds = await GameRound.find({ status: 'betting' }).toArray()
    console.log(`\n📊 Active Games after settling: ${currentBettingRounds.length}`)

    if (currentBettingRounds.length > 0) {
      console.log('\n🎮 Current active rounds:')
      currentBettingRounds.forEach((round, index) => {
        console.log(`${index + 1}. ${round.gameType} - End: ${new Date(round.roundEndAt).toISOString()}`)
      })
    }

    // Check if we now have exactly 3 active games (one per game type)
    const gameTypes = [...new Set(currentBettingRounds.map(r => r.gameType))]
    console.log(`\n✅ Game types with active rounds: ${gameTypes.join(', ')}`)
    console.log(`📊 Expected: 3, Actual: ${currentBettingRounds.length}`)

  } catch (error) {
    console.error('Error settling old rounds:', error)
  } finally {
    await mongoose.disconnect()
  }
}

settleOldRounds()




