"""Serve the site on port 8768, then run with Python Playwright and Chromium installed."""
from collections import deque
import sys
from playwright.sync_api import sync_playwright

# Generate a path only in the test runner; no walkthrough is shipped with the page.
queue = deque([((8, 0, 0), [])])
seen = set()
while queue:
    state, path = queue.popleft()
    if state == (4, 4, 0):
        break
    if state in seen:
        continue
    seen.add(state)
    for source in range(3):
        for target in range(3):
            if source == target:
                continue
            amount = min(state[source], (8, 5, 3)[target] - state[target])
            if not amount:
                continue
            next_state = list(state)
            next_state[source] -= amount
            next_state[target] += amount
            queue.append((tuple(next_state), path + [(source, target)]))
else:
    raise AssertionError('Target is unreachable')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, height, touch, reduced in [(320, 740, True, False), (390, 844, True, True), (768, 1024, True, False), (1280, 900, False, False)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=touch, reduced_motion='reduce' if reduced else 'no-preference')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        response = page.goto('http://127.0.0.1:8768/dnd/hollow-crown')
        assert response.status == 200
        vats = page.locator('.vat-button')
        click = lambda loc: loc.tap() if touch else loc.click()
        quantities = lambda: page.locator('.quantity').all_text_contents()
        assert quantities() == ['8 / 8', '0 / 5', '0 / 3']
        assert page.locator('#lever').is_disabled()
        click(vats.nth(1))
        assert 'empty' in page.locator('#status').inner_text()
        assert page.locator('#undo').is_disabled()
        click(vats.nth(0))
        assert vats.nth(0).get_attribute('aria-pressed') == 'true'
        click(vats.nth(0))
        assert vats.nth(0).get_attribute('aria-pressed') == 'false'
        click(vats.nth(0)); click(vats.nth(1))
        assert quantities() == ['3 / 8', '5 / 5', '0 / 3']
        click(vats.nth(0)); click(vats.nth(1))
        assert page.locator('#moves').inner_text() == '1'
        click(page.locator('#undo'))
        assert quantities() == ['8 / 8', '0 / 5', '0 / 3']
        for source, destination in path:
            click(vats.nth(source)); click(vats.nth(destination))
        assert quantities() == ['4 / 8', '4 / 5', '0 / 3']
        assert page.locator('#lever').is_enabled()
        click(page.locator('#lever'))
        assert page.locator('#treasure').evaluate("el => el.classList.contains('released')")
        assert 'treasure is yours' in page.locator('#treasure-message').inner_text()
        assert page.locator('#lever').is_disabled()
        click(page.locator('#undo'))
        assert not page.locator('#treasure').evaluate("el => el.classList.contains('released')")
        assert page.locator('#lever').is_disabled()
        click(page.locator('#reset'))
        assert quantities() == ['8 / 8', '0 / 5', '0 / 3']
        assert page.locator('#moves').inner_text() == '0'
        assert page.locator('#undo').is_disabled()
        if not touch:
            vats.nth(0).focus(); page.keyboard.press('Enter')
            assert vats.nth(0).get_attribute('aria-pressed') == 'true'
            page.keyboard.press('Escape')
            assert vats.nth(0).get_attribute('aria-pressed') == 'false'
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow'
        for button in vats.all():
            box = button.bounding_box()
            assert box['width'] >= 44 and box['height'] >= 44
        assert page.locator('main').count() == 1
        assert page.locator('.site-policy-footer').count() == 1
        if len(sys.argv) > 1:
            page.add_script_tag(path=sys.argv[1])
            violations = page.evaluate("async () => (await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}})).violations")
            assert not violations, [(v['id'], [n['target'] for n in v['nodes']]) for v in violations]
        assert not errors, errors
        if width == 390:
            page.screenshot(path='/tmp/hollow-crown-mobile.png', full_page=True)
        if width == 1280:
            page.screenshot(path='/tmp/hollow-crown-desktop.png', full_page=True)
        print(f'PASS {width}px: transfers, undo, reset, gated lever, celebration, touch targets, no overflow or JS errors')
        context.close()
    browser.close()
