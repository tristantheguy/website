async function submitScore(score) {
    const nameInput = document.getElementById("playerName");
    const name = nameInput.value.trim();

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    const { error } = await supabaseClient
        .from("leaderboard")
        .insert([{ name, score }]);

    if (error) {
        console.error(error);
        alert("Score submission failed.");
        return;
    }

    loadLeaderboard();
}
