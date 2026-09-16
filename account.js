(function () {
  "use strict";

  const SUPABASE_URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";
  const $ = (id) => document.getElementById(id);
  let signIn = false;
  let recovery = new URLSearchParams(location.search).get("flow") === "recovery"
    || new URLSearchParams(location.hash.slice(1)).get("type") === "recovery";

  function msg(text, error = false) {
    $("status").textContent = text;
    $("status").style.color = error ? "#ff9aaa" : "#a9badf";
  }

  if (!window.supabase) {
    msg("Account services could not load. Please reload the page to try again.", true);
    $("submit-button").disabled = true;
    return;
  }
  const db = window.supabase.createClient(SUPABASE_URL, KEY);
  const accountUrl = location.origin + location.pathname;

  function displayName(user, profile) {
    // An explicitly cleared nickname stays cleared; never derive a name from email.
    if (profile && typeof profile.display_name === "string") return profile.display_name || "Player";
    return (user.user_metadata && user.user_metadata.display_name) || "Player";
  }

  function safeAvatarUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && !url.username && !url.password) return url.href;
    } catch (_error) {
      // The field receives an actionable validation message below.
    }
    return null;
  }

  function clearAvatarPreview() {
    $("avatar-preview").hidden = true;
    $("avatar-preview").removeAttribute("src");
    $("avatar-preview-empty").hidden = false;
    $("avatar-preview-empty").textContent = "No preview loaded.";
  }

  function updateAvatarPreview() {
    const field = $("profile-avatar-url");
    const url = safeAvatarUrl(field.value.trim());
    field.setCustomValidity(url === null ? "Use an HTTPS image URL without a username or password, or leave this field empty." : "");
    if (!field.reportValidity()) return;
    clearAvatarPreview();
    if (!url) return;
    $("avatar-preview").hidden = false;
    $("avatar-preview-empty").hidden = true;
    $("avatar-preview").src = url;
  }

  async function loadScores(user) {
    const { data, error } = await db.from("player_dice_scores")
      .select("score,mode,created_at").eq("user_id", user.id)
      .order("score", { ascending: false }).limit(25);
    if (error) {
      $("score-message").textContent = "Your scores could not be loaded. Please try again later.";
      return;
    }
    $("score-message").textContent = data.length ? "Your highest saved scores:" : "You have not saved a dice score yet.";
    $("personal-scores").replaceChildren(...data.map((row) => {
      const item = document.createElement("li");
      const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : "";
      item.textContent = `${row.score} points · ${row.mode || "easy"} mode${date ? ` · ${date}` : ""}`;
      return item;
    }));
  }

  function renderRecovery() {
    recovery = true;
    $("title").textContent = "Choose a new password";
    $("message").textContent = "Enter and confirm a new password with at least 8 characters.";
    $("account-form").hidden = true;
    $("profile-panel").hidden = true;
    $("password-reset-form").hidden = false;
    $("switch").hidden = true;
    $("forgot").hidden = true;
    $("logout").hidden = false;
  }

  async function render(user) {
    if (!user || recovery) return;
    const { data: profileData, error } = await db.from("profiles")
      .select("display_name,bio,avatar_url,is_admin,created_at")
      .eq("id", user.id).maybeSingle();
    if (recovery) return;
    const profile = profileData || {};
    $("title").textContent = "Your profile";
    $("message").textContent = "Manage your account and saved dice-game scores here.";
    $("account-form").hidden = true;
    $("password-reset-form").hidden = true;
    $("profile-panel").hidden = false;
    $("switch").hidden = true;
    $("forgot").hidden = true;
    $("logout").hidden = false;
    $("profile-name").textContent = displayName(user, profile);
    $("profile-email").textContent = user.email || "—";
    $("profile-created").textContent = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—";
    $("admin-link").hidden = profile.is_admin !== true;
    $("profile-display-name").value = typeof profile.display_name === "string"
      ? profile.display_name : ((user.user_metadata && user.user_metadata.display_name) || "");
    $("profile-bio").value = profile.bio || "";
    $("profile-avatar-url").value = profile.avatar_url || "";
    clearAvatarPreview();
    if (error) msg("Some profile details could not be loaded. Please try again later.", true);
    await loadScores(user);
  }

  $("preview-avatar-button").onclick = updateAvatarPreview;
  $("profile-avatar-url").addEventListener("input", () => {
    $("profile-avatar-url").setCustomValidity("");
    clearAvatarPreview();
  });
  $("avatar-preview").addEventListener("error", () => {
    clearAvatarPreview();
    $("avatar-preview-empty").textContent = "That image could not be loaded.";
  });

  $("profile-form").onsubmit = async (event) => {
    event.preventDefault();
    const avatarUrl = safeAvatarUrl($("profile-avatar-url").value.trim());
    if (avatarUrl === null) {
      $("profile-avatar-url").setCustomValidity("Use an HTTPS image URL without a username or password, or leave this field empty.");
      $("profile-avatar-url").reportValidity();
      return;
    }
    try {
      const { data: sessionData } = await db.auth.getSession();
      const user = sessionData.session && sessionData.session.user;
      if (!user) return msg("Your session expired. Please sign in again.", true);
      const updates = {
        display_name: $("profile-display-name").value.trim(),
        bio: $("profile-bio").value.trim(),
        avatar_url: avatarUrl
      };
      const { error } = await db.from("profiles").update(updates).eq("id", user.id);
      if (error) return msg(`Could not save profile: ${error.message}`, true);
      $("profile-name").textContent = updates.display_name || "Player";
      msg("Profile saved.");
    } catch (_error) {
      msg("Could not save your profile. Check your connection and try again.", true);
    }
  };

  $("switch").onclick = (event) => {
    event.preventDefault();
    signIn = !signIn;
    $("title").textContent = signIn ? "Sign in" : "Create an account";
    $("message").textContent = signIn ? "Sign in to see your profile and scores." : "Create an account to save your game scores. Accounts are for people age 13 and older.";
    $("name-field").hidden = signIn;
    $("nickname-help").hidden = signIn;
    $("registration-consent").hidden = signIn;
    $("registration-consent").disabled = signIn;
    $("age-confirmation").required = !signIn;
    $("terms-consent").required = !signIn;
    $("password").autocomplete = signIn ? "current-password" : "new-password";
    $("password").minLength = signIn ? 1 : 8;
    $("submit-button").textContent = signIn ? "Sign in" : "Create account";
    $("switch").textContent = signIn ? "Need an account? Create one" : "Already have an account? Sign in";
    msg("");
  };

  $("forgot").onclick = async (event) => {
    event.preventDefault();
    const email = $("email").value.trim();
    if (!email || !$("email").reportValidity()) return msg("Enter a valid email address first.", true);
    try {
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: `${accountUrl}?flow=recovery` });
      msg(error ? error.message : "If an account uses that address, you will receive a password reset link.", !!error);
    } catch (_error) {
      msg("Could not request a password reset. Check your connection and try again.", true);
    }
  };

  $("account-form").onsubmit = async (event) => {
    event.preventDefault();
    if (!$("account-form").reportValidity()) return;
    if (!signIn && (!$("age-confirmation").checked || !$("terms-consent").checked)) {
      return msg("Confirm your age and acceptance of the terms before creating an account.", true);
    }
    const email = $("email").value.trim();
    const password = $("password").value;
    $("submit-button").disabled = true;
    try {
      const result = signIn
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({ email, password, options: {
          data: {
            display_name: $("name").value.trim(),
            terms_version: "2026-09-16",
            terms_accepted_at: new Date().toISOString(),
            age_13_or_older: true
          },
          emailRedirectTo: accountUrl
        } });
      if (result.error) return msg(result.error.message, true);
      if (result.data.session) await render(result.data.user);
      else msg("Check your email to confirm your account. If you already have an account, sign in or request a password reset.");
    } catch (_error) {
      msg("Could not connect to account services. Please try again.", true);
    } finally {
      $("submit-button").disabled = false;
    }
  };

  $("confirm-password").addEventListener("input", () => $("confirm-password").setCustomValidity(""));
  $("new-password").addEventListener("input", () => $("confirm-password").setCustomValidity(""));
  $("password-reset-form").onsubmit = async (event) => {
    event.preventDefault();
    if ($("new-password").value !== $("confirm-password").value) {
      $("confirm-password").setCustomValidity("The passwords must match.");
      $("confirm-password").reportValidity();
      return;
    }
    if (!$("password-reset-form").reportValidity()) return;
    $("reset-password-button").disabled = true;
    try {
      const { data, error } = await db.auth.updateUser({ password: $("new-password").value });
      if (error) return msg(error.message, true);
      recovery = false;
      history.replaceState(null, "", location.pathname);
      $("password-reset-form").reset();
      await render(data.user);
      msg("Your password has been updated.");
    } catch (_error) {
      msg("Your password could not be updated. Request a new reset link and try again.", true);
    } finally {
      $("reset-password-button").disabled = false;
    }
  };

  $("logout").onclick = async () => {
    const { error } = await db.auth.signOut();
    if (error) return msg("Could not log out. Please try again.", true);
    location.assign(accountUrl);
  };

  // Keep Supabase calls outside the auth callback to avoid locking its session handler.
  db.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") renderRecovery();
    else if (event === "SIGNED_IN" && session && !recovery) {
      setTimeout(() => render(session.user).catch(() => msg("Could not load your profile. Please reload to try again.", true)), 0);
    }
  });
  db.auth.getSession().then(({ data, error }) => {
    if (error) return msg("Your session could not be loaded. Please try signing in again.", true);
    const user = data.session && data.session.user;
    if (recovery && user) renderRecovery();
    else if (recovery) {
      recovery = false;
      msg("That reset link is no longer valid. Enter your email and choose Forgot password to request a new one.", true);
    } else return render(user);
  }).catch(() => msg("Could not connect to account services. Please reload to try again.", true));
})();
