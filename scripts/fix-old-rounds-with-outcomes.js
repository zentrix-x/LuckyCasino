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

async function fixOldRoundsWithOutcomes() {
  await connectMongo()

  try {
    console.log(`\n🔧 Fixing old rounds with winning outcomes at ${new Date().toISOString()}`)

    // Get the collections directly
    const GameRound = mongoose.connection.collection('gamerounds')
    const Bet = mongoose.connection.collection('bets')

    // Find all settled rounds without winning outcomes
    const roundsWithoutOutcomes = await GameRound.find({
      status: 'settled',
      $or: [
        { winningOutcome: { $exists: false } },
        { winningOutcome: null },
        { winningOutcome: '' }
      ]
    }).toArray()

    console.log(`\n📊 Found ${roundsWithoutOutcomes.length} rounds without winning outcomes`)

    let fixedCount = 0
    for (const round of roundsWithoutOutcomes) {
      console.log(`\n🎯 Fixing: ${round.gameType} - Round ID: ${round._id}`)
      
      // Get bets for this round
      const bets = await Bet.find({ roundId: round._id }).toArray()
      console.log(`   Bets found: ${bets.length}`)

      if (bets.length === 0) {
        // No bets, generate a random outcome
        const randomOutcome = generateRandomOutcome(round.gameType)
        console.log(`   No bets - generating random outcome: ${randomOutcome}`)
        
        await GameRound.updateOne(
          { _id: round._id },
          { 
            $set: { 
              winningOutcome: randomOutcome,
              totalBets: 0,
              totalPayout: 0
            } 
          }
        )
        fixedCount++
        continue
      }

      // Calculate winning outcome based on game logic
      const winningOutcome = calculateWinningOutcome(round.gameType, bets)
      console.log(`   Calculated winning outcome: ${winningOutcome}`)

      // Update the round
      await GameRound.updateOne(
        { _id: round._id },
        { 
          $set: { 
            winningOutcome: winningOutcome,
            totalBets: bets.reduce((sum, bet) => sum + bet.amount, 0),
            totalPayout: 0 // No actual payouts since these are old rounds
          } 
        }
      )
      
      console.log(`   ✅ Fixed!`)
      fixedCount++
    }

    console.log(`\n🎉 Successfully fixed ${fixedCount} rounds!`)

    // Verify the fix
    console.log(`\n🔍 Verification:`)
    const roundsWithOutcomes = await GameRound.find({
      status: 'settled',
      winningOutcome: { $exists: true, $ne: null, $ne: '' }
    }).toArray()
    
    console.log(`   Rounds with winning outcomes: ${roundsWithOutcomes.length}`)
    
    if (roundsWithOutcomes.length > 0) {
      console.log(`   Recent examples:`)
      roundsWithOutcomes.slice(0, 3).forEach((round, index) => {
        console.log(`     ${index + 1}. ${round.gameType}: ${round.winningOutcome}`)
      })
    }

  } catch (error) {
    console.error('Error fixing old rounds:', error)
  } finally {
    await mongoose.disconnect()
  }
}

function generateRandomOutcome(gameType) {
  switch (gameType) {
    case 'seven_up_down':
      const outcomes = ['<7', '=7', '>7']
      return outcomes[Math.floor(Math.random() * outcomes.length)]
    case 'spin_win':
      const multipliers = ['x2', 'x7', 'x3', 'x6', 'x4', 'x5']
      return multipliers[Math.floor(Math.random() * multipliers.length)]
    case 'lottery_0_99':
      return Math.floor(Math.random() * 100).toString()
    default:
      return 'unknown'
  }
}

function calculateWinningOutcome(gameType, bets) {
  // Simple logic to calculate winning outcome based on bets
  if (bets.length === 0) {
    return generateRandomOutcome(gameType)
  }

  // Group bets by outcome
  const betSummary = {}
  bets.forEach(bet => {
    if (!betSummary[bet.outcome]) {
      betSummary[bet.outcome] = { totalAmount: 0, count: 0 }
    }
    betSummary[bet.outcome].totalAmount += bet.amount
    betSummary[bet.outcome].count++
  })

  switch (gameType) {
    case 'seven_up_down':
      // Choose outcome with lowest total bet amount
      let lowestAmount = Infinity
      let winningOutcome = '<7'
      for (const [outcome, data] of Object.entries(betSummary)) {
        if (data.totalAmount < lowestAmount) {
          lowestAmount = data.totalAmount
          winningOutcome = outcome
        }
      }
      return winningOutcome

    case 'spin_win':
      // Choose outcome with lowest total bet amount
      let lowestSpinAmount = Infinity
      let winningSpinOutcome = 'x2'
      for (const [outcome, data] of Object.entries(betSummary)) {
        if (data.totalAmount < lowestSpinAmount) {
          lowestSpinAmount = data.totalAmount
          winningSpinOutcome = outcome
        }
      }
      return winningSpinOutcome

    case 'lottery_0_99':
      // Choose outcome with lowest total bet amount
      let lowestLotteryAmount = Infinity
      let winningLotteryOutcome = '0'
      for (const [outcome, data] of Object.entries(betSummary)) {
        if (data.totalAmount < lowestLotteryAmount) {
          lowestLotteryAmount = data.totalAmount
          winningLotteryOutcome = outcome
        }
      }
      return winningLotteryOutcome

    default:
      return generateRandomOutcome(gameType)
  }
}

fixOldRoundsWithOutcomes()




