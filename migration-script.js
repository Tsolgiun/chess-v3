require('dotenv').config();
const admin = require('./backend/config/firebase');
const mongoose = require('mongoose');
const User = require('./backend/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-app');

async function migrateUsers() {
  try {
    // Get all users from MongoDB
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
          email: user.email,
          password: 'temporaryPassword123', // Users will need to reset password
          displayName: user.username
        });
        
        // Store user data in Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
          username: user.username,
          email: user.email,
          rating: user.rating || 1200,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          createdAt: user.joinedDate?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error);
      }
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
    process.exit();
  }
}

migrateUsers();
