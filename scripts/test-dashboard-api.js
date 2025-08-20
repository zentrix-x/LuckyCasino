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

async function testDashboardAPI() {
  await connectMongo()

  try {
    console.log(`\n🔍 Testing Dashboard API at ${new Date().toISOString()}`)

    // Get the User collection directly
    const User = mongoose.connection.collection('users')

    // Get all users
    const allUsers = await User.find({}).toArray()
    console.log(`\n👥 Total Users: ${allUsers.length}`)

    // Simulate the exact API logic
    console.log(`\n📊 API Calculation Logic:`)

    // 1. Total system points (all users)
    const totalSystemPoints = allUsers.reduce((sum, user) => sum + (user.points || 0), 0)
    console.log(`   totalSystemPoints: ${totalSystemPoints}`)

    // 2. User points (role='user')
    const userPoints = allUsers
      .filter(user => user.role === 'user')
      .reduce((sum, user) => sum + (user.points || 0), 0)
    console.log(`   withUsers: ${userPoints}`)

    // 3. Master points (all non-user roles)
    const masterPoints = allUsers
      .filter(user => user.role !== 'user')
      .reduce((sum, user) => sum + (user.points || 0), 0)
    console.log(`   withMasters: ${masterPoints}`)

    // 4. Check individual role breakdown
    console.log(`\n👥 Individual Role Breakdown:`)
    const roleBreakdown = {}
    allUsers.forEach(user => {
      const role = user.role || 'unknown'
      if (!roleBreakdown[role]) {
        roleBreakdown[role] = { count: 0, points: 0 }
      }
      roleBreakdown[role].count++
      roleBreakdown[role].points += (user.points || 0)
    })
    
    Object.entries(roleBreakdown).forEach(([role, data]) => {
      console.log(`   ${role}: ${data.count} users, ${data.points} points`)
    })

    // 5. Verify the math
    console.log(`\n🧮 Verification:`)
    console.log(`   API Total System: ${totalSystemPoints}`)
    console.log(`   API Users: ${userPoints}`)
    console.log(`   API Masters: ${masterPoints}`)
    console.log(`   Users + Masters: ${userPoints + masterPoints}`)
    console.log(`   Should equal: ${totalSystemPoints === (userPoints + masterPoints) ? '✅ YES' : '❌ NO'}`)

    // 6. Check if super_admin is included in masters
    const superAdminPoints = allUsers
      .filter(user => user.role === 'super_admin')
      .reduce((sum, user) => sum + (user.points || 0), 0)
    console.log(`\n👑 Super Admin Points: ${superAdminPoints}`)
    console.log(`   Included in masters: ${superAdminPoints === masterPoints ? '❌ NO' : '✅ YES'}`)

    // 7. Check what the frontend should display
    console.log(`\n🎯 Frontend Display:`)
    console.log(`   Total Points (totalSystem): ${totalSystemPoints.toLocaleString()}`)
    console.log(`   With Users: ${userPoints.toLocaleString()}`)
    console.log(`   With Masters: ${masterPoints.toLocaleString()}`)

  } catch (error) {
    console.error('Error testing dashboard API:', error)
  } finally {
    await mongoose.disconnect()
  }
}

testDashboardAPI()
