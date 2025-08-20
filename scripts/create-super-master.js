const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino-site');

// Define User Schema (simplified version)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'associate_master', 'master', 'senior_master', 'super_master', 'super_admin'] },
  points: { type: Number, default: 0 },
  parentMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createSuperMaster() {
  try {
    // Check if super_master already exists
    const existingSuperMaster = await User.findOne({ username: 'supermaster' });
    if (existingSuperMaster) {
      console.log('✅ Super Master account already exists!');
      console.log('Username: supermaster');
      console.log('Password: super123');
      console.log('Role: super_master');
      console.log('Points: 75,000');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('super123', 10);

    // Create super_master user
    const superMaster = await User.create({
      username: 'supermaster',
      passwordHash: passwordHash,
      role: 'super_master',
      points: 75000,
      referralCode: 'SUPER001'
    });

    console.log('✅ Super Master account created successfully!');
    console.log('Username: supermaster');
    console.log('Password: super123');
    console.log('Role: super_master');
    console.log('Points: 75,000');
    console.log('Referral Code: SUPER001');

  } catch (error) {
    console.error('❌ Error creating super master:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

createSuperMaster();




