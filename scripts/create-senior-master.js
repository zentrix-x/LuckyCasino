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

async function createSeniorMaster() {
  try {
    // Check if senior master already exists
    const existingSeniorMaster = await User.findOne({ username: 'senior_master' });
    if (existingSeniorMaster) {
      console.log('Senior Master account already exists!');
      console.log('Username: senior_master');
      console.log('Password: senior123');
      console.log('Role: senior_master');
      console.log('Points: 50,000');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('senior123', 10);

    // Create senior master user
    const seniorMaster = new User({
      username: 'senior_master',
      passwordHash: passwordHash,
      role: 'senior_master',
      points: 50000,
      referralCode: 'SENIOR001'
    });

    await seniorMaster.save();
    console.log('✅ Senior Master account created successfully!');
    console.log('Username: senior_master');
    console.log('Password: senior123');
    console.log('Role: senior_master');
    console.log('Points: 50,000');
    console.log('Referral Code: SENIOR001');

  } catch (error) {
    console.error('❌ Error creating senior master:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSeniorMaster();




