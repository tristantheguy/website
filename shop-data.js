/* Public catalog loader. Deliberately contains no cart, checkout, or payment behavior. */
(function () {
  "use strict";

  const SUPABASE_URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";
  const configured = !SUPABASE_PUBLISHABLE_KEY.startsWith("PASTE_");
  const client = configured && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;
  let loadedProducts = [];

  function priceText(product) {
    if (product.price_label) return product.price_label;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
      .format((product.price_cents || 0) / 100);
  }

  function updateCount(count) {
    const element = document.querySelector(".result-count");
    if (element) element.textContent = `${count} ${count === 1 ? "piece" : "pieces"}`;
  }

  function productCard(product) {
    const card = document.createElement("article");
    card.className = `product-card${product.featured ? " featured" : ""}`;

    const art = document.createElement("div");
    art.className = `product-art art-${["blue", "violet", "teal", "coral"].includes(product.art_style) ? product.art_style : "blue"}`;
    if (product.image_url) {
      const image = document.createElement("img");
      image.src = product.image_url;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.minHeight = "180px";
      image.style.objectFit = "cover";
      art.append(image);
    } else {
      const label = document.createElement("span");
      label.textContent = (product.category || "Product").toUpperCase();
      art.append(label);
    }

    const info = document.createElement("div");
    info.className = "product-info";
    const meta = document.createElement("div");
    meta.className = "product-meta";
    [product.category || "Collection", product.badge_label || "Available"].forEach((value) => {
      const span = document.createElement("span");
      span.textContent = value;
      meta.append(span);
    });
    const name = document.createElement("h3");
    name.textContent = product.name;
    const description = document.createElement("p");
    description.textContent = product.description || "A useful thing from the builder’s bench.";
    const footer = document.createElement("div");
    footer.className = "product-footer";
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = priceText(product);
    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.textContent = "●";
    dot.setAttribute("aria-hidden", "true");
    footer.append(price, dot);
    info.append(meta, name, description, footer);
    card.append(art, info);
    return card;
  }

  function render(products, target = document.querySelector(".product-grid")) {
    if (!target) return false;
    target.replaceChildren(...products.map(productCard));
    updateCount(products.length);
    return true;
  }

  function configureFilter(products) {
    const select = document.querySelector(".filter-control select");
    if (!select) return;
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    select.replaceChildren(new Option("All categories", ""), ...categories.map((value) => new Option(value, value)));
    select.onchange = () => {
      const visible = select.value ? products.filter((p) => p.category === select.value) : products;
      render(visible);
    };
  }

  async function load(options = {}) {
    if (!client) {
      const reason = !window.supabase ? "Supabase library is unavailable." : "Supabase publishable key is not configured.";
      const result = { data: [], error: new Error(reason), rendered: false };
      window.dispatchEvent(new CustomEvent("shopcatalog:error", { detail: result }));
      return result; // Preserve static fallback cards.
    }

    const result = await client.from("products")
      .select("id,name,description,category,image_url,price_cents,price_label,badge_label,art_style,featured,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (result.error) {
      window.dispatchEvent(new CustomEvent("shopcatalog:error", { detail: result }));
      return { ...result, rendered: false }; // Keep static content on network/schema errors.
    }

    loadedProducts = result.data || [];
    const rendered = options.render === false ? false : render(loadedProducts, options.target);
    if (rendered) configureFilter(loadedProducts);
    const detail = { data: loadedProducts, error: null, rendered };
    window.dispatchEvent(new CustomEvent("shopcatalog:loaded", { detail }));
    return detail;
  }

  window.shopCatalog = {
    load,
    render,
    get products() { return loadedProducts.slice(); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => load());
  else load();
})();
