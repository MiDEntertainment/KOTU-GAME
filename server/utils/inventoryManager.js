const { db } = require('./dbHelper');

// ✅ Fetch inventory details for a player (May not need)
// async function getInventory(playerId, itemName) {
//     try {
//         const result = await db.query(
//             'SELECT quantity FROM inventory WHERE player_id = $1 AND item_name = $2',
//             [playerId, itemName]
//         );

//         return result.rows.length ? result.rows[0].quantity : 0;
//     } catch (error) {
//         console.error('❌ Error fetching inventory:', error);
//         return null;
//     }
// }

// ✅ Update inventory (Add or Remove items)
async function updateInventory(playerId, itemName, amount) {
    try {
        const currentQuantity = await getInventory(playerId, itemName);

        if (currentQuantity === null) return `❌ Inventory check failed.`;

        if (currentQuantity + amount < 0) {
            return `❌ Not enough '${itemName}' in inventory to remove.`;
        }

        await db.query(
            `INSERT INTO inventory (player_id, item_name, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (player_id, item_name) 
             DO UPDATE SET quantity = inventory.quantity + $3`,
            [playerId, itemName, amount]
        );

        return `✅ Inventory updated: ${itemName} (${currentQuantity + amount})`;
    } catch (error) {
        console.error(`❌ Error updating inventory:`, error);
        return `❌ Inventory update failed.`;
    }
}

module.exports = { updateInventory };
