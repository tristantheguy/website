(function () {
  "use strict";

  const SUPABASE_URL = "https://azuixkurdzbvgsnuotkr.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NFwK2IEoUH5MrSRG5GmnRQ_dkC7w5ML";
  const VALID_ART_STYLES = ["blue", "violet", "teal", "coral"];
  const client = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;
  const byId = (id) => document.getElementById(id);

  function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function priceText(product) {
    const label = safeText(product?.price_label);
    if (label) return label;
    const cents = Number.isFinite(product?.price_cents) && product.price_cents >= 0
      ? product.price_cents
      : 0;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
      .format(cents / 100);
  }

  function imageUrls(product) {
    const urls = Array.isArray(product?.image_urls) ? product.image_urls : [];
    return [...new Set(
      [product?.image_url, ...urls]
        .filter((url) => typeof url === "string" && url.trim())
        .map((url) => url.trim())
    )];
  }

  function applyArtStyle(element, product) {
    VALID_ART_STYLES.forEach((style) => element.classList.remove(`art-${style}`));
    const style = VALID_ART_STYLES.includes(product?.art_style) ? product.art_style : "blue";
    element.classList.add(`art-${style}`);
  }

  function showGalleryPlaceholder(product) {
    const main = byId("gallery-main");
    if (!main) return;
    const label = document.createElement("span");
    label.className = "gallery-placeholder-label";
    label.textContent = safeText(product?.category, "Product").toUpperCase();
    main.replaceChildren(label);
    main.classList.add("gallery-placeholder");
    applyArtStyle(main, product);
  }

  function setActiveThumbnail(activeButton) {
    byId("gallery-thumbs")?.querySelectorAll(".gallery-thumb").forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function showImage(url, product, index, total, button) {
    const main = byId("gallery-main");
    if (!main) return;
    const name = safeText(product?.name, "Product");
    const image = document.createElement("img");
    image.src = url;
    image.alt = `${name}, image ${index + 1} of ${total}`;
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      button?.remove();
      const next = byId("gallery-thumbs")?.querySelector(".gallery-thumb");
      if (next) next.click();
      else showGalleryPlaceholder(product);
    }, { once: true });
    main.classList.remove("gallery-placeholder");
    applyArtStyle(main, product);
    main.replaceChildren(image);
    setActiveThumbnail(button);
  }

  function renderGallery(product) {
    const urls = imageUrls(product);
    const thumbs = byId("gallery-thumbs");
    if (!thumbs) return;
    thumbs.replaceChildren();
    if (!urls.length) {
      showGalleryPlaceholder(product);
      return;
    }

    const buttons = urls.map((url, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-thumb";
      button.setAttribute("aria-label", `View image ${index + 1} of ${safeText(product?.name, "product")}`);
      button.setAttribute("aria-pressed", "false");

      const image = document.createElement("img");
      image.src = url;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        const wasActive = button.classList.contains("is-active");
        button.remove();
        if (wasActive) {
          const next = thumbs.querySelector(".gallery-thumb");
          if (next) next.click();
          else showGalleryPlaceholder(product);
        }
      }, { once: true });
      button.append(image);
      button.addEventListener("click", () => showImage(url, product, index, urls.length, button));
      thumbs.append(button);
      return button;
    });

    showImage(urls[0], product, 0, urls.length, buttons[0]);
  }

  function specificValue(value) {
    if (Array.isArray(value)) return value.map((item) => specificValue(item)).filter(Boolean).join(", ");
    if (value && typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (_error) {
        return "";
      }
    }
    return String(value ?? "");
  }

  function renderSpecifics(value) {
    const list = byId("product-specifics");
    const empty = byId("specifics-empty");
    if (!list || !empty) return;
    list.replaceChildren();
    const specifics = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const entries = Object.entries(specifics);
    list.hidden = entries.length === 0;
    empty.hidden = entries.length > 0;
    entries.forEach(([key, rawValue]) => {
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = key;
      detail.textContent = specificValue(rawValue);
      list.append(term, detail);
    });
  }

  function showError(message) {
    const status = byId("product-status");
    if (status) {
      status.textContent = message;
      status.dataset.state = "error";
      status.hidden = false;
    }
    const loading = byId("product-loading");
    const detail = byId("product-detail");
    if (loading) loading.hidden = true;
    if (detail) detail.hidden = true;
    byId("main-content")?.setAttribute("aria-busy", "false");
  }

  function renderProduct(product) {
    const name = safeText(product?.name, "Untitled product");
    const category = safeText(product?.category, "Collection");
    const availability = safeText(product?.badge_label, "Available");
    const description = safeText(product?.description, "A useful thing from the builder’s bench.");
    const categoryUrl = `shop.html?category=${encodeURIComponent(category)}#catalog`;

    document.title = `${name} | Tristan Merson`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.content = description;

    const categoryLink = byId("product-category");
    if (categoryLink) {
      categoryLink.textContent = category;
      categoryLink.href = categoryUrl;
    }
    const breadcrumbCategory = byId("breadcrumb-category");
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = category;
      breadcrumbCategory.href = categoryUrl;
    }
    const breadcrumbCategoryItem = byId("breadcrumb-category-item");
    if (breadcrumbCategoryItem) breadcrumbCategoryItem.hidden = false;
    const breadcrumbProduct = byId("breadcrumb-product");
    if (breadcrumbProduct) breadcrumbProduct.textContent = name;

    byId("product-name").textContent = name;
    byId("product-badge").textContent = availability;
    byId("purchase-availability").textContent = availability;
    byId("product-price").textContent = priceText(product);
    byId("product-description").textContent = description;

    renderGallery(product);
    renderSpecifics(product?.item_specifics);

    byId("product-status").hidden = true;
    byId("product-loading").hidden = true;
    byId("product-detail").hidden = false;
    byId("main-content").setAttribute("aria-busy", "false");
  }

  async function load() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      showError("No product was selected. Return to the shop to choose a product.");
      return;
    }
    if (!client) {
      showError("Product details could not load because the catalog service is unavailable.");
      return;
    }

    try {
      const { data: product, error } = await client.from("products")
        .select("id,name,description,category,image_url,image_urls,item_specifics,price_cents,price_label,badge_label,art_style,featured,sort_order")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !product) {
        showError("That product is unavailable or no longer public.");
        return;
      }
      renderProduct(product);
    } catch (_error) {
      showError("Product details could not load. Check your connection and try again.");
    }
  }

  load();
})();
