const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

async function createMaster() {
  try {
    // Check if master already exists
    const existingMaster = await User.findOne({ username: 'master' });
    if (existingMaster) {
      console.log('Master account already exists!');
      console.log('Username: master');
      console.log('Password: master123');
      console.log('Role: master');
      console.log('Points: 25,000');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('master123', 10);

    // Create master user
    const master = new User({
      username: 'master',
      passwordHash: passwordHash,
      role: 'master',
      points: 25000,
      referralCode: 'MASTER001'
    });

    await master.save();
    console.log('✅ Master account created successfully!');
    console.log('Username: master');
    console.log('Password: master123');
    console.log('Role: master');
    console.log('Points: 25,000');
    console.log('Referral Code: MASTER001');

  } catch (error) {
    console.error('❌ Error creating master:', error);
  } finally {
    mongoose.connection.close();
  }
}

createMaster();




