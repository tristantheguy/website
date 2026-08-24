(function () {
  "use strict";

  const URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";
  const client = window.supabase.createClient(URL, KEY);
  const $ = (id) => document.getElementById(id);

  function priceText(product) {
    if (product.price_label) return product.price_label;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
      .format((product.price_cents || 0) / 100);
  }

  function imageUrls(product) {
    const urls = Array.isArray(product.image_urls) ? product.image_urls : [];
    return [...new Set([product.image_url, ...urls].filter((url) => typeof url === "string" && url.trim()))];
  }

  function showImage(url, alt) {
    const image = document.createElement("img");
    image.src = url;
    image.alt = alt;
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => image.remove());
    $("gallery-main").replaceChildren(image);
  }

  function renderGallery(product) {
    const urls = imageUrls(product);
    const main = $("gallery-main");
    const thumbs = $("gallery-thumbs");
    thumbs.replaceChildren();
    if (!urls.length) {
      main.textContent = (product.category || "Product").toUpperCase();
      main.classList.add("gallery-placeholder");
      return;
    }
    main.classList.remove("gallery-placeholder");
    urls.forEach((url, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-thumb";
      button.setAttribute("aria-label", `Show image ${index + 1}`);
      const image = document.createElement("img");
      image.src = url;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      button.append(image);
      button.onclick = () => showImage(url, product.name);
      thumbs.append(button);
    });
    showImage(urls[0], product.name);
  }

  function renderSpecifics(value) {
    const list = $("product-specifics");
    const specifics = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const entries = Object.entries(specifics);
    if (!entries.length) {
      const empty = document.createElement("dd");
      empty.textContent = "No item specifics listed yet.";
      list.append(empty);
      return;
    }
    entries.forEach(([key, rawValue]) => {
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = key;
      detail.textContent = Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue ?? "");
      list.append(term, detail);
    });
  }

  async function load() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return $("product-status").textContent = "No product was selected.";

    const { data: product, error } = await client.from("products")
      .select("id,name,description,category,image_url,image_urls,item_specifics,price_cents,price_label,badge_label,art_style,featured,sort_order")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !product) {
      $("product-status").textContent = "That product is unavailable or no longer public.";
      return;
    }

    document.title = `${product.name} | Tristan Merson`;
    $("product-status").hidden = true;
    $("product-detail").hidden = false;
    $("product-category").textContent = product.category || "Collection";
    $("product-badge").textContent = product.badge_label || "Available";
    $("product-name").textContent = product.name;
    $("product-price").textContent = priceText(product);
    $("product-description").textContent = product.description || "A useful thing from the builder’s bench.";
    renderGallery(product);
    renderSpecifics(product.item_specifics);
  }

  load();
})();
