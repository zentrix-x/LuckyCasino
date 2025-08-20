const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB (using default local connection)
mongoose.connect('mongodb://localhost:27017/casino').catch(err => {
  console.log('MongoDB connection failed, trying alternative...');
  return mongoose.connect('mongodb://127.0.0.1:27017/casino');
});

// User Schema (matching the actual model)
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
  parentMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function fixTestAccounts() {
  try {
    console.log('🔧 Fixing test accounts...\n');

    // Delete existing test accounts
    await User.deleteMany({ 
      username: { $in: ['super_admin', 'associate_master', 'testuser'] } 
    });
    console.log('🗑️ Deleted existing test accounts');

    // Create Super Admin
    const superAdminHash = await bcrypt.hash('admin123', 10);
    const superAdminReferralCode = 'SA' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const superAdmin = new User({
      username: 'super_admin',
      passwordHash: superAdminHash,
      role: 'super_admin',
      points: 100000,
      referralCode: superAdminReferralCode
    });
    await superAdmin.save();
    console.log('✅ Super Admin created!');

    // Create Associate Master
    const associateMasterHash = await bcrypt.hash('associate123', 10);
    const associateMasterReferralCode = 'AM' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const associateMaster = new User({
      username: 'associate_master',
      passwordHash: associateMasterHash,
      role: 'associate_master',
      points: 10000,
      referralCode: associateMasterReferralCode,
      parentMasterId: superAdmin._id,
      referredBy: superAdmin._id
    });
    await associateMaster.save();
    console.log('✅ Associate Master created!');

    // Create a regular user
    const userHash = await bcrypt.hash('user123', 10);
    const userReferralCode = 'US' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const regularUser = new User({
      username: 'testuser',
      passwordHash: userHash,
      role: 'user',
      points: 1000,
      referralCode: userReferralCode,
      parentMasterId: associateMaster._id,
      referredBy: associateMaster._id
    });
    await regularUser.save();
    console.log('✅ Test User created!');

    console.log('\n🎮 Test Accounts Fixed Successfully!');
    console.log('=====================================');
    console.log('👑 Super Admin:');
    console.log('   Username: super_admin');
    console.log('   Password: admin123');
    console.log('   Role: Super Admin');
    console.log('   Points: 100,000');
    console.log('');
    console.log('👥 Associate Master:');
    console.log('   Username: associate_master');
    console.log('   Password: associate123');
    console.log('   Role: Associate Master');
    console.log('   Points: 10,000');
    console.log('');
    console.log('👤 Test User:');
    console.log('   Username: testuser');
    console.log('   Password: user123');
    console.log('   Role: User');
    console.log('   Points: 1,000');
    console.log('\n🚀 Start your development server with: npm run dev');
    console.log('🌐 Then visit: http://localhost:3000');
    console.log('\n🔑 You can now login with any of these accounts!');

  } catch (error) {
    console.error('❌ Error fixing test accounts:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
fixTestAccounts();




