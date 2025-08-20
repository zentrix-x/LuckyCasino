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

async function fixUserHierarchy() {
  await connectMongo()

  try {
    console.log(`\n🔧 Fixing User Hierarchy at ${new Date().toISOString()}`)

    const User = mongoose.connection.collection('users')

    // Get all users
    const allUsers = await User.find({}).toArray()
    
    // Find masters (non-user roles)
    const masters = allUsers.filter(u => u.role !== 'user')
    console.log(`\n👑 Available Masters (${masters.length}):`)
    masters.forEach((master, index) => {
      console.log(`   ${index + 1}. ${master.username} (${master.role}) - ID: ${master._id}`)
    })

    // Find users without parent masters
    const usersWithoutParents = allUsers.filter(u => !u.parentMasterId && u.role === 'user')
    console.log(`\n❌ Users without Parent Masters (${usersWithoutParents.length}):`)
    usersWithoutParents.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.role}) - ID: ${user._id}`)
    })

    if (usersWithoutParents.length === 0) {
      console.log(`\n✅ All users already have parent masters!`)
      return
    }

    // Assign parent masters to users
    console.log(`\n🔗 Assigning Parent Masters...`)
    
    // Strategy: Assign users to different masters to create a proper hierarchy
    const assignments = [
      // Assign player1 to associate_master
      { userId: 'player1', masterId: 'associate_master' },
      // Assign 123 to senior_master  
      { userId: '123', masterId: 'senior_master' }
    ]

    for (const assignment of assignments) {
      const user = allUsers.find(u => u.username === assignment.userId)
      const master = allUsers.find(u => u.username === assignment.masterId)
      
      if (user && master) {
        console.log(`\n📝 Assigning ${user.username} to ${master.username}...`)
        
        const result = await User.updateOne(
          { _id: user._id },
          { $set: { parentMasterId: master._id } }
        )
        
        if (result.modifiedCount > 0) {
          console.log(`   ✅ Successfully assigned ${user.username} to ${master.username}`)
        } else {
          console.log(`   ❌ Failed to assign ${user.username} to ${master.username}`)
        }
      } else {
        console.log(`   ❌ Could not find user or master for assignment: ${assignment.userId} → ${assignment.masterId}`)
      }
    }

    // Verify the changes
    console.log(`\n🔍 Verifying Changes...`)
    const updatedUsers = await User.find({}).toArray()
    
    const usersWithParents = updatedUsers.filter(u => u.parentMasterId)
    console.log(`\n✅ Users with Parent Masters: ${usersWithParents.length}`)
    
    usersWithParents.forEach((user, index) => {
      const parent = updatedUsers.find(p => p._id.toString() === user.parentMasterId.toString())
      console.log(`   ${index + 1}. ${user.username} (${user.role}) → ${parent ? parent.username : 'Unknown'} (${parent ? parent.role : 'Unknown'})`)
    })

    // Test commission calculation
    console.log(`\n💰 Testing Commission Calculation...`)
    
    // Get recent bets
    const Bet = mongoose.connection.collection('bets')
    const recentBets = await Bet.find({}).limit(5).toArray()
    
    if (recentBets.length > 0) {
      console.log(`   Recent bets that should generate commissions:`)
      recentBets.forEach((bet, index) => {
        const user = updatedUsers.find(u => u._id.toString() === bet.userId.toString())
        const parent = user && user.parentMasterId ? updatedUsers.find(p => p._id.toString() === user.parentMasterId.toString()) : null
        
        console.log(`     ${index + 1}. ${user ? user.username : 'Unknown'} bet ${bet.amount} points`)
        console.log(`        Parent Master: ${parent ? parent.username : 'None'}`)
        if (parent) {
          const commissionRate = getCommissionRate(parent.role)
          const commission = Math.floor(bet.amount * commissionRate)
          console.log(`        Commission: ${commission} points (${commissionRate * 100}%)`)
        }
      })
    }

    console.log(`\n🎉 User hierarchy fixed!`)
    console.log(`   Next time users place bets, commissions should be generated.`)

  } catch (error) {
    console.error('Error fixing user hierarchy:', error)
  } finally {
    await mongoose.disconnect()
  }
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

fixUserHierarchy()




