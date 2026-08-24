/* Public catalog loader and browser-local cart. No checkout or payment behavior. */
(function () {
  "use strict";

  const SUPABASE_URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";
  const NEW_PRODUCT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const VALID_ART_STYLES = new Set(["blue", "violet", "teal", "coral"]);
  const VALID_SORTS = new Set(["recommended", "price-asc", "price-desc", "newest", "name", "manual"]);
  const configured = !SUPABASE_PUBLISHABLE_KEY.startsWith("PASTE_");
  const client = configured && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

  let loadedProducts = [];
  let fallbackCards = [];
  let uiInitialized = false;
  let catalogReady = false;
  let filterDrawerOpen = false;
  let mobileFilters = null;

  const state = {
    query: "",
    category: "",
    featured: false,
    availability: "",
    minimumPrice: null,
    maximumPrice: null,
    sort: "recommended"
  };

  const byId = (id) => document.getElementById(id);
  const CART_STORAGE_KEY = "tristan-merson-storefront-cart-v1";
  const MAX_CART_QUANTITY = 99;
  const MAX_CART_ITEMS = 50;
  const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  let cartItems = [];
  let cartInitialized = false;
  let cartOpen = false;
  let cartReturnFocus = null;

  function safeCartString(value, maximumLength) {
    return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
  }

  function safePriceCents(value) {
    return Number.isSafeInteger(value) && value >= 0 && value <= 100000000 ? value : 0;
  }

  function sanitizeCartItem(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const id = safeCartString(String(value.id ?? ""), 200);
    const name = safeCartString(value.name, 160);
    const quantity = Number.isSafeInteger(value.quantity)
      ? Math.min(MAX_CART_QUANTITY, Math.max(1, value.quantity))
      : 1;
    if (!id || !name) return null;
    return { id, name, priceCents: safePriceCents(value.priceCents), quantity };
  }

  function readCart() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "null");
      const candidates = Array.isArray(parsed) ? parsed : parsed?.items;
      if (!Array.isArray(candidates)) return [];
      const uniqueItems = new Map();
      candidates.slice(0, MAX_CART_ITEMS).forEach((candidate) => {
        const item = sanitizeCartItem(candidate);
        if (!item) return;
        const existing = uniqueItems.get(item.id);
        if (existing) {
          existing.quantity = Math.min(MAX_CART_QUANTITY, existing.quantity + item.quantity);
        } else {
          uniqueItems.set(item.id, item);
        }
      });
      return [...uniqueItems.values()];
    } catch (_error) {
      return [];
    }
  }

  function writeCart() {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items: cartItems }));
    } catch (_error) {
      // Storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function cartQuantity() {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  function cartSubtotalCents() {
    return cartItems.reduce((total, item) => total + (item.priceCents * item.quantity), 0);
  }

  function announceCart(message) {
    const status = byId("storefront-cart-status");
    if (status) status.textContent = message;
  }

  function updateCartCounts() {
    const count = cartQuantity();
    document.querySelectorAll("[data-cart-open], .cart-summary").forEach((button) => {
      button.disabled = false;
      button.setAttribute("aria-label", `Cart, ${count} ${count === 1 ? "item" : "items"}`);
      const badge = button.querySelector(".cart-count");
      if (badge) badge.textContent = String(count);
    });
  }

  function makeCartButton(label, action, id, className = "cart-quantity-button") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.dataset.cartAction = action;
    button.dataset.cartId = id;
    return button;
  }

  function renderCart() {
    const list = byId("storefront-cart-items");
    if (!list) return;
    if (!cartItems.length) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "Your local cart is empty.";
      list.replaceChildren(empty);
    } else {
      const rows = cartItems.map((item) => {
        const row = document.createElement("article");
        row.className = "cart-item";

        const copy = document.createElement("div");
        copy.className = "cart-item-copy";
        const name = document.createElement("a");
        name.href = `product.html?id=${encodeURIComponent(item.id)}`;
        name.textContent = item.name;
        const price = document.createElement("span");
        price.textContent = `${moneyFormatter.format(item.priceCents / 100)} each`;
        copy.append(name, price);

        const controls = document.createElement("div");
        controls.className = "cart-item-controls";
        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", `Quantity for ${item.name}`);
        const decrease = makeCartButton("−", "decrease", item.id);
        decrease.setAttribute("aria-label", `Decrease ${item.name} quantity`);
        const quantity = document.createElement("span");
        quantity.className = "cart-item-quantity";
        quantity.textContent = String(item.quantity);
        quantity.setAttribute("aria-label", `Quantity ${item.quantity}`);
        const increase = makeCartButton("+", "increase", item.id);
        increase.setAttribute("aria-label", `Increase ${item.name} quantity`);
        increase.disabled = item.quantity >= MAX_CART_QUANTITY;
        controls.append(decrease, quantity, increase);

        const linePrice = document.createElement("strong");
        linePrice.className = "cart-item-total";
        linePrice.textContent = moneyFormatter.format((item.priceCents * item.quantity) / 100);
        const remove = makeCartButton("Remove", "remove", item.id, "cart-remove");
        remove.setAttribute("aria-label", `Remove ${item.name} from cart`);

        row.append(copy, controls, linePrice, remove);
        return row;
      });
      list.replaceChildren(...rows);
    }
    const subtotal = byId("storefront-cart-subtotal");
    if (subtotal) subtotal.textContent = moneyFormatter.format(cartSubtotalCents() / 100);
    updateCartCounts();
  }

  function closeCart(restoreFocus = true) {
    const drawer = byId("storefront-cart");
    const backdrop = byId("storefront-cart-backdrop");
    if (!drawer || !cartOpen) return;
    cartOpen = false;
    drawer.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove("cart-drawer-open");
    document.querySelectorAll("[data-cart-open], .cart-summary").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });
    if (restoreFocus && cartReturnFocus instanceof HTMLElement) cartReturnFocus.focus();
  }

  function openCart(trigger) {
    const drawer = byId("storefront-cart");
    const backdrop = byId("storefront-cart-backdrop");
    if (!drawer) return;
    cartReturnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    renderCart();
    cartOpen = true;
    drawer.hidden = false;
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add("cart-drawer-open");
    document.querySelectorAll("[data-cart-open], .cart-summary").forEach((button) => {
      button.setAttribute("aria-expanded", "true");
    });
    drawer.querySelector("[data-cart-close]")?.focus();
  }

  function changeCartItem(id, action) {
    const item = cartItems.find((candidate) => candidate.id === id);
    if (!item) return;
    if (action === "remove" || (action === "decrease" && item.quantity === 1)) {
      cartItems = cartItems.filter((candidate) => candidate.id !== id);
      announceCart(`${item.name} removed from cart.`);
    } else if (action === "decrease") {
      item.quantity -= 1;
      announceCart(`${item.name} quantity is now ${item.quantity}.`);
    } else if (action === "increase" && item.quantity < MAX_CART_QUANTITY) {
      item.quantity += 1;
      announceCart(`${item.name} quantity is now ${item.quantity}.`);
    } else {
      return;
    }
    writeCart();
    renderCart();
    window.dispatchEvent(new CustomEvent("storefrontcart:change", { detail: { count: cartQuantity() } }));
  }

  function trapCartFocus(event) {
    if (!cartOpen || event.key !== "Tab") return;
    const drawer = byId("storefront-cart");
    const focusable = [...drawer.querySelectorAll("a[href], button:not(:disabled)")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function createCartUi() {
    if (byId("storefront-cart")) return;
    const backdrop = document.createElement("button");
    backdrop.id = "storefront-cart-backdrop";
    backdrop.className = "cart-backdrop";
    backdrop.type = "button";
    backdrop.dataset.cartClose = "";
    backdrop.setAttribute("aria-label", "Close cart");
    backdrop.tabIndex = -1;
    backdrop.hidden = true;

    const drawer = document.createElement("aside");
    drawer.id = "storefront-cart";
    drawer.className = "cart-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-labelledby", "storefront-cart-title");
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="cart-drawer-header">
        <div><p class="eyebrow">Saved in this browser</p><h2 id="storefront-cart-title">Your cart</h2></div>
        <button class="cart-close" type="button" data-cart-close aria-label="Close cart">×</button>
      </div>
      <p id="storefront-cart-status" class="sr-only" role="status" aria-live="polite"></p>
      <div id="storefront-cart-items" class="cart-items"></div>
      <div class="cart-drawer-footer">
        <div class="cart-subtotal"><span>Subtotal</span><strong id="storefront-cart-subtotal">$0.00</strong></div>
        <p>Taxes and shipping are not calculated. No order or payment can be placed yet.</p>
        <button class="button cart-checkout" type="button" disabled>Checkout coming soon</button>
      </div>`;
    document.body.append(backdrop, drawer);
  }

  function initializeCart() {
    if (cartInitialized) return;
    cartInitialized = true;
    cartItems = readCart();
    createCartUi();
    updateCartCounts();

    document.querySelectorAll("[data-cart-open], .cart-summary").forEach((button) => {
      button.dataset.cartOpen = "";
      button.setAttribute("aria-controls", "storefront-cart");
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => openCart(button));
    });
    byId("storefront-cart")?.addEventListener("click", (event) => {
      const close = event.target.closest("[data-cart-close]");
      if (close) {
        closeCart();
        return;
      }
      const control = event.target.closest("[data-cart-action]");
      if (control) changeCartItem(control.dataset.cartId, control.dataset.cartAction);
    });
    byId("storefront-cart-backdrop")?.addEventListener("click", () => closeCart());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && cartOpen) closeCart();
      trapCartFocus(event);
    });
    window.addEventListener("storage", (event) => {
      if (event.key !== CART_STORAGE_KEY) return;
      cartItems = readCart();
      renderCart();
    });
  }

  function addProductToCart(product) {
    const snapshot = sanitizeCartItem({
      id: product?.id,
      name: product?.name,
      priceCents: product?.price_cents,
      quantity: 1
    });
    if (!snapshot) return false;
    const existing = cartItems.find((item) => item.id === snapshot.id);
    if (existing) {
      existing.quantity = Math.min(MAX_CART_QUANTITY, existing.quantity + 1);
    } else if (cartItems.length < MAX_CART_ITEMS) {
      cartItems.push(snapshot);
    } else {
      announceCart("The local cart is full. Remove an item before adding another.");
      openCart();
      return false;
    }
    writeCart();
    renderCart();
    announceCart(`${snapshot.name} added to cart.`);
    window.dispatchEvent(new CustomEvent("storefrontcart:change", { detail: { count: cartQuantity() } }));
    openCart(document.activeElement);
    return true;
  }

  function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function categoryText(product) {
    return safeText(product?.category, "Collection");
  }

  function availabilityText(product) {
    return safeText(product?.badge_label, "Available");
  }

  function numericPrice(product) {
    return Number.isFinite(product?.price_cents) && product.price_cents >= 0
      ? product.price_cents / 100
      : null;
  }

  function priceText(product) {
    const label = safeText(product?.price_label);
    if (label) return label;
    const price = numericPrice(product);
    if (price === null) return "Price unavailable";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
  }

  function createdTime(product) {
    const time = Date.parse(product?.created_at || "");
    return Number.isFinite(time) ? time : 0;
  }

  function isNewProduct(product) {
    const time = createdTime(product);
    const age = Date.now() - time;
    return time > 0 && age >= 0 && age <= NEW_PRODUCT_WINDOW_MS;
  }

  function manualOrder(product) {
    return Number.isFinite(product?.sort_order) ? product.sort_order : 0;
  }

  function imageUrl(product) {
    const gallery = Array.isArray(product?.image_urls) ? product.image_urls : [];
    return [product?.image_url, ...gallery]
      .find((url) => typeof url === "string" && url.trim())?.trim() || "";
  }

  function appendBadge(target, text, modifier) {
    const badge = document.createElement("span");
    badge.className = `card-badge card-badge--${modifier}`;
    badge.textContent = text;
    target.append(badge);
  }

  function productCard(product) {
    const nameText = safeText(product?.name, "Untitled product");
    const category = categoryText(product);
    const availability = availabilityText(product);
    const card = document.createElement("a");
    card.className = `product-card${product?.featured ? " featured" : ""}`;
    card.href = `product.html?id=${encodeURIComponent(product?.id ?? "")}`;
    card.setAttribute("aria-label", `View ${nameText}`);

    const artStyle = VALID_ART_STYLES.has(product?.art_style) ? product.art_style : "blue";
    const art = document.createElement("div");
    art.className = `product-art art-${artStyle}`;

    const placeholder = document.createElement("span");
    placeholder.className = "product-placeholder";
    placeholder.textContent = category.toUpperCase();
    art.append(placeholder);

    const url = imageUrl(product);
    if (url) {
      const image = document.createElement("img");
      image.alt = `${nameText} product image`;
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
      image.addEventListener("error", () => image.remove(), { once: true });
      image.src = url;
      art.append(image);
    }

    const badges = document.createElement("div");
    badges.className = "card-badges";
    if (product?.featured) appendBadge(badges, "Featured", "featured");
    if (isNewProduct(product)) appendBadge(badges, "New", "new");
    if (badges.children.length) art.append(badges);

    const info = document.createElement("div");
    info.className = "product-info";

    const labels = document.createElement("div");
    labels.className = "card-labels";
    const categoryLabel = document.createElement("span");
    categoryLabel.className = "category-label";
    categoryLabel.textContent = category;
    categoryLabel.title = category;
    const availabilityLabel = document.createElement("span");
    availabilityLabel.className = "product-badge";
    availabilityLabel.textContent = availability;
    availabilityLabel.title = availability;
    labels.append(categoryLabel, availabilityLabel);

    const name = document.createElement("h3");
    name.textContent = nameText;
    const description = document.createElement("p");
    description.textContent = safeText(product?.description, "A useful thing from the builder’s bench.");

    const footer = document.createElement("div");
    footer.className = "product-footer";
    const price = document.createElement("strong");
    price.className = "price";
    price.textContent = priceText(product);
    const action = document.createElement("span");
    action.className = "product-action";
    action.textContent = "View product";
    footer.append(price, action);

    info.append(labels, name, description, footer);
    card.append(art, info);
    return card;
  }

  function updateCount(count, label = "product") {
    const element = byId("result-count") || document.querySelector(".result-count");
    if (!element) return;
    element.textContent = `${count} ${label}${count === 1 ? "" : "s"}`;
  }

  function render(products, target = byId("product-grid") || document.querySelector(".product-grid")) {
    if (!target) return false;
    const safeProducts = Array.isArray(products) ? products : [];
    target.replaceChildren(...safeProducts.map(productCard));
    target.hidden = false;
    target.setAttribute("aria-busy", "false");
    updateCount(safeProducts.length);
    return true;
  }

  function skeletonCard() {
    const card = document.createElement("div");
    card.className = "product-card skeleton-card";
    const art = document.createElement("div");
    art.className = "skeleton-art";
    const copy = document.createElement("div");
    copy.className = "skeleton-copy";
    ["skeleton-line--short", "skeleton-line--title", "", "skeleton-line--medium"].forEach((modifier) => {
      const line = document.createElement("span");
      line.className = `skeleton-line${modifier ? ` ${modifier}` : ""}`;
      copy.append(line);
    });
    card.append(art, copy);
    return card;
  }

  function setControlsEnabled(enabled) {
    [
      "product-search",
      "category-filter",
      "featured-filter",
      "availability-filter",
      "minimum-price",
      "maximum-price",
      "sort-products"
    ].forEach((id) => {
      const control = byId(id);
      if (control) control.disabled = !enabled;
    });
    catalogReady = enabled;
    updateFilterIndicators();
  }

  function showLoading() {
    const grid = byId("product-grid");
    const skeleton = byId("catalog-skeleton");
    const empty = byId("catalog-empty");
    const error = byId("catalog-error");
    if (error) error.hidden = true;
    if (empty) empty.hidden = true;
    if (grid) {
      grid.hidden = true;
      grid.setAttribute("aria-busy", "true");
    }
    if (skeleton) {
      if (!skeleton.children.length) {
        skeleton.replaceChildren(...Array.from({ length: 8 }, skeletonCard));
      }
      skeleton.hidden = false;
    }
    setControlsEnabled(false);
    const count = byId("result-count");
    if (count) count.textContent = "Loading products…";
  }

  function showCatalogError() {
    const grid = byId("product-grid");
    const skeleton = byId("catalog-skeleton");
    const error = byId("catalog-error");
    const empty = byId("catalog-empty");
    if (skeleton) skeleton.hidden = true;
    if (empty) empty.hidden = true;
    if (error) {
      error.hidden = false;
      const description = error.querySelector("p");
      if (description) {
        description.textContent = loadedProducts.length
          ? "Previously loaded public products remain available below. Try refreshing the page in a moment."
          : "The original preview collection is still available below. Try refreshing the page in a moment.";
      }
    }
    if (!grid) return;
    if (loadedProducts.length) {
      setControlsEnabled(true);
      applyFilters();
      return;
    }
    if (!grid.children.length && fallbackCards.length) {
      grid.replaceChildren(...fallbackCards.map((card) => card.cloneNode(true)));
    }
    grid.hidden = false;
    grid.setAttribute("aria-busy", "false");
    setControlsEnabled(false);
    updateCount(grid.children.length, "preview item");
  }

  function optionValues(products, getter) {
    const values = new Map();
    products.forEach((product) => {
      const value = getter(product);
      const key = value.toLocaleLowerCase();
      if (!values.has(key)) values.set(key, value);
    });
    return [...values.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  function fillSelect(select, defaultLabel, values) {
    if (!select) return;
    select.replaceChildren(
      new Option(defaultLabel, ""),
      ...values.map((value) => new Option(value, value))
    );
  }

  function configureFilters(products) {
    fillSelect(byId("category-filter"), "All categories", optionValues(products, categoryText));
    fillSelect(byId("availability-filter"), "All availability", optionValues(products, availabilityText));
    writeStateToControls();
  }

  function parsePrice(value) {
    if (value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function readStateFromControls() {
    state.query = safeText(byId("product-search")?.value).toLocaleLowerCase();
    state.category = byId("category-filter")?.value || "";
    state.featured = Boolean(byId("featured-filter")?.checked);
    state.availability = byId("availability-filter")?.value || "";
    state.minimumPrice = parsePrice(byId("minimum-price")?.value ?? "");
    state.maximumPrice = parsePrice(byId("maximum-price")?.value ?? "");
    const sort = byId("sort-products")?.value || "recommended";
    state.sort = VALID_SORTS.has(sort) ? sort : "recommended";
  }

  function writeStateToControls() {
    const values = {
      "product-search": state.query,
      "category-filter": state.category,
      "availability-filter": state.availability,
      "minimum-price": state.minimumPrice ?? "",
      "maximum-price": state.maximumPrice ?? "",
      "sort-products": state.sort
    };
    Object.entries(values).forEach(([id, value]) => {
      const control = byId(id);
      if (control) control.value = String(value);
    });
    const featured = byId("featured-filter");
    if (featured) featured.checked = state.featured;
  }

  function priceRangeIsValid() {
    const valid = state.minimumPrice === null
      || state.maximumPrice === null
      || state.minimumPrice <= state.maximumPrice;
    const message = byId("price-filter-message");
    if (message) message.textContent = valid ? "" : "Minimum price must not exceed maximum price.";
    return valid;
  }

  function matchesFilters(product) {
    if (state.query) {
      const searchable = [product?.name, product?.description, product?.category]
        .map((value) => safeText(value).toLocaleLowerCase())
        .join(" ");
      if (!searchable.includes(state.query)) return false;
    }
    if (state.category && categoryText(product) !== state.category) return false;
    if (state.featured && !product?.featured) return false;
    if (state.availability && availabilityText(product) !== state.availability) return false;
    if (state.minimumPrice !== null || state.maximumPrice !== null) {
      const price = numericPrice(product);
      if (price === null) return false;
      if (state.minimumPrice !== null && price < state.minimumPrice) return false;
      if (state.maximumPrice !== null && price > state.maximumPrice) return false;
    }
    return true;
  }

  function compareManual(a, b) {
    return manualOrder(a) - manualOrder(b)
      || createdTime(b) - createdTime(a)
      || safeText(a?.name).localeCompare(safeText(b?.name), undefined, { sensitivity: "base" });
  }

  function comparePrice(a, b, direction) {
    const aPrice = numericPrice(a);
    const bPrice = numericPrice(b);
    if (aPrice === null && bPrice === null) return compareManual(a, b);
    if (aPrice === null) return 1;
    if (bPrice === null) return -1;
    return direction * (aPrice - bPrice) || compareManual(a, b);
  }

  function sortProducts(products) {
    const sorted = products.slice();
    sorted.sort((a, b) => {
      switch (state.sort) {
        case "price-asc": return comparePrice(a, b, 1);
        case "price-desc": return comparePrice(a, b, -1);
        case "newest": return createdTime(b) - createdTime(a) || compareManual(a, b);
        case "name": return safeText(a?.name).localeCompare(safeText(b?.name), undefined, { sensitivity: "base" }) || compareManual(a, b);
        case "manual": return compareManual(a, b);
        default:
          return Number(Boolean(b?.featured)) - Number(Boolean(a?.featured)) || compareManual(a, b);
      }
    });
    return sorted;
  }

  function activeFilterCount() {
    return [
      Boolean(state.query),
      Boolean(state.category),
      state.featured,
      Boolean(state.availability),
      state.minimumPrice !== null,
      state.maximumPrice !== null
    ].filter(Boolean).length;
  }

  function updateFilterIndicators() {
    const count = activeFilterCount();
    const badge = byId("active-filter-count");
    const clear = byId("clear-filters");
    const searchClear = byId("search-clear");
    if (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    }
    if (clear) clear.disabled = !catalogReady || count === 0;
    if (searchClear) searchClear.hidden = !state.query;
  }

  function setEmptyState(filteredCount, validPriceRange) {
    const empty = byId("catalog-empty");
    const grid = byId("product-grid");
    if (!empty || !grid) return;
    const showEmpty = filteredCount === 0;
    empty.hidden = !showEmpty;
    grid.hidden = showEmpty;
    if (!showEmpty) return;

    const title = byId("empty-title");
    const description = byId("empty-description");
    const clearButton = byId("empty-clear-filters");
    if (!loadedProducts.length) {
      if (title) title.textContent = "No products are public right now";
      if (description) description.textContent = "The collection is being prepared. Please check back soon.";
      if (clearButton) clearButton.hidden = true;
    } else if (!validPriceRange) {
      if (title) title.textContent = "That price range needs adjusting";
      if (description) description.textContent = "Set a maximum price that is equal to or greater than the minimum.";
      if (clearButton) clearButton.hidden = false;
    } else {
      if (title) title.textContent = "No products match those filters";
      if (description) description.textContent = "Try a broader search or clear your current filters.";
      if (clearButton) clearButton.hidden = false;
    }
  }

  function applyFilters() {
    if (!catalogReady) return;
    readStateFromControls();
    const validPriceRange = priceRangeIsValid();
    const visible = validPriceRange ? sortProducts(loadedProducts.filter(matchesFilters)) : [];
    const grid = byId("product-grid");
    if (grid) {
      grid.replaceChildren(...visible.map(productCard));
      grid.setAttribute("aria-busy", "false");
    }
    const skeleton = byId("catalog-skeleton");
    const error = byId("catalog-error");
    if (skeleton) skeleton.hidden = true;
    if (error && !error.hidden && loadedProducts.length) error.hidden = false;
    updateCount(visible.length);
    setEmptyState(visible.length, validPriceRange);
    updateFilterIndicators();
  }

  function clearFilters() {
    state.query = "";
    state.category = "";
    state.featured = false;
    state.availability = "";
    state.minimumPrice = null;
    state.maximumPrice = null;
    state.sort = "recommended";
    writeStateToControls();
    applyFilters();
  }

  function closeFilterDrawer(restoreFocus = true) {
    const panel = byId("filters");
    const backdrop = byId("filter-backdrop");
    const toggle = byId("filter-toggle");
    filterDrawerOpen = false;
    panel?.classList.remove("is-open");
    document.body.classList.remove("filter-drawer-open");
    if (backdrop) backdrop.hidden = true;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (mobileFilters?.matches && panel) {
      panel.setAttribute("aria-hidden", "true");
      panel.inert = true;
    }
    if (restoreFocus) toggle?.focus();
  }

  function openFilterDrawer() {
    const panel = byId("filters");
    if (!panel) return;
    if (!mobileFilters?.matches) {
      panel.scrollIntoView({ block: "start", behavior: "smooth" });
      byId("category-filter")?.focus({ preventScroll: true });
      return;
    }
    filterDrawerOpen = true;
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.classList.add("is-open");
    document.body.classList.add("filter-drawer-open");
    const backdrop = byId("filter-backdrop");
    if (backdrop) backdrop.hidden = false;
    byId("filter-toggle")?.setAttribute("aria-expanded", "true");
    byId("filter-close")?.focus();
  }

  function syncFilterDrawerMode() {
    const panel = byId("filters");
    if (!panel) return;
    if (mobileFilters?.matches) {
      if (!filterDrawerOpen) {
        panel.setAttribute("aria-hidden", "true");
        panel.inert = true;
      }
      return;
    }
    closeFilterDrawer(false);
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
  }

  function stateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.query = safeText(params.get("q")).toLocaleLowerCase();
    state.category = safeText(params.get("category"));
    state.featured = params.get("featured") === "1";
    state.availability = safeText(params.get("availability"));
    state.minimumPrice = parsePrice(params.get("min") || "");
    state.maximumPrice = parsePrice(params.get("max") || "");
    const sort = params.get("sort") || "recommended";
    state.sort = VALID_SORTS.has(sort) ? sort : "recommended";
  }

  function scrollToCatalog() {
    byId("catalog")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function initializeUi() {
    if (uiInitialized) return;
    uiInitialized = true;
    const grid = byId("product-grid");
    fallbackCards = grid ? [...grid.children].map((card) => card.cloneNode(true)) : [];
    stateFromUrl();
    writeStateToControls();

    byId("shop-search-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilters();
    });
    byId("product-search")?.addEventListener("input", applyFilters);
    byId("search-clear")?.addEventListener("click", () => {
      const search = byId("product-search");
      if (search) search.value = "";
      applyFilters();
      search?.focus();
    });
    ["category-filter", "featured-filter", "availability-filter", "sort-products"].forEach((id) => {
      byId(id)?.addEventListener("change", applyFilters);
    });
    ["minimum-price", "maximum-price"].forEach((id) => {
      byId(id)?.addEventListener("input", applyFilters);
    });
    byId("filters-form")?.addEventListener("submit", (event) => event.preventDefault());
    byId("clear-filters")?.addEventListener("click", clearFilters);
    byId("empty-clear-filters")?.addEventListener("click", clearFilters);
    byId("filter-toggle")?.addEventListener("click", openFilterDrawer);
    byId("filter-close")?.addEventListener("click", () => closeFilterDrawer());
    byId("filter-backdrop")?.addEventListener("click", () => closeFilterDrawer());

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && filterDrawerOpen) closeFilterDrawer();
    });

    document.querySelectorAll("[data-shop-action]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const action = link.dataset.shopAction;
        if (action === "categories") {
          event.preventDefault();
          openFilterDrawer();
          return;
        }
        if (!catalogReady) return;
        event.preventDefault();
        if (action === "home") clearFilters();
        if (action === "featured") {
          const featured = byId("featured-filter");
          if (featured) featured.checked = true;
          applyFilters();
        }
        if (action === "newest") {
          const sort = byId("sort-products");
          if (sort) sort.value = "newest";
          applyFilters();
        }
        scrollToCatalog();
      });
    });

    mobileFilters = window.matchMedia("(max-width: 960px)");
    if (typeof mobileFilters.addEventListener === "function") {
      mobileFilters.addEventListener("change", syncFilterDrawerMode);
    } else {
      mobileFilters.addListener(syncFilterDrawerMode);
    }
    syncFilterDrawerMode();
  }

  async function load(options = {}) {
    initializeUi();
    const defaultRender = options.render !== false && !options.target;
    if (defaultRender) showLoading();

    if (!client) {
      const reason = !window.supabase
        ? "Supabase library is unavailable."
        : "Supabase publishable key is not configured.";
      const result = { data: [], error: new Error(reason), rendered: false };
      if (defaultRender) showCatalogError();
      window.dispatchEvent(new CustomEvent("shopcatalog:error", { detail: result }));
      return result;
    }

    const result = await client.from("products")
      .select("id,name,description,category,image_url,image_urls,item_specifics,price_cents,price_label,badge_label,art_style,featured,sort_order,created_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (result.error) {
      if (defaultRender) showCatalogError();
      window.dispatchEvent(new CustomEvent("shopcatalog:error", { detail: result }));
      return { ...result, rendered: false };
    }

    loadedProducts = Array.isArray(result.data) ? result.data : [];
    let rendered = false;
    if (options.render !== false) {
      if (options.target) {
        rendered = render(loadedProducts, options.target);
      } else {
        configureFilters(loadedProducts);
        setControlsEnabled(true);
        const error = byId("catalog-error");
        if (error) error.hidden = true;
        applyFilters();
        rendered = Boolean(byId("product-grid"));
      }
    }

    const detail = { data: loadedProducts, error: null, rendered };
    window.dispatchEvent(new CustomEvent("shopcatalog:loaded", { detail }));
    return detail;
  }

  window.shopCatalog = {
    load,
    render,
    get products() {
      return loadedProducts.slice();
    }
  };

  window.storefrontCart = {
    addProduct: addProductToCart,
    open: openCart
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initializeCart();
      if (byId("product-grid")) load();
    }, { once: true });
  } else {
    initializeCart();
    if (byId("product-grid")) load();
  }
})();
