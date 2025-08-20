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

async function testSuperAdmin() {
  await connectMongo()

  try {
    console.log(`\n🔍 Testing Super Admin functionality at ${new Date().toISOString()}`)

    const User = mongoose.connection.collection('users')

    // Check if super admin exists
    const superAdmin = await User.findOne({ role: 'super_admin' })
    console.log(`\n👑 Super Admin Check:`)
    if (superAdmin) {
      console.log(`   ✅ Super Admin found: ${superAdmin.username}`)
      console.log(`   Points: ${superAdmin.points}`)
      console.log(`   ID: ${superAdmin._id}`)
    } else {
      console.log(`   ❌ No Super Admin found!`)
    }

    // Check all users
    const allUsers = await User.find({}).toArray()
    console.log(`\n👥 All Users (${allUsers.length}):`)
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.role}) - ${user.points} points`)
    })

    // Check if there are users for super admin to manage
    const nonAdminUsers = allUsers.filter(u => u.role !== 'super_admin')
    console.log(`\n🎯 Users Super Admin can manage: ${nonAdminUsers.length}`)
    
    if (nonAdminUsers.length > 0) {
      console.log(`   Available users:`)
      nonAdminUsers.slice(0, 5).forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.username} (${user.role}) - ${user.points} points`)
      })
    }

    // Test API endpoint simulation
    console.log(`\n🔧 API Endpoint Test:`)
    console.log(`   POST /api/admin/create-points`)
    console.log(`   Required headers: Authorization: Bearer <super_admin_jwt>`)
    console.log(`   Required body: { targetUserId, points, action }`)
    
    if (superAdmin && nonAdminUsers.length > 0) {
      const testUser = nonAdminUsers[0]
      console.log(`   Test payload:`)
      console.log(`   {`)
      console.log(`     "targetUserId": "${testUser._id}",`)
      console.log(`     "points": 1000,`)
      console.log(`     "action": "add"`)
      console.log(`   }`)
    }

  } catch (error) {
    console.error('Error testing super admin:', error)
  } finally {
    await mongoose.disconnect()
  }
}

testSuperAdmin()
