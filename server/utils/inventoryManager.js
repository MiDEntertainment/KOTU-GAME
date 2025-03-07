const { db, getItemDetailsByName, getPlayerStats, getLocationDetailsByID } = require('./dbHelper');

// ✅ Fetch inventory details for a player
async function getInventory(playerId, itemName) {
    try {
        const result = await db.query(
            'SELECT quantity FROM inventory WHERE player_id = $1 AND item_name = $2',
            [playerId, itemName]
        );

        return result.rows.length ? result.rows[0].quantity : 0;
    } catch (error) {
        console.error('❌ Error fetching inventory:', error);
        return null;
    }
}

// ✅ Fetch item limit from the items table
async function getItemLimit(itemName) {
    try {
        const result = await db.query(
            'SELECT item_limit FROM items WHERE item_name = $1',
            [itemName]
        );

        return result.rows.length ? result.rows[0].item_limit : null;
    } catch (error) {
        console.error('❌ Error fetching item limit:', error);
        return null;
    }
}

// ✅ Update inventory (Add or Remove items)
async function updateInventory(playerId, itemName, amount) {
    try {
        const currentQuantity = await getInventory(playerId, itemName);
        if (currentQuantity === null) return `❌ Inventory check failed.`;

        const itemLimit = await getItemLimit(itemName);
        if (itemLimit === null) return `❌ Item data not found.`;

        if (amount > 0 && currentQuantity + amount > itemLimit) {
            return `❌ Inventory for item '${itemName}' is full.`;
        }

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

        const nItem = await getItemDetailsByName(itemName);
        
        if (nItem.sub_type === "npc") {
            const nStat = await getPlayerStats(playerId);
            const locationId = await getLocationDetailsByID(nStat.current_location);
            console.log('NPC conversation');
            return `You meet ${itemName}: ${locationId.plot}`;
        }

        console.log(`✅ Inventory updated: ${itemName} (${currentQuantity + amount})`);
        return `✅ Inventory updated: ${itemName} (${currentQuantity + amount})`;
    } catch (error) {
        console.error(`❌ Error updating inventory:`, error);
        return `❌ Inventory update failed.`;
    }
}

module.exports = { updateInventory, getInventory, getItemLimit };
