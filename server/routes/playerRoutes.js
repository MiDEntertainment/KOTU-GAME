const express = require('express');
const router = express.Router();
const { getPlayerId } = require('../utils/dbHelper');

// Fetch player details by Twitch username
router.get('/player/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const result = await req.db.query('SELECT * FROM player WHERE twitch_username = $1', [username]);

        console.log(`🛠 Query result:`, result.rows);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json(result.rows[0]); // Return player details
    } catch (error) {
        console.error('❌ Error fetching player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Fetch player stats by Twitch username (Refactored)
router.get('/player/:username/stats', async (req, res) => {
    try {
        const { username } = req.params;

        // ✅ Use helper function to get player ID
        const playerId = await getPlayerId(username);

        if (!playerId) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Fetch stats using player_id
        const statsResult = await req.db.query('SELECT * FROM player_stats WHERE player_id = $1', [playerId]);

        if (statsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Stats not found' });
        }

        res.json(statsResult.rows[0]); // Return player stats
    } catch (error) {
        console.error('❌ Error fetching player stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;