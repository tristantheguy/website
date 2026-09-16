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
    consent.hidden = Boolean(user);
    consent.disabled = Boolean(user);
    button.textContent = user ? "Save score to my account" : "Publish score";
    document.getElementById("score-privacy-help").textContent = user
        ? "Completed runs save to your account automatically. Account scores are not sent to the public leaderboard. You can also save your current score here."
        : "You can play without sharing data. To publish a score, choose a nickname and confirm the choices below. Completed guest runs are never published automatically.";
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

        if (!user && options.automatic) {
            scoreSaveMessage(`Run complete: ${score} points. Choose the sharing options and Publish score to share this result, or keep playing without publishing.`);
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

        if (!enteredName || enteredName.length > 80) {
            nameInput.focus();
            throw new Error("Choose a nickname of 1 to 80 characters before publishing.");
        }
        if (!document.getElementById("score-age-confirmation").checked) {
            document.getElementById("score-age-confirmation").focus();
            throw new Error("Guest score publishing is for people age 13 or older. Confirm your age to continue.");
        }
        if (!document.getElementById("score-terms-consent").checked) {
            document.getElementById("score-terms-consent").focus();
            throw new Error("Read and accept the terms before publishing a guest score.");
        }
        if (!document.getElementById("public-score-sharing").checked) {
            document.getElementById("public-score-sharing").focus();
            throw new Error("Choose the public sharing option to publish this score. You can keep playing without sharing.");
        }
        const { error } = await supabaseClient.from("leaderboard").insert([{ name: enteredName, score: value }]);
        if (error) throw new Error("Your score could not be published. Please try again later.");
        completedScoreToSave = null;
        document.getElementById("public-score-sharing").checked = false;
        scoreSaveMessage(`${value} points published under ${enteredName}.`);
        loadLeaderboard();
    } catch (error) {
        scoreSaveMessage(error.message || "Your score could not be saved. Check your connection and try again.");
    } finally {
        scoreSaveInProgress = false;
        button.disabled = false;
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
