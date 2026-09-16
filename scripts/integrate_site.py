"""Apply shared static navigation/accessibility; safe to rerun after policy generation."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FOOTER = '''<footer class="site-policy-footer">
<p>Tristan Merson · Personal projects, games, and a catalog preview.</p>
<nav aria-label="Site information">
<a href="/">Home</a><a href="/contact/">Contact</a><a href="/privacy-policy/">Privacy</a><a href="/terms-and-conditions/">Terms</a><a href="/refund-policy/">Refunds &amp; purchases</a><a href="/cookie-policy/">Cookies &amp; storage settings</a><a href="/privacy-requests/">Request data deletion</a><a href="/communications/">Email preferences</a><a href="/accessibility/">Accessibility</a><a href="/credits/">Credits</a>
</nav></footer>'''
NOTICE = '''<section id="site-storage-notice" class="site-storage-notice" aria-label="Cookies and browser storage" hidden>
<p><strong>Your browser data.</strong> This site uses storage for sign-in, cart selections, and game progress. It has no advertising or analytics trackers. There are no optional tracking cookies to accept.</p>
<button id="storage-notice-dismiss" type="button">Dismiss notice</button><a href="/cookie-policy/">Storage details and controls</a>
</section>'''

for file in ROOT.rglob("*.html"):
    if ".git" in file.parts or "assets" in file.parts:
        continue
    text = file.read_text(encoding="utf-8")
    if 'http-equiv="refresh"' in text:
        continue
    # The former hosting-provider setup document was never part of the site UI.
    if file.name == "README.html":
        continue
    text = re.sub(r'<a\b[^>]*href="(?:/)?sms-opt-in.html"[^>]*>.*?</a>\s*', '', text, flags=re.S)
    text = text.replace('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', '/assets/vendor/supabase-2.116.0.js')
    if '<meta charset=' not in text.lower():
        text = text.replace('<head>', '<head>\n<meta charset="UTF-8">', 1)
    if 'name="referrer"' not in text:
        text = text.replace('</head>', '<meta name="referrer" content="no-referrer">\n</head>', 1)
    if '/site-ui.css' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="/site-ui.css">\n</head>', 1)
    if '/site-ui.js' not in text:
        text = text.replace('</head>', '<script src="/site-ui.js" defer></script>\n</head>', 1)
    if '<main' not in text:
        # Legacy tools have no main landmark; keep scripts functional inside it.
        text = re.sub(r'(<body\b[^>]*>)', r'\1\n<main id="main-content" tabindex="-1">', text, count=1)
        text = text.replace('</body>', '</main>\n</body>')
    main = re.search(r'<main\b([^>]*)>', text)
    attrs = main.group(1)
    match_id = re.search(r'\bid="([^"]+)"', attrs)
    main_id = match_id.group(1) if match_id else 'main-content'
    if not match_id:
        attrs += ' id="main-content"'
    if 'tabindex=' not in attrs:
        attrs += ' tabindex="-1"'
    text = text[:main.start()] + '<main' + attrs + '>' + text[main.end():]
    if 'class="skip-link"' not in text and 'class="site-skip-link"' not in text:
        text = re.sub(r'(<body\b[^>]*>)', r'\1\n<a class="site-skip-link" href="#' + main_id + '">Skip to main content</a>', text, count=1)
    text = re.sub(r'<footer\b[^>]*>.*?</footer>', '', text, flags=re.S)
    text = re.sub(r'<section id="site-storage-notice".*?</section>', '', text, flags=re.S)
    text = text.replace('</body>', FOOTER + '\n' + NOTICE + '\n</body>')
    text = '\n'.join(line.rstrip() for line in text.splitlines()) + '\n'
    file.write_text(text, encoding="utf-8", newline="\n")
print('Integrated shared footer, storage notice, skip links, referrer policy, and pinned SDK.')
