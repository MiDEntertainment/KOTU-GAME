require('dotenv').config();
const { Pool } = require('pg');

// PostgreSQL Database Connection
const db= new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

//START METHOD SKILLATTEMPT AND ITS HELPERS
/**
 * Determines the probability of success based on the player's skill level.
 * @param {number} skillLevel - The player's skill level.
 * @returns {boolean} - True if successful, false if failed.
 */
function skillProbability(skillLevel) {
    const probabilities = [25, 50, 75, 99];
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
 * Updates the player's inventory, adding an item if it doesn't exist.
 * @param {number} playerId - The player's ID.
 * @param {string} itemName - The name of the item.
 */
async function inventoryUpdate(playerId, itemName) {
    await db.query(
        `INSERT INTO inventory (player_id, item_name, quantity)
         VALUES ($1, $2, 1)
         ON CONFLICT (player_id, item_name) DO UPDATE 
         SET quantity = inventory.quantity + 1`,
        [playerId, itemName]
    );
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
            `SELECT ps.${skillType}, ps.current_objective, p.player_id 
             FROM player_stats ps 
             JOIN player p ON ps.player_id = p.player_id 
             WHERE p.twitch_username = $1`, [username]
        );

        if (result.rows.length === 0) return `❌ Player not found.`;
        
        const { player_id, current_objective } = result.rows[0];
        const skillLevel = result.rows[0][skillType];
        
        if (!skillProbability(skillLevel)) {
            return `❌ You failed to catch anything this time.`;
        }
        
        const item = await itemSelection(itemType, current_objective);
        if (!item) return `❌ No valid items found.`;
        
        await inventoryUpdate(player_id, item.item_name);
        await updateSkillLevel(player_id, skillType);
        
        return `✅ Success! You obtained ${item.item_name}.`;
    } catch (error) {
        console.error('❌ Error in skillAttempt:', error);
        return `❌ An error occurred.`;
    }
}

module.exports = { skillAttempt, skillProbability, itemSelection, inventoryUpdate, updateSkillLevel };