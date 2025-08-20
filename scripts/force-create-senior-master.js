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

async function forceCreateSeniorMaster() {
  try {
    // First, delete any existing senior master account
    await User.deleteOne({ username: 'senior_master' });
    console.log('🗑️ Deleted any existing senior_master account');

    // Hash the password
    const passwordHash = await bcrypt.hash('senior123', 10);

    // Create new senior master user
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

    // Verify the account was created
    const createdAccount = await User.findOne({ username: 'senior_master' });
    if (createdAccount) {
      console.log('✅ Verification: Senior Master account found in database');
      console.log('ID:', createdAccount._id);
      console.log('Role:', createdAccount.role);
    } else {
      console.log('❌ Verification failed: Account not found in database');
    }

  } catch (error) {
    console.error('❌ Error creating senior master:', error);
  } finally {
    mongoose.connection.close();
  }
}

forceCreateSeniorMaster();




