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

async function generateCommissions() {
  await connectMongo()

  try {
    console.log(`\n💰 Generating Commissions at ${new Date().toISOString()}`)

    const User = mongoose.connection.collection('users')
    const Bet = mongoose.connection.collection('bets')
    const CommissionLedger = mongoose.connection.collection('commissionledgers')
    const Transaction = mongoose.connection.collection('transactions')

    // Get all users with their hierarchy
    const allUsers = await User.find({}).toArray()
    
    // Get all bets
    const allBets = await Bet.find({}).toArray()
    console.log(`\n🎲 Total Bets: ${allBets.length}`)

    // Group bets by user
    const userBets = {}
    for (const bet of allBets) {
      const userId = bet.userId.toString()
      if (!userBets[userId]) {
        userBets[userId] = []
      }
      userBets[userId].push(bet)
    }

    console.log(`\n👥 Users with Bets: ${Object.keys(userBets).length}`)

    let totalCommissionsGenerated = 0
    const commissionRecords = []

    // Process each user's bets
    for (const [userId, bets] of Object.entries(userBets)) {
      const user = allUsers.find(u => u._id.toString() === userId)
      if (!user) continue

      console.log(`\n📊 Processing ${user.username} (${bets.length} bets)...`)

      // Calculate total bet amount for this user
      const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0)
      console.log(`   Total bet amount: ${totalBetAmount} points`)

      // Get user's upline (masters above them)
      const upline = await getUserUpline(user, allUsers)
      console.log(`   Upline masters: ${upline.length}`)

      // Generate commissions for each level
      for (let i = 0; i < upline.length && i < 4; i++) {
        const master = upline[i]
        const commissionRate = getCommissionRate(master.role)
        const commissionAmount = Math.floor(totalBetAmount * commissionRate)

        if (commissionAmount > 0) {
          console.log(`   Level ${i + 1}: ${master.username} (${master.role}) - ${commissionAmount} points (${commissionRate * 100}%)`)

          // Create commission record
          const commissionRecord = {
            roundId: null, // These are retroactive commissions
            masterId: master._id,
            userId: user._id,
            level: i + 1,
            amount: commissionAmount,
            createdAt: new Date()
          }
          commissionRecords.push(commissionRecord)

          // Update master's points
          await User.updateOne(
            { _id: master._id },
            { $inc: { points: commissionAmount } }
          )

          // Create transaction record
          const updatedMaster = await User.findOne({ _id: master._id })
          await Transaction.insertOne({
            userId: master._id,
            type: 'commission_credit',
            amount: commissionAmount,
            balanceAfter: updatedMaster.points,
            createdAt: new Date(),
            meta: {
              sourceUserId: user._id,
              sourceUsername: user.username,
              level: i + 1,
              commissionRate: commissionRate,
              retroactive: true
            }
          })

          totalCommissionsGenerated += commissionAmount
        }
      }
    }

    // Insert all commission records
    if (commissionRecords.length > 0) {
      await CommissionLedger.insertMany(commissionRecords)
      console.log(`\n✅ Generated ${commissionRecords.length} commission records`)
      console.log(`   Total commission amount: ${totalCommissionsGenerated} points`)
    } else {
      console.log(`\n⚠️  No commissions generated (all amounts were 0)`)
    }

    // Verify the results
    console.log(`\n🔍 Verification:`)
    const totalCommissions = await CommissionLedger.countDocuments()
    console.log(`   Total commission records: ${totalCommissions}`)

    if (totalCommissions > 0) {
      const commissionsByMaster = await CommissionLedger.aggregate([
        { $group: { 
          _id: '$masterId', 
          totalCommissions: { $sum: '$amount' },
          commissionCount: { $sum: 1 }
        }},
        { $sort: { totalCommissions: -1 } }
      ])

      console.log(`\n👑 Commissions by Master:`)
      for (const masterComm of commissionsByMaster) {
        const master = allUsers.find(u => u._id.toString() === masterComm._id.toString())
        console.log(`   ${master ? master.username : 'Unknown'}: ${masterComm.totalCommissions} points (${masterComm.commissionCount} transactions)`)
      }
    }

    console.log(`\n🎉 Commission generation complete!`)
    console.log(`   Commission summary should now show actual data.`)

  } catch (error) {
    console.error('Error generating commissions:', error)
  } finally {
    await mongoose.disconnect()
  }
}

async function getUserUpline(user, allUsers) {
  const upline = []
  let currentUser = user

  while (currentUser && currentUser.parentMasterId) {
    const master = allUsers.find(u => u._id.toString() === currentUser.parentMasterId.toString())
    if (master && master.role !== 'user') {
      upline.push(master)
    }
    currentUser = master
  }

  return upline
}

function getCommissionRate(role) {
  const rates = {
    'associate_master': 0.03, // 3%
    'master': 0.015,          // 1.5%
    'senior_master': 0.008,   // 0.8%
    'super_master': 0.004     // 0.4%
  }
  return rates[role] || 0
}

generateCommissions()




