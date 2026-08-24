(function () {
  "use strict";

  const SUPABASE_URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";

  if (!window.supabase || !document.getElementById("site-auth-link")) return;

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  window.siteSupabaseClient = client;

  function render(user) {
    const link = document.getElementById("site-auth-link");
    if (!link) return;
    link.textContent = user ? "Profile" : "Log in";
    link.href = link.getAttribute("href") || "account.html";
    link.setAttribute("aria-label", user ? "Open your profile" : "Log in to your account");
  }

  client.auth.getSession().then(({ data }) => render(data.session?.user || null));
  client.auth.onAuthStateChange((_event, session) => render(session?.user || null));
})();
