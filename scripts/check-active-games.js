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

async function checkActiveGames() {
  await connectMongo()

  try {
    console.log(`\n🎮 Checking Active Games at ${new Date().toISOString()}`)

    // Get the GameRound collection directly
    const GameRound = mongoose.connection.collection('gamerounds')

    // Check current betting rounds (like the dashboard does)
    const currentRounds = await GameRound.find({ status: 'betting' })
      .sort({ roundEndAt: 1 }).toArray()

    console.log(`\n📊 Active Games (betting status): ${currentRounds.length}`)
    
    if (currentRounds.length > 0) {
      console.log('\n🎯 Current betting rounds:')
      currentRounds.forEach((round, index) => {
        console.log(`${index + 1}. ${round.gameType} - Round ID: ${round._id}`)
        console.log(`   Start: ${new Date(round.roundStartAt).toISOString()}`)
        console.log(`   End: ${new Date(round.roundEndAt).toISOString()}`)
        console.log(`   Status: ${round.status}`)
        console.log(`   Bets: ${round.totalBets || 0}`)
      })
    }

    // Check all rounds by status
    const allRounds = await GameRound.find({})
      .sort({ createdAt: -1 }).limit(10).toArray()

    console.log(`\n📈 Recent rounds by status:`)
    const statusCounts = {}
    allRounds.forEach(round => {
      statusCounts[round.status] = (statusCounts[round.status] || 0) + 1
    })
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })

    // Check if we have exactly 3 game types
    const gameTypes = [...new Set(allRounds.map(r => r.gameType))]
    console.log(`\n🎲 Game types found: ${gameTypes.join(', ')}`)

    // Check the most recent round for each game type
    console.log(`\n🕐 Most recent round for each game type:`)
    for (const gameType of gameTypes) {
      const latestRound = await GameRound.find({ gameType })
        .sort({ createdAt: -1 }).limit(1).toArray()
      
      if (latestRound.length > 0) {
        const round = latestRound[0]
        console.log(`${gameType}:`)
        console.log(`   Status: ${round.status}`)
        console.log(`   Created: ${new Date(round.createdAt).toISOString()}`)
        console.log(`   End: ${new Date(round.roundEndAt).toISOString()}`)
        console.log(`   Is betting: ${round.status === 'betting'}`)
      }
    }

    // Expected active games
    console.log(`\n✅ Expected Active Games: ${gameTypes.length} (one per game type)`)
    console.log(`📊 Actual Active Games: ${currentRounds.length}`)

  } catch (error) {
    console.error('Error checking active games:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkActiveGames()




