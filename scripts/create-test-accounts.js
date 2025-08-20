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
  passwordHash: { type: String, required: true }, // Fixed: using passwordHash
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

async function createTestAccounts() {
  try {
    console.log('🔧 Creating test accounts...\n');

    // Create Super Admin
    let superAdmin = await User.findOne({ username: 'super_admin' });
    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const referralCode = 'SA' + Math.random().toString(36).substr(2, 6).toUpperCase();
      
      superAdmin = new User({
        username: 'super_admin',
        passwordHash: hashedPassword, // Fixed: using passwordHash
        role: 'super_admin',
        points: 100000,
        referralCode: referralCode
      });
      await superAdmin.save();
      console.log('✅ Super Admin created!');
    } else {
      console.log('✅ Super Admin already exists!');
    }

    // Create Associate Master
    let associateMaster = await User.findOne({ username: 'associate_master' });
    if (!associateMaster) {
      const hashedPassword = await bcrypt.hash('associate123', 10);
      const referralCode = 'AM' + Math.random().toString(36).substr(2, 6).toUpperCase();
      
      associateMaster = new User({
        username: 'associate_master',
        passwordHash: hashedPassword, // Fixed: using passwordHash
        role: 'associate_master',
        points: 10000,
        referralCode: referralCode,
        parentMasterId: superAdmin._id,
        referredBy: superAdmin._id
      });
      await associateMaster.save();
      console.log('✅ Associate Master created!');
    } else {
      console.log('✅ Associate Master already exists!');
    }

    // Create a regular user
    let regularUser = await User.findOne({ username: 'testuser' });
    if (!regularUser) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      const referralCode = 'US' + Math.random().toString(36).substr(2, 6).toUpperCase();
      
      regularUser = new User({
        username: 'testuser',
        passwordHash: hashedPassword, // Fixed: using passwordHash
        role: 'user',
        points: 1000,
        referralCode: referralCode,
        parentMasterId: associateMaster._id,
        referredBy: associateMaster._id
      });
      await regularUser.save();
      console.log('✅ Test User created!');
    } else {
      console.log('✅ Test User already exists!');
    }

    console.log('\n🎮 Test Accounts Created Successfully!');
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

  } catch (error) {
    console.error('❌ Error creating test accounts:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createTestAccounts();
