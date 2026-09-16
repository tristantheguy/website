"""Read-only browser checks; Supabase is mocked so no account/score data is changed.

Serve repository on localhost:8768, install Python playwright + its Chromium,
then run python scripts/verify_site.py [optional/path/to/axe.min.js].
"""
import json
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8768"
PAGES = ["/", "/shop.html", "/product.html?id=test-product", "/account.html", "/japan-memories.html", "/dicegame/dice-game.html", "/randomNPC.html", "/10000_magical_effects.html", "/privacy-policy/", "/terms-and-conditions/", "/refund-policy/", "/cookie-policy/", "/privacy-requests/", "/contact/", "/communications/", "/accessibility/", "/credits/", "/sms-opt-in.html"]
PRODUCT = {"id":"test-product", "name":"Test catalog item", "description":"A catalog fixture", "category":"Tools", "price_cents":1250, "image_urls":[], "image_url":None, "item_specifics":{}, "badge_label":"Preview", "art_style":"blue", "featured":False, "sort_order":0, "created_at":"2026-09-01T00:00:00Z"}

def mock_backend(route):
    request = route.request
    assert request.method in ["GET", "OPTIONS"], f"Unexpected backend write: {request.method} {request.url}"
    value = ([PRODUCT] if "/rest/v1/products" in request.url else [])
    if "/rest/v1/products" in request.url and "id=eq." in request.url:
        value = PRODUCT
    route.fulfill(status=200, content_type="application/json", body=json.dumps(value))

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width":1280,"height":900}, reduced_motion="reduce")
    context.route("**/*.supabase.co/**", mock_backend)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    results = []
    for path in PAGES:
        page.goto(BASE + path)
        if path == "/sms-opt-in.html":
            page.wait_for_url(BASE + "/")
        page.wait_for_timeout(350)
        assert page.locator("main").count() == 1, path
        assert page.locator(".site-policy-footer").count() == 1, path
        assert page.locator('a[href="/privacy-requests/"]').count() > 0, path
        assert page.locator('a[href="sms-opt-in.html"]').count() == 0, path
        assert page.locator("img:not([alt])").count() == 0, path
        entry = {"page":path}
        if len(sys.argv) > 1:
            page.add_script_tag(path=sys.argv[1])
            violations = page.evaluate("async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } })).violations")
            entry["accessibility_violations"] = [{"id":v["id"], "nodes":[{"target":n["target"],"summary":n.get("failureSummary")} for n in v["nodes"]]} for v in violations]
        page.set_viewport_size({"width":390,"height":844})
        page.wait_for_timeout(100)
        entry["mobile_overflow"] = page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        if len(sys.argv) > 1:
            mobile_violations = page.evaluate("async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } })).violations")
            entry["mobile_accessibility_violations"] = [{"id":v["id"], "targets":[n["target"] for n in v["nodes"]]} for v in mobile_violations]
        page.set_viewport_size({"width":1280,"height":900})
        results.append(entry)

    page.goto(BASE + "/cookie-policy/")
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    assert page.locator("#site-storage-notice").is_visible()
    page.click("#storage-notice-dismiss")
    page.reload()
    assert page.locator("#site-storage-notice").is_hidden()
    page.evaluate("localStorage.setItem('diceGameProgression','test'); localStorage.setItem('unrelated-key','keep'); localStorage.setItem('sb-azuixkurdzbvgsnuotkr-auth-token','test'); localStorage.setItem('tristan-merson-storefront-cart-v1','test')")
    page.locator('#clear-browser-data-form input').check()
    page.locator('#clear-browser-data-form button').click()
    assert page.evaluate("localStorage.getItem('unrelated-key')") == "keep"
    assert page.evaluate("localStorage.getItem('diceGameProgression')") is None
    assert page.evaluate("localStorage.getItem('sb-azuixkurdzbvgsnuotkr-auth-token')") is None
    assert "have not been deleted" in page.locator('#clear-browser-data-status').inner_text()

    page.goto(BASE + "/privacy-requests/")
    page.fill('#request-reference', 'Example alias')
    page.locator('#privacy-request-form button').click()
    assert "Nothing has been sent" in page.locator('#privacy-request-status').inner_text()
    assert page.locator('#privacy-email-draft').get_attribute('href').startswith('mailto:')
    assert 'Example%20alias' in page.locator('#privacy-email-draft').get_attribute('href')

    page.goto(BASE + "/product.html?id=test-product")
    page.wait_for_selector('#add-to-cart:not([disabled])')
    page.click('#add-to-cart')
    assert "Checkout and payment are not available" in page.locator('#cart-feedback').inner_text()
    if page.locator('#storefront-cart').is_hidden():
        page.locator('[data-cart-open], .cart-summary').first.click()
    assert page.locator('#storefront-cart').is_visible()
    page.keyboard.press('Escape')
    assert page.locator('#storefront-cart').is_hidden()

    print(json.dumps({"pages":results,"javascript_errors":errors,"functional_checks":"passed"},indent=2))
    browser.close()
    assert not errors, errors
    assert not any(item['mobile_overflow'] for item in results), "Mobile overflow"
    assert not any(item.get('accessibility_violations') for item in results), "Automated accessibility violations"
    assert not any(item.get('mobile_accessibility_violations') for item in results), "Mobile automated accessibility violations"
