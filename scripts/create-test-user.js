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

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('Test user account already exists!');
      console.log('Username: testuser');
      console.log('Password: user123');
      console.log('Role: user');
      console.log('Points: 5,000');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('user123', 10);

    // Create test user
    const testUser = new User({
      username: 'testuser',
      passwordHash: passwordHash,
      role: 'user',
      points: 5000,
      referralCode: 'USER001'
    });

    await testUser.save();
    console.log('✅ Test user account created successfully!');
    console.log('Username: testuser');
    console.log('Password: user123');
    console.log('Role: user');
    console.log('Points: 5,000');
    console.log('Referral Code: USER001');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();




