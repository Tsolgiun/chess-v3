const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Create user in Firestore if they don't exist (for Google sign-in users)
      const userRecord = await admin.auth().getUser(uid);
      
      const userData = {
        username: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
        email: userRecord.email || '',
        rating: 1200,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.collection('users').doc(uid).set(userData);
      
      // Add user to request object
      req.user = {
        _id: uid,
        ...userData
      };
    } else {
      // Add user to request object
      req.user = {
        _id: uid,
        ...userDoc.data()
      };
    }
    
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = auth;
