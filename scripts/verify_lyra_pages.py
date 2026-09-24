"""Check the three public Lyra pages locally; block every non-local browser request."""
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse, unquote
import json
import os
import re
import sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('/lyra/', '/lyra/privacy/', '/lyra/terms/')


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        for key in ('href', 'src'):
            if key in data:
                self.urls.append(data[key])


for page in PAGES:
    source = (ROOT / page.strip('/') / 'index.html').read_text(encoding='utf-8')
    assert not re.search(r'client_secret|refresh_token|BEGIN PRIVATE KEY|/root/|100\.82\.|100\.67\.', source)
    assert 'tristan@tristans-website.com' in source
    links = Links()
    links.feed(source)
    for url in links.urls:
        parsed = urlparse(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        target = ROOT / unquote(parsed.path).lstrip('/')
        if target.is_dir():
            target = target / 'index.html'
        assert ROOT in target.resolve().parents and target.is_file(), (page, url)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
base = 'http://127.0.0.1:' + str(server.server_port)
results, errors, external = [], [], []
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel=os.environ.get('LYRA_BROWSER_CHANNEL') or None)
        context = browser.new_context(reduced_motion='reduce', service_workers='block')

        def route(request):
            if request.request.url.startswith(base + '/') and request.request.method == 'GET':
                request.continue_()
            else:
                external.append(request.request.url)
                request.abort()

        context.route('**/*', route)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width in (1280, 390):
            page.set_viewport_size({'width': width, 'height': 900})
            for url in PAGES:
                response = page.goto(base + url, wait_until='networkidle')
                assert response.status == 200
                assert page.locator('main').count() == 1
                assert page.locator('h1').count() == 1
                assert page.locator('link[rel=canonical]').get_attribute('href') == 'https://tristans-website.com' + url
                assert page.locator('nav[aria-label="Lyra information"]').count() == 1
                for link in PAGES:
                    assert page.locator(f'nav[aria-label="Lyra information"] a[href="{link}"]').count() == 1
                assert page.locator('input[type=password], iframe, form').count() == 0
                assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
                page.keyboard.press('Tab')
                assert page.locator('.site-skip-link').evaluate('(el) => el === document.activeElement')
                page.keyboard.press('Enter')
                assert page.locator('main').evaluate('(el) => el === document.activeElement')
                results.append({'page': url, 'width': width, 'passed': True})
            if len(sys.argv) > 1:
                screenshots = Path(sys.argv[1])
                screenshots.mkdir(parents=True, exist_ok=True)
                page.goto(base + '/lyra/', wait_until='networkidle')
                page.screenshot(path=str(screenshots / f'lyra-home-{width}.png'), full_page=True)
        assert not errors, errors
        assert not external, external
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)
print(json.dumps({'browser_checks': results, 'broken_local_links': 0, 'javascript_errors': errors,
                  'external_requests': external, 'secret_marker_check': 'passed'}))
