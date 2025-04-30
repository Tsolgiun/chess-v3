const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

// This function is no longer needed as Firebase handles token generation
// Kept for reference
const generateToken = (userId) => {
  return null;
};

// Register is handled by Firebase Authentication on the frontend
// This endpoint is kept for compatibility but is essentially a no-op
const register = async (req, res) => {
  try {
    res.status(400).json({ error: 'Registration should be done through Firebase Authentication' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login is handled by Firebase Authentication on the frontend
// This endpoint is kept for compatibility but is essentially a no-op
const login = async (req, res) => {
  try {
    res.status(400).json({ error: 'Login should be done through Firebase Authentication' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    // User data is already available from the auth middleware
    res.json({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      rating: req.user.rating || 1200,
      gamesPlayed: req.user.gamesPlayed || 0,
      wins: req.user.wins || 0,
      losses: req.user.losses || 0,
      draws: req.user.draws || 0,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(400).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['username', 'email'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const uid = req.user._id;
    const updateData = {
      ...updates.reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {}),
      updatedAt: new Date().toISOString()
    };
    
    // Update in Firestore
    await db.collection('users').doc(uid).update(updateData);
    
    // If email is being updated, update in Firebase Auth as well
    if (updateData.email) {
      await admin.auth().updateUser(uid, {
        email: updateData.email
      });
    }
    
    // Get updated user data
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    res.json({
      id: uid,
      ...userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
