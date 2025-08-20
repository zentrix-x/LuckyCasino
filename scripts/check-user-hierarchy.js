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

async function checkUserHierarchy() {
  await connectMongo()

  try {
    console.log(`\n🔍 Checking User Hierarchy at ${new Date().toISOString()}`)

    const User = mongoose.connection.collection('users')

    // Check all users and their hierarchy
    const allUsers = await User.find({}).toArray()
    console.log(`\n👥 All Users (${allUsers.length}):`)
    
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.role})`)
      console.log(`      Points: ${user.points}`)
      console.log(`      Parent Master ID: ${user.parentMasterId || 'None'}`)
      console.log(`      User ID: ${user._id}`)
    })

    // Check users with parent masters
    const usersWithParents = allUsers.filter(u => u.parentMasterId)
    console.log(`\n🔗 Users with Parent Masters: ${usersWithParents.length}`)
    
    if (usersWithParents.length > 0) {
      usersWithParents.forEach((user, index) => {
        const parent = allUsers.find(p => p._id.toString() === user.parentMasterId.toString())
        console.log(`   ${index + 1}. ${user.username} (${user.role}) → ${parent ? parent.username : 'Unknown'} (${parent ? parent.role : 'Unknown'})`)
      })
    } else {
      console.log(`   ❌ No users have parent masters set!`)
      console.log(`   This is why commissions are not being generated.`)
    }

    // Check users without parent masters
    const usersWithoutParents = allUsers.filter(u => !u.parentMasterId && u.role === 'user')
    console.log(`\n❌ Users without Parent Masters: ${usersWithoutParents.length}`)
    
    if (usersWithoutParents.length > 0) {
      console.log(`   These users cannot generate commissions:`)
      usersWithoutParents.forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.username} (${user.role})`)
      })
    }

    // Check master roles
    const masters = allUsers.filter(u => u.role !== 'user')
    console.log(`\n👑 Masters (${masters.length}):`)
    masters.forEach((master, index) => {
      console.log(`   ${index + 1}. ${master.username} (${master.role}) - ${master.points} points`)
    })

    // Check commission rates
    console.log(`\n💰 Commission Rates:`)
    console.log(`   Associate Master: 3% of user bet amount`)
    console.log(`   Master: 1.5% of user bet amount`)
    console.log(`   Senior Master: 0.8% of user bet amount`)
    console.log(`   Super Master: 0.4% of user bet amount`)

    // Check recent bets and their users
    const Bet = mongoose.connection.collection('bets')
    const recentBets = await Bet.find({}).limit(10).toArray()
    
    console.log(`\n🎲 Recent Bets Analysis:`)
    if (recentBets.length > 0) {
      recentBets.forEach((bet, index) => {
        const user = allUsers.find(u => u._id.toString() === bet.userId.toString())
        console.log(`   ${index + 1}. User: ${user ? user.username : 'Unknown'} (${user ? user.role : 'Unknown'})`)
        console.log(`      Bet Amount: ${bet.amount}`)
        console.log(`      Game: ${bet.gameType}`)
        console.log(`      Parent Master: ${user && user.parentMasterId ? 'Yes' : 'No'}`)
      })
    }

    // Summary
    console.log(`\n📋 Summary:`)
    console.log(`   Total Users: ${allUsers.length}`)
    console.log(`   Users with Parent Masters: ${usersWithParents.length}`)
    console.log(`   Users without Parent Masters: ${usersWithoutParents.length}`)
    console.log(`   Masters: ${masters.length}`)
    
    if (usersWithoutParents.length > 0) {
      console.log(`\n⚠️  ISSUE: Users without parent masters cannot generate commissions!`)
      console.log(`   Solution: Set parentMasterId for users to enable commission generation.`)
    } else {
      console.log(`\n✅ All users have parent masters set up correctly!`)
    }

  } catch (error) {
    console.error('Error checking user hierarchy:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkUserHierarchy()




