(function () {
  "use strict";
  const NOTICE_KEY = "tristan-storage-notice-v1";
  const NOTICE_LIFETIME = 180 * 24 * 60 * 60 * 1000;
  const STORAGE_KEYS = [NOTICE_KEY, "tristan-merson-storefront-cart-v1", "diceGameProgression"];
  const AUTH_PREFIXES = ["sb-azuixkurdzbvgsnuotkr-auth-token", "sb-ykfrfjtjfzthumypaxqi-auth-token"];

  function showNotice() {
    let dismissed = false;
    try {
      const timestamp = Number(localStorage.getItem(NOTICE_KEY));
      dismissed = timestamp > 0 && timestamp <= Date.now() && Date.now() - timestamp < NOTICE_LIFETIME;
    } catch (_) { /* The notice still works with storage blocked. */ }
    const notice = document.getElementById("site-storage-notice");
    if (!notice) return;
    notice.hidden = dismissed;
    document.getElementById("storage-notice-dismiss")?.addEventListener("click", () => {
      try { localStorage.setItem(NOTICE_KEY, String(Date.now())); } catch (_) { /* Dismiss for this page only. */ }
      notice.hidden = true;
      document.querySelector("main")?.focus({ preventScroll: true });
    });
    if (location.hash === "storage-notice") notice.hidden = false;
  }

  const requestForm = document.getElementById("privacy-request-form");
  requestForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const type = document.getElementById("request-type").value;
    const reference = document.getElementById("request-reference").value.trim();
    const body = `Hello Tristan,\n\nI would like to request: ${type}.\n${reference ? `Relevant account / leaderboard nickname / page: ${reference}\n` : ""}\nPlease reply with any steps needed to verify and process my request.\n`;
    const address = requestForm.dataset.contact;
    const emailLink = document.getElementById("privacy-email-draft");
    emailLink.href = `mailto:${address}?subject=${encodeURIComponent(`Website privacy request: ${type}`)}&body=${encodeURIComponent(body)}`;
    emailLink.hidden = false;
    document.getElementById("privacy-request-status").textContent = "Your draft is ready. Open it in your email app and send it, or email the address above. Nothing has been sent from this page.";
    emailLink.focus();
  });

  const clearForm = document.getElementById("clear-browser-data-form");
  clearForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!clearForm.reportValidity()) return;
    let failed = false;
    for (const storageName of ["localStorage", "sessionStorage"]) {
      try {
        const storage = window[storageName];
        Object.keys(storage).forEach((key) => {
          if (STORAGE_KEYS.includes(key) || AUTH_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix + "-"))) storage.removeItem(key);
        });
      } catch (_) { failed = true; }
    }
    document.getElementById("clear-browser-data-status").textContent = failed
      ? "Your browser blocked access to some storage. Use its site-data settings to finish clearing data. This does not delete server records."
      : "Saved sign-in details, cart, game progress, and notice preference were removed from this browser. Close other tabs for this site and reload them. Your account and server records have not been deleted.";
    clearForm.reset();
    const notice = document.getElementById("site-storage-notice");
    if (notice) notice.hidden = false;
  });
  showNotice();
})();
