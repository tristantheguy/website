function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadLeaderboard() {
    const leaderboard = document.getElementById("leaderboard");

    if (typeof supabaseClient === "undefined" || !supabaseClient) {
        console.error("Supabase client is not initialized before leaderboard fetch.", {
            supabaseClient,
            windowSupabase: window.supabase,
        });
        leaderboard.textContent = "Unable to load leaderboard right now.";
        return;
    }

    const { data, error } = await supabaseClient
        .from("leaderboard")
        .select("name, score")
        .order("score", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching leaderboard from Supabase:", error);
        leaderboard.textContent = "Unable to load leaderboard right now.";
        return;
    }

    if (!data || data.length === 0) {
        leaderboard.textContent = "No scores have been submitted yet.";
        return;
    }

    let html = `
<table>
<tr>
<th>Name</th>
<th>Score</th>
</tr>
`;

    for (const row of data) {
        html += `
<tr>
<td>${escapeHtml(row.name)}</td>
<td>${row.score}</td>
</tr>
`;
    }

    html += "</table>";
    leaderboard.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", loadLeaderboard);
