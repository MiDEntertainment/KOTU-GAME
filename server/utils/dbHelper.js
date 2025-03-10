require('dotenv').config();
const { Pool } = require('pg');

// ✅ PostgreSQL Database Connection
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ✅ Fetch player ID by Twitch username
async function getPlayerId(username) {
    try {
        const result = await db.query(
            'SELECT player_id FROM player WHERE LOWER(twitch_username) = $1',
            [username.toLowerCase()]
        );

        return result.rows.length ? result.rows[0].player_id : null;
    } catch (error) {
        console.error('❌ Error fetching player ID:', error);
        return null;
    }
}

// ✅ Fetch player stats
async function getPlayerStats(playerId) {
    try {
        const result = await db.query(
            'SELECT * FROM player_stats WHERE player_id = $1',
            [playerId]
        );
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching player stats:', error);
        return null;
    }
}

// ✅ Update player stats dynamically
async function updatePlayerStats(playerId, updates) {
    try {
        const queryParts = Object.entries(updates)
            .map(([key, value], i) => `${key} = $${i + 2}`)
            .join(', ');

        const values = [playerId, ...Object.values(updates)];

        await db.query(`UPDATE player_stats SET ${queryParts} WHERE player_id = $1`, values);
        return true;
    } catch (error) {
        console.error('❌ Error updating player stats:', error);
        return false;
    }
}

//search the db for the player or add new
async function addNewPlayer(username, twitchId) {
    try {
        // Check if the player already exists
        const playerId = await getPlayerId(username);
        if (playerId) {
            return `@${username}, you are already on your journey. Use the channel rewards to play the game and download the Twitch extension to see your stats.`;
        }

        // Insert new player into the player table
        const newPlayer = await db.query(
            `INSERT INTO player (twitch_username, join_date, twitch_id) 
             VALUES ($1, NOW(), $2) RETURNING player_id`,
            [username, twitchId]
        );

        const newPlayerId = newPlayer.rows[0].player_id;

        // Initialize player stats
        await db.query(
            `INSERT INTO player_stats (player_id)
             VALUES ($1)`,
            [newPlayerId]
        );

        return `@${username}, Welcome traveler! Use channel rewards to play the game.`;
    } catch (error) {
        console.error('❌ Error adding new player:', error);
        return `❌ An error occurred while adding you to the game, @${username}. Please try again later.`;
    }
}

// ✅ Fetch item details by exact item name
async function getItemDetailsByName(itemName) {
    try {
        const result = await db.query(
            'SELECT * FROM items WHERE item_name = $1',
            [itemName]
        );
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching item by name:', error);
        return null;
    }
}

// ✅ Fetch item details by exact item name
async function getItemDetailsByID(itemID) {
    try {
        const result = await db.query(
            'SELECT * FROM items WHERE item_id = $1',
            [itemID]
        );
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching item by name:', error);
        return null;
    }
}

// ✅ Fetch random item by item type & player location
async function getItemDetailsByType(playerId, itemType) {
    try {
        // Get player's current location
        const playerResult = await db.query(
            'SELECT current_location FROM player_stats WHERE player_id = $1',
            [playerId]
        );
        if (!playerResult.rows.length) return null;

        const playerLocation = playerResult.rows[0].current_location;

        // Find an item that matches item_type & is available at the player's location (or globally)
        const itemResult = await db.query(
            `SELECT * FROM items 
             WHERE item_type = $1 
             AND (item_location = 0 OR item_location = $2) 
             ORDER BY RANDOM() LIMIT 1`,
            [itemType, playerLocation]
        );

        return itemResult.rows.length ? itemResult.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching item by type:', error);
        return null;
    }
}

// ✅ Fetch item details by exact location ID
async function getLocationDetailsByID(locID) {
    try {
        const result = await db.query(
            'SELECT * FROM locations WHERE location_id = $1',
            [locID]
        );
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching lcoation by id:', error);
        return null;
    }
}

// ✅ Probability of wining a fight
function winChance(fightLevel, enemyDifficulty) {
    try {
    const randomBonus = Math.floor(Math.random() * 10) + 1; // Random bonus between 1-10

    // Prevent division by zero
    if (enemyDifficulty === 0) return 90.0;

    let winChance = ((fightLevel + randomBonus) / enemyDifficulty) * 100;

    // Ensure winChance falls within the 35% - 90% range
    return Math.min(Math.max(winChance, 35), 90);

    } catch (error) {
        console.error('❌ error processing winchance:', error);
        return `❌ error processing winchance.`;
    }
    
}

module.exports = { db, getPlayerId, getPlayerStats, updatePlayerStats, getItemDetailsByName, getItemDetailsByType, addNewPlayer, winChance, getItemDetailsByID, getLocationDetailsByID };
