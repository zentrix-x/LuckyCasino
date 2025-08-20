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

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingUser = await User.findOne({ username: 'super_admin' });
    if (existingUser) {
      console.log('✅ Super Admin account already exists!');
      console.log('Username: super_admin');
      console.log('Password: admin123');
      console.log('Role: Super Admin');
      console.log('Points: ' + existingUser.points);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Generate referral code
    const referralCode = 'SA' + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Create super admin
    const superAdmin = new User({
      username: 'super_admin',
      password: hashedPassword,
      role: 'super_admin',
      points: 100000, // Starting points
      referralCode: referralCode
    });

    await superAdmin.save();
    
    console.log('✅ Super Admin account created successfully!');
    console.log('Username: super_admin');
    console.log('Password: admin123');
    console.log('Role: Super Admin');
    console.log('Points: 100,000');
    console.log('Referral Code: ' + referralCode);
    console.log('\n🎮 You can now login to the casino site!');
    console.log('\n🔧 With Super Admin, you can:');
    console.log('• Create any type of user account');
    console.log('• Create unlimited points out of thin air');
    console.log('• Access all admin features');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createSuperAdmin();




