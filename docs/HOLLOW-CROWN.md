# The Hollow Crown

The player page is `dnd/hollow-crown/index.html`, served at `/dnd/hollow-crown/` (the static host can redirect the slashless directory URL). It uses native HTML, CSS, and JavaScript modules with the shared site accessibility and policy UI. No build, external assets, credentials, or backend is required. Progress is in memory for this visit; reload resets the game. No GM panel or walkthrough is included.

## Development and validation

From the repository root:

```sh
python3 -m http.server 8768 --bind 127.0.0.1
```

In another terminal:

```sh
node --test scripts/test_hollow_crown.mjs
python3 scripts/verify_hollow_crown.py
```

The browser runner requires Python Playwright and Chromium at `/usr/bin/chromium`. It checks 320, 390, 768, and 1280px viewports, touch/keyboard controls, reset/undo, blocked transfers, treasure gating and release, JavaScript errors, and horizontal overflow. Pass an optional local `axe.min.js` path for automated WCAG checks. Screenshots are written to `/tmp`, outside deployment files.

## Deployment

Commit and push the new page assets and test/documentation files to the site's existing deployment branch, then use its existing static hosting deployment. No routing or hosting settings need to change. After deployment, check `https://tristans-website.com/dnd/hollow-crown/` and verify the page and its three local CSS/JavaScript assets load. This change does not publish the website automatically.
