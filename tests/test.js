const { db, skillProbability, getPlayerId, updatePlayerStats, getItemDetails, getInventory, updateInventory, skillAttempt, eatItem, sellItem, fightEnemy} = require('../server/utils/gameMechanics');

// //Unit tests for skillAttempt functions. Check amount in DB before each test
// (async () => {
//     try {
//         // Test skillProbability function
//         console.log("🎯 Testing skillProbability...");
//         console.log("Skill Level 10: ", skillProbability(10)); // Should return true ~25% of the time
//         console.log("Skill Level 60: ", skillProbability(60)); // Should return true ~75% of the time

//         // // Test itemSelection function
//         console.log("\n🎯 Testing itemSelection...");
//         console.log(await itemSelection('Fish', 1)); // Should return a fish from location 1

//         //Test inventoryUpdate function
//         console.log("\n🎯 Testing inventoryUpdate...");
//         console.log(await inventoryUpdate(1, 'Common Fish'));
        
//         // Test updateSkillLevel function
//         console.log("\n🎯 Testing updateSkillLevel...");
//         await updateSkillLevel(1, 'fishing_skills');     
//         console.log("Skill Level Increased Successfully!");

//         //Test skillAttempt function
//         console.log("🎯 Running tests for skillAttempt>> gameMechanics.js\n");
//         console.log(await skillAttempt('quietgamergirl', 'searching_skills', 'iQuest'));
//     } catch (error) {
//         console.error("❌ Error during testing:", error);
//     }
// })();


// //Unit tests for eatItem and sellItem functions. Check amount in DB before each test

// (async () => {

//     // ✅ 1. Test successful eating
//     console.log('✅ 1. Test successful eating');
//     console.log(await eatItem('quietgamergirl', 'fish', 1)); // Expected: Gains health, updates inventory

    // // ❌ 2. Test eating item not in inventory
    // console.log('❌ 2. Test eating item not in inventory');
    // console.log(await eatItem('quietgamergirl', 'NonExistentItem', 1)); // Expected: Error message

    // // ❌ 3. Test eating more than available
    // console.log('❌ 3. Test eating more than available');
    // console.log(await eatItem('quietgamergirl', 'Common Fish', 100)); // Expected: Error about insufficient quantity

    // // ❌ 4. Test eating item with sell price = 0
    // console.log('❌ 4. Test eating item with sell price = 0');
    // console.log(await eatItem('quietgamergirl', 'Lumins', 1)); // Expected: Cannot eat this item

    // // ✅ 5. Test successful selling
    // console.log('✅ 5. Test successful selling');
    // console.log(await sellItem('quietgamergirl', 'Common Rabbit', 1)); // Expected: Gains Lumins, updates inventory

    // // ❌ 6. Test selling more than the current limit
    // console.log('❌ 6. Test selling more than the current limit');
    // console.log(await sellItem('quietgamergirl', 'Common Rabbit', 10)); // Expected: Error about exceeding Lumins inventory limit

    // // ❌ 7. Test selling item not in inventory
    // console.log('❌ 7. Test selling item not in inventory');
    // console.log(await sellItem('quietgamergirl', 'Apple', 1)); // Expected: Error message

    // // ❌ 8. Test selling more than available
    // console.log('❌ 8. Test selling more than available');
    // console.log(await sellItem('quietgamergirl', 'Common Rabbit', 100)); // Expected: Error about insufficient quantity

    // // ❌ 9. Test selling item with sell price = 0
    // console.log('❌ 9. Test selling item with sell price = 0');
    // console.log(await sellItem('quietgamergirl', 'XP', 1)); // Expected: Cannot sell this item
// })();

// // test for fight

// (async () => {

//     // ✅ 1. Test successful fighting
//     console.log('✅ 1. Test successful fighting');
//     console.log(await fightEnemy('quietgamergirl', 'enemy') ); // Expected: minus health, updates inventory with XP
// })();