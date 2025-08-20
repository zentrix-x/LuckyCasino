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

async function checkTotalPoints() {
  await connectMongo()

  try {
    console.log(`\n💰 Checking Total Points at ${new Date().toISOString()}`)

    // Get the User collection directly
    const User = mongoose.connection.collection('users')

    // Get all users and their points
    const allUsers = await User.find({}).toArray()

    console.log(`\n👥 Total Users: ${allUsers.length}`)

    // Calculate total points
    let totalPoints = 0
    let userPoints = 0
    let masterPoints = 0
    let superAdminPoints = 0

    const userBreakdown = {
      user: { count: 0, points: 0 },
      associate_master: { count: 0, points: 0 },
      master: { count: 0, points: 0 },
      senior_master: { count: 0, points: 0 },
      super_master: { count: 0, points: 0 },
      super_admin: { count: 0, points: 0 }
    }

    for (const user of allUsers) {
      const points = user.points || 0
      totalPoints += points
      
      // Categorize by role
      if (user.role) {
        if (userBreakdown[user.role]) {
          userBreakdown[user.role].count++
          userBreakdown[user.role].points += points
        }
      }

      // Categorize by type
      if (user.role === 'user') {
        userPoints += points
      } else if (user.role === 'super_admin') {
        superAdminPoints += points
      } else {
        masterPoints += points
      }
    }

    console.log(`\n📊 Points Breakdown by Role:`)
    Object.entries(userBreakdown).forEach(([role, data]) => {
      if (data.count > 0) {
        console.log(`   ${role}: ${data.count} users, ${data.points.toLocaleString()} points`)
      }
    })

    console.log(`\n💰 Total Points Calculation:`)
    console.log(`   Users: ${userPoints.toLocaleString()} points`)
    console.log(`   Masters: ${masterPoints.toLocaleString()} points`)
    console.log(`   Super Admin: ${superAdminPoints.toLocaleString()} points`)
    console.log(`   TOTAL: ${totalPoints.toLocaleString()} points`)

    // Check what the dashboard API returns
    console.log(`\n🔍 Dashboard API Calculation:`)
    
    // Simulate the dashboard API logic
    const users = await User.find({ role: 'user' }).toArray()
    const masters = await User.find({ 
      role: { $in: ['associate_master', 'master', 'senior_master', 'super_master'] } 
    }).toArray()
    
    const userPointsSum = users.reduce((sum, user) => sum + (user.points || 0), 0)
    const masterPointsSum = masters.reduce((sum, user) => sum + (user.points || 0), 0)
    const totalFromAPI = userPointsSum + masterPointsSum

    console.log(`   Users (role='user'): ${users.length} users, ${userPointsSum.toLocaleString()} points`)
    console.log(`   Masters (all master roles): ${masters.length} users, ${masterPointsSum.toLocaleString()} points`)
    console.log(`   API Total (users + masters): ${totalFromAPI.toLocaleString()} points`)

    // Check if there's a difference
    if (totalPoints !== totalFromAPI) {
      console.log(`\n⚠️  DISCREPANCY FOUND!`)
      console.log(`   Database Total: ${totalPoints.toLocaleString()}`)
      console.log(`   API Total: ${totalFromAPI.toLocaleString()}`)
      console.log(`   Difference: ${Math.abs(totalPoints - totalFromAPI).toLocaleString()}`)
    } else {
      console.log(`\n✅ No discrepancy found!`)
    }

    // Show top 10 users by points
    console.log(`\n🏆 Top 10 Users by Points:`)
    const topUsers = allUsers
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10)
    
    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role}): ${(user.points || 0).toLocaleString()} points`)
    })

  } catch (error) {
    console.error('Error checking total points:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkTotalPoints()




