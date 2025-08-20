const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino');

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'associate_master', 'master', 'senior_master', 'super_master', 'super_admin'],
    default: 'user'
  },
  points: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  parentMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAssociateMaster() {
  try {
    // Check if associate master already exists
    const existingUser = await User.findOne({ username: 'associate_master' });
    if (existingUser) {
      console.log('✅ Associate Master account already exists!');
      console.log('Username: associate_master');
      console.log('Password: associate123');
      console.log('Role: Associate Master');
      console.log('Points: ' + existingUser.points);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('associate123', 10);
    
    // Generate referral code
    const referralCode = 'AM' + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Create associate master
    const associateMaster = new User({
      username: 'associate_master',
      password: hashedPassword,
      role: 'associate_master',
      points: 10000, // Starting points
      referralCode: referralCode
    });

    await associateMaster.save();
    
    console.log('✅ Associate Master account created successfully!');
    console.log('Username: associate_master');
    console.log('Password: associate123');
    console.log('Role: Associate Master');
    console.log('Points: 10,000');
    console.log('Referral Code: ' + referralCode);
    console.log('\n🎮 You can now login to the casino site!');

  } catch (error) {
    console.error('❌ Error creating associate master:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createAssociateMaster();




