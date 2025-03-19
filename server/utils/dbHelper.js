require('dotenv').config();
const { Pool } = require('pg');

// ✅ PostgreSQL Database Connection
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ✅ Helper Function: Validate Input
function validateUsername(username) {
    return typeof username === 'string' && /^[a-zA-Z0-9_]{3,50}$/.test(username.trim());
}

function validateId(id) {
    return Number.isInteger(id) && id > 0;
}

function validateUpdates(updates) {
    return Object.keys(updates).every(key => {
        const value = updates[key];
        return (
            typeof value === 'number' || 
            (typeof value === 'string' && value.length <= 30)
        );
    });
}

// ✅ Fetch player ID by Twitch username
async function getPlayerId(username) {
    if (!validateUsername(username)) {
        console.error(`❌ Invalid username format: ${username}`);
        return null;
    }
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
    if (!validateId(playerId)) {
        console.error(`❌ Invalid player ID: ${playerId}`);
        return null;
    }
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

// ✅ Update player stats dynamically (Sanitized)
async function updatePlayerStats(playerId, updates) {
    if (!validateId(playerId) || !validateUpdates(updates)) {
        console.error(`❌ Invalid parameters for updating player stats.`);
        return false;
    }
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

// ✅ Add New Player (Sanitized)
async function addNewPlayer(username, twitchId) {
    try {
        const playerId = await getPlayerId(username);
        if (playerId) {
            return `@${username}, you are already on your journey. Use the channel rewards to play the game.`;
        }

        const newPlayer = await db.query(
            `INSERT INTO player (twitch_username, join_date, twitch_id) 
             VALUES ($1, NOW(), $2) RETURNING player_id`,
            [username, twitchId]
        );

        const newPlayerId = newPlayer.rows[0].player_id;

        await db.query(`INSERT INTO player_stats (player_id) VALUES ($1)`, [newPlayerId]);

        return `@${username}, Welcome traveler! Use channel rewards to play the game.`;
    } catch (error) {
        console.error('❌ Error adding new player:', error);
        return `❌ An error occurred while adding you to the game, @${username}. Please try again later.`;
    }
}

// ✅ Fetch Item Details by Name (Sanitized)
async function getItemDetailsByName(itemName) {
    if (typeof itemName !== 'string' || itemName.trim().length > 100) {
        console.error(`❌ Invalid item name: ${itemName}`);
        return null;
    }
    try {
        const result = await db.query(
            'SELECT * FROM items WHERE item_name = $1',
            [itemName.trim()]
        );
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching item by name:', error);
        return null;
    }
}

// ✅ Fetch Item Details by ID (Sanitized)
async function getItemDetailsByID(itemID) {
    if (!validateId(itemID)) {
        console.error(`❌ Invalid item ID: ${itemID}`);
        return null;
    }
    try {
        const result = await db.query(
            'SELECT * FROM items WHERE item_id = $1',
            [itemID]
        );
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching item by ID:', error);
        return null;
    }
}

// ✅ Fetch random item by item type & player location
async function getItemDetailsByType(playerId, itemType) {
    if (!validateId(playerId) || !validateUpdates(itemType)) {
        console.error(`❌ Invalid parameters for updating player stats.`);
        return false;
    }
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

// ✅ Fetch Location by ID (Sanitized)
async function getLocationDetailsByID(locID) {
    if (!validateId(locID)) {
        console.error(`❌ Invalid location ID: ${locID}`);
        return null;
    }
    try {
        const result = await db.query(
            'SELECT * FROM locations WHERE location_id = $1',
            [locID]
        );
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching location by ID:', error);
        return null;
    }
}

// ✅ Calculate Win Chance (Ensured Safe)
function winChance(fightLevel, enemyDifficulty) {
    if (!validateId(fightLevel) || !validateId(enemyDifficulty)) {
        console.error(`❌ Invalid fight parameters.`);
        return `❌ Error processing win chance.`;
    }
    try {
        const randomBonus = Math.floor(Math.random() * 10) + 1; // Random bonus between 1-10

        if (enemyDifficulty === 0) return 90.0;

        let winChance = ((fightLevel + randomBonus) / enemyDifficulty) * 100;
        return Math.min(Math.max(winChance, 35), 90);
    } catch (error) {
        console.error('❌ Error processing win chance:', error);
        return `❌ Error processing win chance.`;
    }
}

module.exports = { 
    db, 
    getPlayerId, 
    getPlayerStats, 
    updatePlayerStats, 
    addNewPlayer, 
    getItemDetailsByName, 
    getItemDetailsByID,
    getItemDetailsByType, 
    getLocationDetailsByID, 
    winChance 
};
