/* Publishable keys are public; Supabase RLS remains the write-security boundary. */
(function () {
  "use strict";
  const URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";
  const ADMIN_EMAIL = "mersontristan@gmail.com";
  const $ = (id) => document.getElementById(id);
  const client = window.supabase ? window.supabase.createClient(URL, KEY) : null;
  let products = [];
  let authorized = false;
  function status(id, text = "", state = "") { const el = $(id); el.textContent = text; state ? el.dataset.state = state : delete el.dataset.state; }
  const errorText = (error) => error?.message || "Something went wrong. Please try again.";
  const normalizedCategory = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  function categoryDistance(a, b) {
    const left = normalizedCategory(a), right = normalizedCategory(b);
    if (left === right) return 0;
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      let diagonal = row[0]; row[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const above = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
        diagonal = above;
      }
    }
    return row[right.length];
  }
  function updateCategoryOptions() {
    const options = $("category-options");
    if (!options) return;
    const categories = [...new Map(products.map((product) => {
      const value = String(product.category || "").trim().replace(/\s+/g, " ");
      return [normalizedCategory(value), value];
    }).filter(([key]) => key)).values()].sort((a, b) => a.localeCompare(b));
    options.replaceChildren(...categories.map((category) => { const option = document.createElement("option"); option.value = category; return option; }));
  }
  function checkCategoryWarning() {
    const field = $("product-category");
    const warning = $("category-warning");
    if (!field || !warning) return;
    const value = field.value.trim();
    const match = products.map((product) => String(product.category || "").trim().replace(/\s+/g, " ")).find((category) => category && normalizedCategory(category) !== normalizedCategory(value) && categoryDistance(category, value) <= Math.max(1, Math.floor(value.length / 5)));
    if (value && match) {
      warning.textContent = `Did you mean “${match}”? You can keep this as a new category if intentional.`;
      warning.dataset.state = "warning";
    } else {
      warning.textContent = "";
      delete warning.dataset.state;
    }
  }
  function setBusy(form, value) { [...form.elements].forEach((el) => { el.disabled = value; }); form.setAttribute("aria-busy", String(value)); }
  async function verify(user) {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return false;
    const { data, error } = await client.rpc("is_admin");
    if (error) throw error;
    return data === true;
  }
  async function requireAdmin() {
    const { data, error } = await client.auth.getUser();
    if (error || !await verify(data.user)) { authorized = false; throw new Error("Admin authorization expired. Sign in again."); }
    authorized = true;
  }
  async function showSession(session) {
    authorized = false;
    $("auth-panel").hidden = Boolean(session);
    $("admin-app").hidden = true;
    if (!session) return;
    status("auth-status", "Verifying admin access…");
    try {
      authorized = await verify(session.user);
      if (!authorized) { await client.auth.signOut(); $("auth-panel").hidden = false; status("auth-status", "This account is not on the shop admin allowlist.", "error"); return; }
      $("admin-app").hidden = false;
      $("signed-in-as").textContent = `Signed in as ${session.user.email}`;
      status("auth-status");
      await load();
    } catch (error) { $("auth-panel").hidden = false; status("auth-status", `Could not verify admin access: ${errorText(error)}`, "error"); }
  }
  const priceText = (p) => p.price_label || new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((p.price_cents || 0) / 100);
  function render() {
    const list = $("product-list"); list.replaceChildren();
    if (!products.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No products yet. Add the first one from the editor."; list.append(empty); return; }
    products.forEach((product) => {
      const row = document.createElement("article"); row.className = "product-row";
      const details = document.createElement("div"); const title = document.createElement("h3"); title.textContent = product.name;
      const meta = document.createElement("p"); meta.className = "row-meta";
      [product.category, priceText(product)].forEach((text) => { const span = document.createElement("span"); span.textContent = text; meta.append(span); });
      const visibility = document.createElement("span"); visibility.className = `visibility${product.is_active ? "" : " inactive"}`; visibility.textContent = product.is_active ? "Public" : "Hidden"; meta.append(visibility); details.append(title, meta);
      const actions = document.createElement("div"); actions.className = "row-actions";
      const editButton = document.createElement("button"); editButton.type = "button"; editButton.className = "button quiet"; editButton.textContent = "Edit"; editButton.onclick = () => edit(product);
      const deleteButton = document.createElement("button"); deleteButton.type = "button"; deleteButton.className = "button quiet danger"; deleteButton.textContent = "Delete"; deleteButton.onclick = () => remove(product);
      actions.append(editButton, deleteButton); row.append(details, actions); list.append(row);
    });
  }
  async function load() {
    if (!authorized) return;
    status("catalog-status", "Loading products…"); $("refresh-button").disabled = true;
    try {
      const { data, error } = await client.rpc("admin_list_products");
      if (error) throw error; products = data || []; updateCategoryOptions(); checkCategoryWarning(); render(); status("catalog-status", `${products.length} product${products.length === 1 ? "" : "s"} loaded.`, "success");
    } catch (error) { status("catalog-status", `Could not load products: ${errorText(error)}`, "error"); }
    finally { $("refresh-button").disabled = false; }
  }
  function reset() { $("product-form").reset(); $("product-id").value = ""; $("product-sort-order").value = "0"; $("editor-title").textContent = "Add a product"; $("save-product-button").textContent = "Add product"; $("cancel-edit-button").hidden = true; checkCategoryWarning(); }
  function edit(p) {
    const values = { "product-id": p.id, "product-name": p.name, "product-description": p.description, "product-category": p.category, "product-price": ((p.price_cents || 0) / 100).toFixed(2), "product-price-label": p.price_label, "product-badge-label": p.badge_label, "product-art-style": p.art_style || "blue", "product-sort-order": p.sort_order, "product-image-url": p.image_url, "product-image-urls": Array.isArray(p.image_urls) ? p.image_urls.join("\n") : "", "product-item-specifics": JSON.stringify(p.item_specifics || {}, null, 2), "product-cost": p.cost_cents == null ? "" : (p.cost_cents / 100).toFixed(2) };
    Object.entries(values).forEach(([id, value]) => { $(id).value = value ?? ""; });
    $("product-featured").checked = Boolean(p.featured); $("product-is-active").checked = Boolean(p.is_active); $("editor-title").textContent = "Edit product"; $("save-product-button").textContent = "Save changes"; $("cancel-edit-button").hidden = false; $("product-name").focus();
  }
  function payload() {
    let itemSpecifics = {};
    try { itemSpecifics = JSON.parse($("product-item-specifics").value.trim() || "{}"); } catch (error) { throw new Error("Item specifics must be valid JSON."); }
    if (!itemSpecifics || Array.isArray(itemSpecifics) || typeof itemSpecifics !== "object") throw new Error("Item specifics must be a JSON object.");
    const imageUrls = $("product-image-urls").value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    return { name: $("product-name").value.trim(), description: $("product-description").value.trim() || null, category: $("product-category").value.trim(), price_cents: Math.round(Number($("product-price").value || 0) * 100), cost_cents: $("product-cost").value === "" ? null : Math.round(Number($("product-cost").value) * 100), price_label: $("product-price-label").value.trim() || null, badge_label: $("product-badge-label").value.trim() || "Available", art_style: $("product-art-style").value, sort_order: Number.parseInt($("product-sort-order").value, 10) || 0, image_url: $("product-image-url").value.trim() || null, image_urls: imageUrls, item_specifics: itemSpecifics, featured: $("product-featured").checked, is_active: $("product-is-active").checked };
  }
  async function remove(product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    status("catalog-status", `Deleting ${product.name}…`);
    try { await requireAdmin(); const { error } = await client.from("products").delete().eq("id", product.id); if (error) throw error; if ($("product-id").value === product.id) reset(); await load(); }
    catch (error) { status("catalog-status", `Could not delete product: ${errorText(error)}`, "error"); }
  }
  $("login-form").onsubmit = async (event) => {
    event.preventDefault(); setBusy(event.currentTarget, true); status("auth-status", "Signing in…");
    try { const { data, error } = await client.auth.signInWithPassword({ email: $("login-email").value.trim(), password: $("login-password").value }); if (error) throw error; await showSession(data.session); }
    catch (error) { status("auth-status", `Sign in failed: ${errorText(error)}`, "error"); }
    finally { setBusy(event.currentTarget, false); }
  };
  $("product-form").onsubmit = async (event) => {
    event.preventDefault(); if (!event.currentTarget.reportValidity()) return; const id = $("product-id").value; setBusy(event.currentTarget, true); status("form-status", id ? "Saving changes…" : "Adding product…");
    try { await requireAdmin(); const query = id ? client.from("products").update(payload()).eq("id", id) : client.from("products").insert(payload()); const { error } = await query; if (error) throw error; reset(); status("form-status", id ? "Product updated." : "Product added.", "success"); await load(); }
    catch (error) { status("form-status", `Could not save product: ${errorText(error)}`, "error"); }
    finally { setBusy(event.currentTarget, false); }
  };
  $("cancel-edit-button").onclick = reset; $("refresh-button").onclick = load;
  $("product-category").addEventListener("input", checkCategoryWarning);
  $("logout-button").onclick = async () => { await client.auth.signOut(); reset(); await showSession(null); };
  if (!client) { status("auth-status", "Supabase could not load. Check your connection and refresh.", "error"); setBusy($("login-form"), true); }
  else client.auth.getSession().then(({ data, error }) => error ? status("auth-status", errorText(error), "error") : showSession(data.session));
})();
