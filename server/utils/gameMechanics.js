require('dotenv').config();
const { Pool } = require('pg');

// PostgreSQL Database Connection
const db= new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

//METHOD ADDNEWPLAYER
async function addNewPlayer(username) {
    try {
        // Check if the player already exists
        const existingPlayer = await db.query('SELECT player_id FROM player WHERE twitch_username = $1', [username]);
        
        if (existingPlayer.rows.length > 0) {
            return `@${username}, you are already on your journey. Use the channel rewards to play the game and download the Twitch extension to see your stats.`;
        }

        // Insert new player into the player table
        const newPlayer = await db.query(
            'INSERT INTO player (twitch_username) VALUES ($1) RETURNING player_id',
            [username]
        );
        
        const playerId = newPlayer.rows[0].player_id;

        // Initialize player stats
        await db.query(
            `INSERT INTO player_stats (player_id) VALUES ($1)`,
            [playerId]
        );

        return `@${username}, welcome to your new adventure! Use the channel rewards to play the game and download the Twitch extension to see your stats.`;
    } catch (error) {
        console.error('❌ Error adding new player:', error);
        return `❌ An error occurred while adding you to the game, @${username}. Please try again later.`;
    }
}

//METHOD SKILLATTEMPT AND ITS HELPERS
/**
 * Determines the probability of success based on the player's skill level.
 * @param {number} skillLevel - The player's skill level.
 * @returns {boolean} - True if successful, false if failed.
 */
function skillProbability(skillLevel) {
    const probabilities = [35, 50, 75, 99];
    let threshold;
    
    if (skillLevel <= 25) threshold = probabilities[0];
    else if (skillLevel <= 50) threshold = probabilities[1];
    else if (skillLevel <= 75) threshold = probabilities[2];
    else threshold = probabilities[3];
    
    const roll = Math.random() * 100;
    const success = roll < threshold;
    
    console.log(`🎲 Rolled: ${roll.toFixed(2)} | Threshold: ${threshold}% | Success: ${success}`);
    return success;
}

/**
 * Selects a valid item based on type and location.
 * @param {string} itemType - The type of item (e.g., 'Fish').
 * @param {number} location - The player's current location.
 * @returns {Promise<object|null>} - Selected item or null if none found.
 */
async function itemSelection(itemType, location) {
    const result = await db.query(
        `SELECT * FROM items 
         WHERE item_type = $1 
         AND (item_location = 0 OR item_location = $2) 
         ORDER BY RANDOM() LIMIT 1`, [itemType, location]
    );
    
    const selectedItem = result.rows[0] || null;
    return selectedItem;
}

/**
 * Updates the player's inventory, ensuring the item quantity does not exceed the item's limit.
 * @param {number} playerId - The player's ID.
 * @param {string} itemName - The name of the item.
 */
async function inventoryUpdate(playerId, itemName) {
    try {
        // ✅ Step 1: Get the item limit from the 'items' table
        const itemResult = await db.query(
            `SELECT item_limit FROM items WHERE item_name = $1`,
            [itemName]
        );

        if (itemResult.rows.length === 0) {
            console.error(`❌ Item '${itemName}' not found in the items table.`);
            return;
        }

        const itemLimit = itemResult.rows[0].item_limit;

        // ✅ Step 2: Get the current quantity from the 'inventory' table
        const inventoryResult = await db.query(
            `SELECT quantity FROM inventory WHERE player_id = $1 AND item_name = $2`,
            [playerId, itemName]
        );

        let currentQuantity = 0;

        if (inventoryResult.rows.length > 0) {
            currentQuantity = inventoryResult.rows[0].quantity;
        }

        // ✅ Step 3: Check if the new quantity exceeds the item limit
        if (currentQuantity >= itemLimit) {
            console.log(`⚠️ Player ${playerId} cannot carry more '${itemName}' (limit: ${itemLimit}).`);
            return;
        }

        // ✅ Step 4: Insert new item if not exists or update quantity
        await db.query(
            `INSERT INTO inventory (player_id, item_name, quantity)
             VALUES ($1, $2, 1)
             ON CONFLICT (player_id, item_name) 
             DO UPDATE SET quantity = inventory.quantity + 1`,
            [playerId, itemName]
        );

        console.log(`✅ Added '${itemName}' to player ${playerId}'s inventory (new quantity: ${currentQuantity + 1}).`);
    } catch (error) {
        console.error(`❌ Error updating inventory for player ${playerId}:`, error);
    }
}

/**
 * Increases the player's skill level by 1.
 * @param {number} playerId - The player's ID.
 * @param {string} skillType - The skill column to update.
 */
async function updateSkillLevel(playerId, skillType) {
    await db.query(`UPDATE player_stats SET ${skillType} = ${skillType} + 1 WHERE player_id = $1`, [playerId]);
}

/**
 * Attempts a skill-based action (e.g., fishing, hunting, searching).
 * @param {string} username - The player's Twitch username.
 * @param {string} skillType - The skill type being attempted (e.g., 'fishing_skills').
 * @param {string} itemType - The type of item to retrieve (e.g., 'Fish').
 * @returns {Promise<string>} - Success or failure message.
 */
async function skillAttempt(username, skillType, itemType) {
    try {
        const result = await db.query(
            `SELECT ps.${skillType}, ps.current_location, p.player_id 
             FROM player_stats ps 
             JOIN player p ON ps.player_id = p.player_id 
             WHERE p.twitch_username = $1`, [username]
        );

        if (result.rows.length === 0) return `❌ Player not found. To register your player enter !play in chat`;
        
        const { player_id, current_location } = result.rows[0];
        const skillLevel = result.rows[0][skillType];
        
        if (!skillProbability(skillLevel)) {
            return `❌ You failed to catch anything this time.`;
        }
        
        const item = await itemSelection(itemType, current_location);
        if (!item) return `❌ No valid items found.`;
        
        await inventoryUpdate(player_id, item.item_name);
        await updateSkillLevel(player_id, skillType);
        
        return `✅ Success! You obtained a ${item.item_name}.`;
    } catch (error) {
        console.error('❌ Error in skillAttempt:', error);
        return `❌ An error occurred.`;
    }
}

module.exports = { skillAttempt, skillProbability, itemSelection, inventoryUpdate, updateSkillLevel, addNewPlayer};