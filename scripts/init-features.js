const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino-site');

// Import models
const User = require('../lib/models/user').User;
const Achievement = require('../lib/models/achievement').Achievement;
const DailyReward = require('../lib/models/daily-reward').DailyReward;
const Referral = require('../lib/models/referral').Referral;
const Leaderboard = require('../lib/models/leaderboard').Leaderboard;

async function initializeFeatures() {
  try {
    console.log('🚀 Initializing casino features...');

    // Create sample users if they don't exist
    const sampleUsers = [
      {
        username: 'LuckyWinner',
        password: 'password123',
        role: 'user',
        points: 15000,
        coins: 5000,
        gamesPlayed: 156,
        gamesWon: 107,
        totalEarnings: 2500,
        referralCode: 'LUCKY001'
      },
      {
        username: 'CasinoKing',
        password: 'password123',
        role: 'user',
        points: 12000,
        coins: 3000,
        gamesPlayed: 142,
        gamesWon: 88,
        totalEarnings: 1800,
        referralCode: 'KING002'
      },
      {
        username: 'FortuneSeeker',
        password: 'password123',
        role: 'user',
        points: 10000,
        coins: 2000,
        gamesPlayed: 98,
        gamesWon: 70,
        totalEarnings: 2200,
        referralCode: 'FORTUNE003'
      },
      {
        username: 'LuckyCharm',
        password: 'password123',
        role: 'user',
        points: 8000,
        coins: 1500,
        gamesPlayed: 134,
        gamesWon: 79,
        totalEarnings: 1200,
        referralCode: 'CHARM004'
      },
      {
        username: 'JackpotHunter',
        password: 'password123',
        role: 'user',
        points: 7000,
        coins: 1000,
        gamesPlayed: 89,
        gamesWon: 58,
        totalEarnings: 1600,
        referralCode: 'JACKPOT005'
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = new User({
          ...userData,
          passwordHash
        });
        await user.save();
        console.log(`✅ Created user: ${userData.username}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.username}`);
      }
    }

    // Create sample achievements for existing users
    const users = await User.find({ role: 'user' });
    const achievementDefinitions = [
      { id: 'first_win', title: 'First Win', progress: 1, unlocked: true },
      { id: 'lucky_streak', title: 'Lucky Streak', progress: 3, unlocked: false },
      { id: 'high_roller', title: 'High Roller', progress: 0, unlocked: false },
      { id: 'social_butterfly', title: 'Social Butterfly', progress: 2, unlocked: false },
      { id: 'casino_master', title: 'Casino Master', progress: 2, unlocked: false },
      { id: 'daily_grinder', title: 'Daily Grinder', progress: 5, unlocked: false },
      { id: 'big_winner', title: 'Big Winner', progress: 0, unlocked: false },
      { id: 'referral_king', title: 'Referral King', progress: 1, unlocked: false }
    ];

    for (const user of users) {
      for (const achievementDef of achievementDefinitions) {
        const existingAchievement = await Achievement.findOne({
          userId: user._id,
          achievementId: achievementDef.id
        });

        if (!existingAchievement) {
          const achievement = new Achievement({
            userId: user._id,
            achievementId: achievementDef.id,
            title: achievementDef.title,
            description: `Achievement: ${achievementDef.title}`,
            icon: '🎯',
            category: 'gaming',
            progress: achievementDef.progress,
            maxProgress: 1,
            reward: { type: 'points', amount: 100, description: '100 Points' },
            unlocked: achievementDef.unlocked,
            rarity: 'common'
          });
          await achievement.save();
        }
      }
    }

    // Create sample leaderboard entries
    const timeframes = ['daily', 'weekly', 'monthly'];
    const now = new Date();

    for (const user of users) {
      for (const timeframe of timeframes) {
        let periodStart, periodEnd;
        
        switch (timeframe) {
          case 'daily':
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            const dayOfWeek = now.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
            periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        }

        const existingEntry = await Leaderboard.findOne({
          userId: user._id,
          timeframe,
          periodStart: { $gte: periodStart, $lt: periodEnd }
        });

        if (!existingEntry) {
          const score = Math.floor((user.gamesWon * 100) + (user.totalEarnings * 0.1) + (user.gamesPlayed * 10));
          const entry = new Leaderboard({
            userId: user._id,
            username: user.username,
            avatar: user.avatar,
            timeframe,
            periodStart,
            periodEnd,
            score,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalWinnings: user.totalEarnings,
            totalBets: user.gamesPlayed * 100 // Estimate
          });
          await entry.save();
        }
      }
    }

    // Create sample referrals
    if (users.length >= 2) {
      const referrer = users[0];
      const referred = users[1];

      const existingReferral = await Referral.findOne({
        referrerId: referrer._id,
        referredId: referred._id
      });

      if (!existingReferral) {
        const referral = new Referral({
          referrerId: referrer._id,
          referredId: referred._id,
          referralCode: referrer.referralCode,
          status: 'active',
          rewardEarned: 500,
          joinedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        });
        await referral.save();
        console.log(`✅ Created referral relationship: ${referrer.username} -> ${referred.username}`);
      }
    }

    console.log('🎉 Feature initialization completed!');
    console.log('\n📊 Sample data created:');
    console.log(`- ${users.length} users with achievements`);
    console.log(`- Leaderboard entries for daily/weekly/monthly`);
    console.log(`- Sample referral relationships`);
    console.log('\n🔑 Test accounts:');
    console.log('Username: LuckyWinner, Password: password123');
    console.log('Username: CasinoKing, Password: password123');
    console.log('Username: FortuneSeeker, Password: password123');

  } catch (error) {
    console.error('❌ Error initializing features:', error);
  } finally {
    mongoose.connection.close();
  }
}

initializeFeatures();
