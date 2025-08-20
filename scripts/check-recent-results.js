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

async function checkRecentResults() {
  await connectMongo()

  try {
    console.log(`\n🎮 Checking Recent Results at ${new Date().toISOString()}`)

    // Get the GameRound collection directly
    const GameRound = mongoose.connection.collection('gamerounds')

    // Check all game types
    const gameTypes = ['seven_up_down', 'spin_win', 'lottery_0_99']

    for (const gameType of gameTypes) {
      console.log(`\n📊 ${gameType.toUpperCase()} Recent Results:`)
      
      // Get settled rounds (what the history API returns)
      const settledRounds = await GameRound.find({ 
        gameType, 
        status: 'settled' 
      })
      .sort({ roundEndAt: -1 })
      .limit(10)
      .toArray()

      console.log(`   Total settled rounds: ${settledRounds.length}`)

      if (settledRounds.length > 0) {
        console.log(`   Recent 5 results:`)
        settledRounds.slice(0, 5).forEach((round, index) => {
          console.log(`     ${index + 1}. Round ID: ${round._id}`)
          console.log(`        End Time: ${new Date(round.roundEndAt).toISOString()}`)
          console.log(`        Winning Outcome: ${round.winningOutcome || 'N/A'}`)
          console.log(`        Total Bets: ${round.totalBets || 0}`)
          console.log(`        Total Payout: ${round.totalPayout || 0}`)
          console.log(`        Status: ${round.status}`)
          
          // Check if winningOutcome is properly set
          if (!round.winningOutcome) {
            console.log(`        ⚠️  WARNING: No winning outcome!`)
          }
        })
      } else {
        console.log(`   No settled rounds found`)
      }

      // Check if there are any rounds with winning outcomes
      const roundsWithOutcomes = await GameRound.find({ 
        gameType, 
        winningOutcome: { $exists: true, $ne: null } 
      }).toArray()
      
      console.log(`   Rounds with winning outcomes: ${roundsWithOutcomes.length}`)
    }

    // Check what the history API would return
    console.log(`\n🔍 History API Data Structure:`)
    for (const gameType of gameTypes) {
      const historyData = await GameRound.find({ 
        gameType, 
        status: 'settled' 
      })
      .sort({ roundEndAt: -1 })
      .limit(10)
      .toArray()

      console.log(`\n   ${gameType}:`)
      if (historyData.length > 0) {
        const sampleRound = historyData[0]
        console.log(`     Sample round data:`)
        console.log(`       _id: ${sampleRound._id}`)
        console.log(`       gameType: ${sampleRound.gameType}`)
        console.log(`       winningOutcome: ${sampleRound.winningOutcome}`)
        console.log(`       roundEndAt: ${sampleRound.roundEndAt}`)
        console.log(`       status: ${sampleRound.status}`)
        console.log(`       totalBets: ${sampleRound.totalBets}`)
        console.log(`       totalPayout: ${sampleRound.totalPayout}`)
      } else {
        console.log(`     No data available`)
      }
    }

    // Check if there are any issues with the data
    console.log(`\n⚠️  Potential Issues:`)
    
    // Check for rounds without winning outcomes
    const roundsWithoutOutcomes = await GameRound.find({ 
      status: 'settled',
      $or: [
        { winningOutcome: { $exists: false } },
        { winningOutcome: null },
        { winningOutcome: '' }
      ]
    }).toArray()
    
    console.log(`   Settled rounds without winning outcomes: ${roundsWithoutOutcomes.length}`)
    
    if (roundsWithoutOutcomes.length > 0) {
      console.log(`   Examples:`)
      roundsWithoutOutcomes.slice(0, 3).forEach((round, index) => {
        console.log(`     ${index + 1}. ${round.gameType} - ${round._id}`)
        console.log(`        End: ${new Date(round.roundEndAt).toISOString()}`)
        console.log(`        Winning Outcome: ${round.winningOutcome}`)
      })
    }

  } catch (error) {
    console.error('Error checking recent results:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkRecentResults()




