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

async function checkTotalBets() {
  await connectMongo()

  try {
    console.log(`\n🔍 Checking total bets at ${new Date().toISOString()}`)

    const GameRound = mongoose.connection.collection('gamerounds')
    const Bet = mongoose.connection.collection('bets')

    // Check total bets from game rounds
    const roundsWithBets = await GameRound.find({
      totalBets: { $exists: true, $gt: 0 }
    }).toArray()

    const totalBetsFromRounds = roundsWithBets.reduce((sum, round) => sum + (round.totalBets || 0), 0)

    console.log(`\n📊 Game Rounds Analysis:`)
    console.log(`   Rounds with bets: ${roundsWithBets.length}`)
    console.log(`   Total bets from rounds: ${totalBetsFromRounds.toLocaleString()}`)

    if (roundsWithBets.length > 0) {
      console.log(`   Recent rounds with bets:`)
      roundsWithBets.slice(-5).forEach((round, index) => {
        console.log(`     ${index + 1}. ${round.gameType}: ${round.totalBets} bets (${round.status})`)
      })
    }

    // Check individual bets
    const totalIndividualBets = await Bet.countDocuments()
    const totalBetAmount = await Bet.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])

    console.log(`\n🎯 Individual Bets Analysis:`)
    console.log(`   Total bet records: ${totalIndividualBets.toLocaleString()}`)
    console.log(`   Total bet amount: ${(totalBetAmount[0]?.total || 0).toLocaleString()} points`)

    // Check bets by game type
    const betsByGame = await Bet.aggregate([
      { $group: { _id: "$gameType", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
    ])

    console.log(`\n🎮 Bets by Game Type:`)
    betsByGame.forEach(game => {
      console.log(`   ${game._id}: ${game.count} bets, ${game.totalAmount.toLocaleString()} points`)
    })

    // Compare with dashboard API
    console.log(`\n🔍 Verification:`)
    console.log(`   Expected total (from dashboard): 1,660`)
    console.log(`   Actual total from rounds: ${totalBetsFromRounds.toLocaleString()}`)
    console.log(`   Actual total from individual bets: ${totalIndividualBets.toLocaleString()}`)

    if (totalBetsFromRounds === 1660) {
      console.log(`   ✅ Total bets match expected value!`)
    } else {
      console.log(`   ❌ Total bets do not match expected value`)
      console.log(`   Difference: ${Math.abs(totalBetsFromRounds - 1660)}`)
    }

  } catch (error) {
    console.error('Error checking total bets:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkTotalBets()




