let completedScoreToSave = null;
let scoreSaveInProgress = false;

function scoreSaveMessage(message) {
    const status = document.getElementById("score-save-status");
    if (status) status.textContent = message;
}

function renderScorePrivacy(user) {
    const consent = document.getElementById("public-score-consent");
    const button = document.getElementById("save-score-button");
    if (!consent || !button) return;
    consent.hidden = true;
    consent.disabled = true;
    button.disabled = !user;
    button.textContent = user ? "Save score to my account" : "Sign in to save privately";
    document.getElementById("score-privacy-help").textContent = user
        ? "Completed runs save to your account automatically. Account scores are not sent to the public leaderboard. You can also save your current score here."
        : "Play freely. Public score publishing is paused while score verification is added. Sign in to save scores privately.";
}

async function submitScore(score, options = {}) {
    // The game resets its score immediately after a completed run. Keep that
    // result in memory so a guest can choose to publish it afterward.
    if (options.automatic) completedScoreToSave = Number(score);
    if (scoreSaveInProgress) return;

    const nameInput = document.getElementById("playerName");
    const enteredName = nameInput.value.trim();
    if (!options.automatic && enteredName.toLowerCase() === "devmode") {
        openDeveloperMenu();
        nameInput.value = "";
        return;
    }

    scoreSaveInProgress = true;
    const button = document.getElementById("save-score-button");
    button.disabled = true;
    let canSavePrivately = false;
    try {
        const accountClient = window.siteSupabaseClient;
        if (!accountClient) throw new Error("Account services could not load. Reload the page to try again.");
        const { data: sessionData, error: sessionError } = await accountClient.auth.getSession();
        if (sessionError) throw new Error("Could not check your account. Please try again.");
        let user = null;
        if (sessionData.session) {
            const { data: authData, error: authError } = await accountClient.auth.getUser();
            if (authError || !authData.user) throw new Error("Your session could not be verified. Sign in again before saving your score.");
            user = authData.user;
        }
        renderScorePrivacy(user);
        canSavePrivately = Boolean(user);

        if (!user) {
            scoreSaveMessage(options.automatic
                ? `Run complete: ${score} points. Sign in to save scores privately. Public publishing is paused.`
                : "Sign in to save your score privately. Public score publishing is paused.");
            return;
        }

        const value = !options.automatic && Number(score) === 0 && completedScoreToSave !== null
            ? completedScoreToSave : Number(score);
        if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) {
            throw new Error("That score cannot be saved. Start another run and try again.");
        }

        if (user) {
            const metadataName = user.user_metadata && user.user_metadata.display_name;
            const name = (enteredName || metadataName || "Player").slice(0, 80);
            const { error } = await accountClient.from("player_dice_scores").insert([{
                user_id: user.id,
                display_name: name,
                score: value,
                mode: window.mode === "normal" ? "normal" : "easy"
            }]);
            if (error) throw new Error("Your account score could not be saved. Please try again later.");
            completedScoreToSave = null;
            scoreSaveMessage(`${value} points saved to your account. This score was not published on the public leaderboard.`);
            return;
        }


    } catch (error) {
        scoreSaveMessage(error.message || "Your score could not be saved. Check your connection and try again.");
    } finally {
        scoreSaveInProgress = false;
        button.disabled = !canSavePrivately;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("submit-form").addEventListener("submit", (event) => {
        event.preventDefault();
        submitScore(window.score);
    });
    const client = window.siteSupabaseClient;
    if (!client) return;
    client.auth.getSession().then(({ data }) => renderScorePrivacy(data.session && data.session.user))
        .catch(() => scoreSaveMessage("Could not check your account. Please reload to try again."));
    client.auth.onAuthStateChange((_event, session) => renderScorePrivacy(session && session.user));
});
