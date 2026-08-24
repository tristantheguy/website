(function () {
  "use strict";

  const URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";
  const db = window.supabase.createClient(URL, KEY);
  const $ = (id) => document.getElementById(id);
  let signIn = false;

  function msg(text, error = false) {
    $("status").textContent = text;
    $("status").style.color = error ? "#ff9aaa" : "#a9badf";
  }

  function displayName(user, profile) {
    return (profile && profile.display_name)
      || (user.user_metadata && user.user_metadata.display_name)
      || (user.email ? user.email.split("@")[0] : "Player");
  }

  function updateAvatarPreview() {
    const url = $("profile-avatar-url").value.trim();
    const image = $("avatar-preview");
    const empty = $("avatar-preview-empty");
    image.hidden = !url;
    empty.hidden = Boolean(url);
    image.src = url || "";
  }

  async function loadScores(user) {
    const { data, error } = await db
      .from("player_dice_scores")
      .select("display_name,score,mode,created_at")
      .eq("user_id", user.id)
      .order("score", { ascending: false })
      .limit(25);

    if (error) {
      $("score-message").textContent = "Your scores will appear here after the dice-score database migration is applied.";
      console.error("Could not load personal dice scores:", error);
      return;
    }

    $("score-message").textContent = data.length ? "Your latest submitted runs:" : "You have not saved a dice score yet.";
    $("personal-scores").replaceChildren(...data.map((row) => {
      const item = document.createElement("li");
      const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : "";
      item.textContent = `${row.score} points · ${row.mode || "easy"} mode${date ? ` · ${date}` : ""}`;
      return item;
    }));
  }

  async function render(user) {
    if (!user) return;

    const { data: profileData } = await db
      .from("profiles")
      .select("email,display_name,bio,avatar_url,is_admin,created_at")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileData || {};
    const name = displayName(user, profile);

    $("title").textContent = "Your profile";
    $("message").textContent = "Your account, site details, and dice-game records live here.";
    $("account-form").hidden = true;
    $("profile-panel").hidden = false;
    $("switch").hidden = true;
    $("forgot").hidden = true;
    $("logout").hidden = false;
    $("profile-name").textContent = name;
    $("profile-email").textContent = profile.email || user.email || "—";
    $("profile-created").textContent = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—";
    $("admin-link").hidden = profile.is_admin !== true;
    $("profile-display-name").value = name;
    $("profile-bio").value = profile.bio || "";
    $("profile-avatar-url").value = profile.avatar_url || "";
    updateAvatarPreview();
    await loadScores(user);
  }

  $("profile-avatar-url").addEventListener("input", updateAvatarPreview);
  $("avatar-preview").addEventListener("error", () => {
    $("avatar-preview").hidden = true;
    $("avatar-preview-empty").hidden = false;
    $("avatar-preview-empty").textContent = "That image could not be loaded.";
  });

  $("profile-form").onsubmit = async (event) => {
    event.preventDefault();
    const { data: sessionData } = await db.auth.getSession();
    const user = sessionData.session && sessionData.session.user;
    if (!user) return msg("Your session expired. Please sign in again.", true);

    const updates = {
      display_name: $("profile-display-name").value.trim(),
      bio: $("profile-bio").value.trim(),
      avatar_url: $("profile-avatar-url").value.trim()
    };
    const { error } = await db.from("profiles").update(updates).eq("id", user.id);
    if (error) return msg(`Could not save profile: ${error.message}`, true);
    $("profile-name").textContent = updates.display_name || displayName(user, updates);
    msg("Profile saved.");
  };

  $("switch").onclick = (event) => {
    event.preventDefault();
    signIn = !signIn;
    $("title").textContent = signIn ? "Sign in" : "Create an account";
    $("message").textContent = signIn ? "Sign in to see your profile and scores." : "Create an account to keep your details ready for future orders and game scores.";
    $("name-field").hidden = signIn;
    $("name").required = !signIn;
    $("password").autocomplete = signIn ? "current-password" : "new-password";
    $("submit-button").textContent = signIn ? "Sign in" : "Create account";
  };

  $("forgot").onclick = async (event) => {
    event.preventDefault();
    const email = $("email").value.trim();
    if (!email) return msg("Enter your email first.", true);
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.href });
    msg(error ? error.message : "Password reset email sent.", !!error);
  };

  $("account-form").onsubmit = async (event) => {
    event.preventDefault();
    const email = $("email").value.trim();
    const password = $("password").value;
    const result = signIn
      ? await db.auth.signInWithPassword({ email, password })
      : await db.auth.signUp({ email, password, options: { data: { display_name: $("name").value.trim() }, emailRedirectTo: location.href } });
    if (result.error) return msg(result.error.message, true);
    if (signIn) render(result.data.user);
    else msg("Check your email to confirm your account.");
  };

  $("logout").onclick = async () => {
    await db.auth.signOut();
    location.reload();
  };

  db.auth.getSession().then(({ data }) => render(data.session && data.session.user));
})();
