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

async function checkHouseProfit() {
  await connectMongo()

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    console.log(`Checking house profit since: ${twentyFourHoursAgo.toISOString()}`)

    // Get the GameRound collection directly
    const GameRound = mongoose.connection.collection('gamerounds')

    // Check all game rounds in last 24 hours
    const recentRounds = await GameRound.find({
      createdAt: { $gte: twentyFourHoursAgo }
    }).sort({ createdAt: -1 }).toArray()

    console.log(`\n📊 Found ${recentRounds.length} game rounds in last 24 hours:`)
    
    let totalBets = 0
    let totalPayout = 0
    let calculatedHouseProfit = 0
    
    recentRounds.forEach((round, index) => {
      const bets = round.totalBets || 0
      const payout = round.totalPayout || 0
      const houseProfit = round.houseProfit || 0
      
      console.log(`${index + 1}. ${round.gameType} - Status: ${round.status}`)
      console.log(`   Bets: ${bets}, Payout: ${payout}, House Profit: ${houseProfit}`)
      console.log(`   Calculated: ${bets} - ${payout} = ${bets - payout}`)
      
      totalBets += bets
      totalPayout += payout
      calculatedHouseProfit += (bets - payout)
    })

    console.log(`\n💰 Summary:`)
    console.log(`Total Bets: ${totalBets}`)
    console.log(`Total Payout: ${totalPayout}`)
    console.log(`Calculated House Profit: ${calculatedHouseProfit}`)
    console.log(`Expected House Profit: ${totalBets - totalPayout}`)

    // Check the aggregation query like the dashboard does
    const gameStats = await GameRound.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
      { $group: { 
        _id: '$gameType', 
        totalRounds: { $sum: 1 },
        totalBets: { $sum: '$totalBets' },
        totalPayout: { $sum: '$totalPayout' },
        houseProfit: { $sum: { $subtract: ['$totalBets', '$totalPayout'] } }
      }}
    ]).toArray()

    console.log(`\n📈 Dashboard Aggregation Results:`)
    gameStats.forEach(stat => {
      console.log(`${stat._id}:`)
      console.log(`  Rounds: ${stat.totalRounds}`)
      console.log(`  Bets: ${stat.totalBets}`)
      console.log(`  Payout: ${stat.totalPayout}`)
      console.log(`  House Profit: ${stat.houseProfit}`)
    })

    const totalHouseProfit = gameStats.reduce((sum, stat) => sum + stat.houseProfit, 0)
    console.log(`\n🏆 Total House Profit from Dashboard: ${totalHouseProfit}`)

  } catch (error) {
    console.error('Error checking house profit:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkHouseProfit()




