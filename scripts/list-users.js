const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino-site');

// Define User Schema (simplified version)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'associate_master', 'master', 'senior_master', 'super_master', 'super_admin'],
    default: 'user'
  },
  points: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function listUsers() {
  try {
    const users = await User.find({}).sort({ createdAt: 1 });
    
    console.log('📋 All Users in Database:');
    console.log('='.repeat(80));
    console.log('ID'.padEnd(25) + 'Username'.padEnd(15) + 'Role'.padEnd(15) + 'Points'.padEnd(10) + 'Created');
    console.log('='.repeat(80));
    
    users.forEach(user => {
      const id = user._id.toString();
      const username = user.username.padEnd(15);
      const role = user.role.padEnd(15);
      const points = user.points.toString().padEnd(10);
      const created = user.createdAt.toLocaleString();
      
      console.log(`${id} ${username} ${role} ${points} ${created}`);
    });
    
    console.log('='.repeat(80));
    console.log(`Total Users: ${users.length}`);
    
    // Check for senior master specifically
    const seniorMaster = users.find(u => u.role === 'senior_master');
    if (seniorMaster) {
      console.log('✅ Senior Master found:', seniorMaster.username);
    } else {
      console.log('❌ No Senior Master found in database');
    }

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    mongoose.connection.close();
  }
}

listUsers();




