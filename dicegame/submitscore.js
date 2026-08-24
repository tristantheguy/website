async function submitScore(score, options = {}) {
    const nameInput = document.getElementById("playerName");
    const enteredName = nameInput.value.trim();

    const { data: authData } = window.siteSupabaseClient
        ? await window.siteSupabaseClient.auth.getUser()
        : { data: { user: null } };
    const user = authData && authData.user;
    const metadataName = user && user.user_metadata && user.user_metadata.display_name;
    const name = enteredName || metadataName || (user && user.email ? user.email.split("@")[0] : "");

    if (name.toLowerCase() === "devmode") {
        openDeveloperMenu();
        nameInput.value = "";
        return;
    }

    if (!name && options.automatic) {
        const status = document.getElementById("status-message");
        if (status) status.textContent = "Run complete. Enter a name or log in to save your score.";
        return;
    }

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    const { error: publicError } = await supabaseClient
        .from("leaderboard")
        .insert([{ name, score }]);

    let personalError = null;
    if (user && window.siteSupabaseClient) {
        const result = await window.siteSupabaseClient
            .from("player_dice_scores")
            .insert([{ user_id: user.id, display_name: name, score: Number(score) || 0, mode: window.mode || "easy" }]);
        personalError = result.error;
    }

    if (publicError) console.error("Public leaderboard submission failed:", publicError);
    if (personalError) console.error("Personal score submission failed:", personalError);
    if (publicError && personalError) return alert("Score submission failed. Check the database migration and try again.");
    if (publicError) alert("Your profile score was saved, but the public leaderboard could not be updated.");
    if (personalError) alert("Your public score was saved, but your profile record could not be saved yet. Run the database migration and try again.");
    loadLeaderboard();
}
