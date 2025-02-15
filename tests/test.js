const { skillAttempt, skillProbability, itemSelection, inventoryUpdate, updateSkillLevel } = require('../server/utils/gameMechanics');

(async () => {
    try {
        console.log("✅ Running tests for gameMechanics.js\n");

        // Test skillProbability function
        console.log("🎯 Testing skillProbability...");
        console.log("Skill Level 10: ", skillProbability(10)); // Should return true ~25% of the time
        console.log("Skill Level 60: ", skillProbability(60)); // Should return true ~75% of the time

        // Test itemSelection function
        console.log("\n🎯 Testing itemSelection...");
        console.log(await itemSelection('Fish', 1)); // Should return a fish from location 1

        // // Test skillAttempt function
        // console.log("\n🎯 Testing skillAttempt...");
        // console.log(await skillAttempt('quietgamergirl', 'fishing_skills', 'Fish'));

        // // Test inventoryUpdate function
        // console.log("\n🎯 Testing inventoryUpdate...");
        // await inventoryUpdate(1, 'Common Fish');
        // console.log("Inventory Updated Successfully!");

        // // Test updateSkillLevel function
        // console.log("\n🎯 Testing updateSkillLevel...");
        // await updateSkillLevel(1, 'fishing_skills');
        // console.log("Skill Level Increased Successfully!");

        // console.log("\n✅ All tests executed! Comment out the ones you don't need when testing.");
    } catch (error) {
        console.error("❌ Error during testing:", error);
    }
})();
