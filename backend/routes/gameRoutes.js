// Game routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Game = require('../models/Game');

// Get active games
router.get('/active', async (req, res) => {
    try {
        const activeGames = await Game.find({ status: 'active' })
            .select('gameId players status timeControl timeRemaining lastActivity')
            .sort({ lastActivity: -1 });
        
        res.json(activeGames);
    } catch (error) {
        console.error('Error fetching active games:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get game by ID
router.get('/:gameId', async (req, res) => {
    try {
        const game = await Game.findOne({ gameId: req.params.gameId });
        
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        
        res.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's games (requires authentication)
router.get('/user/history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const games = await Game.find({ 
            'players.userId': userId,
            status: { $in: ['completed', 'abandoned'] }
        })
        .sort({ lastActivity: -1 })
        .limit(20);
        
        res.json(games);
    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
