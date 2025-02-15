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
                document.getElementById("energy").textContent = playerData.energy ?? "N/A";
                document.getElementById("fighting_skills").textContent = playerData.fighting_skills ?? "N/A";
                document.getElementById("life_skills").textContent = playerData.life_skills ?? "N/A";
                document.getElementById("fishing_skills").textContent = playerData.fishing_skills ?? "N/A";
                document.getElementById("hunting_skills").textContent = playerData.hunting_skills ?? "N/A";
                document.getElementById("searching_skills").textContent = playerData.searching_skills ?? "N/A";
                document.getElementById("capacity").textContent = playerData.capacity ?? "N/A";
                document.getElementById("current_objective").textContent = playerData.current_objective ?? "N/A";
                document.getElementById("current_rank").textContent = playerData.current_rank ?? "N/A";
            })
            .catch(error => {
                console.error("❌ Error fetching player data:", error);
                document.getElementById("player-username").textContent = "Player Not Found";
            });
    }

    fetchPlayerData("quietgamergirl"); // Replace with Twitch auth later
});
