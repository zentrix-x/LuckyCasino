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

async function testGameHistory() {
  await connectMongo()

  try {
    console.log(`\n🎮 Testing Game History at ${new Date().toISOString()}`)

    // Get the GameRound collection directly
    const GameRound = mongoose.connection.collection('gamerounds')

    // Check all game types
    const gameTypes = ['seven_up_down', 'spin_win', 'lottery_0_99']

    for (const gameType of gameTypes) {
      console.log(`\n📊 ${gameType.toUpperCase()} History:`)
      
      // Get all rounds for this game type
      const allRounds = await GameRound.find({ gameType }).toArray()
      console.log(`   Total rounds: ${allRounds.length}`)

      // Get settled rounds (what the history API returns)
      const settledRounds = await GameRound.find({ gameType, status: 'settled' }).toArray()
      console.log(`   Settled rounds: ${settledRounds.length}`)

      // Get betting rounds
      const bettingRounds = await GameRound.find({ gameType, status: 'betting' }).toArray()
      console.log(`   Betting rounds: ${bettingRounds.length}`)

      // Show recent settled rounds
      if (settledRounds.length > 0) {
        console.log(`   Recent settled rounds:`)
        settledRounds.slice(0, 3).forEach((round, index) => {
          console.log(`     ${index + 1}. Round ID: ${round._id}`)
          console.log(`        Start: ${new Date(round.roundStartAt).toISOString()}`)
          console.log(`        End: ${new Date(round.roundEndAt).toISOString()}`)
          console.log(`        Status: ${round.status}`)
          console.log(`        Winning Outcome: ${round.winningOutcome || 'N/A'}`)
          console.log(`        Total Bets: ${round.totalBets || 0}`)
          console.log(`        Total Payout: ${round.totalPayout || 0}`)
        })
      } else {
        console.log(`   No settled rounds found`)
      }
    }

    // Check if there are any bets in the system
    console.log(`\n🎯 Checking for bets:`)
    const Bet = mongoose.connection.collection('bets')
    const allBets = await Bet.find({}).toArray()
    console.log(`   Total bets in system: ${allBets.length}`)

    if (allBets.length > 0) {
      console.log(`   Recent bets:`)
      allBets.slice(0, 5).forEach((bet, index) => {
        console.log(`     ${index + 1}. User: ${bet.userId}, Game: ${bet.gameType}`)
        console.log(`        Amount: ${bet.amount}, Outcome: ${bet.outcome}`)
        console.log(`        Status: ${bet.status}, Round: ${bet.roundId}`)
      })
    }

    // Check if there are any transactions
    console.log(`\n💰 Checking for transactions:`)
    const Transaction = mongoose.connection.collection('transactions')
    const allTransactions = await Transaction.find({}).toArray()
    console.log(`   Total transactions: ${allTransactions.length}`)

    if (allTransactions.length > 0) {
      console.log(`   Recent transactions:`)
      allTransactions.slice(0, 5).forEach((tx, index) => {
        console.log(`     ${index + 1}. User: ${tx.userId}, Type: ${tx.type}`)
        console.log(`        Amount: ${tx.amount}, Balance After: ${tx.balanceAfter}`)
        console.log(`        Created: ${new Date(tx.createdAt).toISOString()}`)
      })
    }

    // Summary
    console.log(`\n📋 Summary:`)
    console.log(`   - Game rounds exist but most are in 'betting' status`)
    console.log(`   - No bets have been placed by users yet`)
    console.log(`   - No transactions have been created yet`)
    console.log(`   - Game History will show data once users start playing`)

  } catch (error) {
    console.error('Error testing game history:', error)
  } finally {
    await mongoose.disconnect()
  }
}

testGameHistory()




