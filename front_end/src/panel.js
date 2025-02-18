document.addEventListener("DOMContentLoaded", function () {
    let twitch = window.Twitch.ext;
    const API_BASE_URL = "https://kotu-game.onrender.com"; // ✅ Hosted backend

    function fetchPlayerData(twitchUserId) {
        fetch(`${API_BASE_URL}/api/player/${twitchUserId}/stats`)
            .then(response => {
                console.log("🛠 API Response:", response);
                if (!response.ok) {
                    throw new Error('Player not found');
                }
                return response.json();
            })
            .then(playerData => {
                // ✅ Update Player Name
                document.getElementById("player-username").textContent = twitchUserId ?? "N/A";

                // ✅ Update Stats
                document.getElementById("health").textContent = playerData.health ?? "N/A";
                document.getElementById("weapon_level").textContent = playerData.weapon_level ?? "N/A";
                document.getElementById("life_skills").textContent = playerData.life_skills ?? "N/A";
                document.getElementById("hunting_skills").textContent = playerData.hunting_skills ?? "N/A";
                document.getElementById("searching_skills").textContent = playerData.searching_skills ?? "N/A";
                document.getElementById("current_location").textContent = playerData.current_location ?? "N/A";
                document.getElementById("current_rank").textContent = playerData.current_rank ?? "N/A";
                document.getElementById("health_cap").textContent = playerData.health_cap ?? "N/A";
            })
            .catch(error => {
                console.error("❌ Error fetching player data:", error);
                document.getElementById("player-username").textContent = "Player Not Found";
            });
    }

    fetchPlayerData("quietgamergirl"); // Replace with Twitch auth later
});
