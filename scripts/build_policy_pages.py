"""Build the static policy pages. Pass the verified public contact email as argv[1]."""
from pathlib import Path
import html
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
EMAIL = sys.argv[1] if len(sys.argv) > 1 else ""
if not re.fullmatch(r"[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+", EMAIL):
    raise SystemExit("Provide a valid public contact email.")
EMAIL = html.escape(EMAIL, quote=True)
CONTACT = f'<a href="mailto:{EMAIL}">{EMAIL}</a>'
DATE = "September 16, 2026"

PAGES = {
"privacy-policy": ("Privacy policy", f"""
<p class="policy-summary">This policy covers Tristan Merson’s personal website, accounts, shop catalog, games, and photo gallery.</p>
<h2>Who operates this site</h2><p>Tristan Merson operates tristans-website.com. For privacy questions and requests, contact {CONTACT} or visit <a href="/privacy-requests/">Privacy requests</a>.</p>
<h2>What information is used</h2><ul>
<li><strong>Visiting:</strong> the hosting and infrastructure providers receive technical request information, such as your IP address, browser information, and requested URLs, to deliver and protect the site.</li>
<li><strong>Accounts:</strong> Supabase processes your email, authentication credentials, account identifier, and sign-in information. A nickname is optional. Account creation records the version and time of your terms acceptance and your age eligibility declaration. Do not use a real name if you prefer an alias.</li>
<li><strong>Profile:</strong> an optional display name, bio, and image URL are stored with your account. Avoid adding sensitive or medical information. Previewing a remotely hosted image sends a request to that image’s host.</li>
<li><strong>Games:</strong> game progress is saved in this browser. Signed-in dice scores are stored with your account for your private score history. Guests can separately choose to publish a nickname and score to the public leaderboard. Public entries can be seen and copied by other visitors.</li>
<li><strong>Shop:</strong> product selections and quantities are saved in this browser’s cart. There is no checkout, payment collection, shipping-address collection, or order placement on this site.</li>
<li><strong>Contact:</strong> if you email Tristan, your address, message, and any information you send are used to handle your request. The privacy-request helper only prepares an email draft; it does not submit a request by itself.</li></ul>
<h2>Why this information is used</h2><p>Information supports the features you request, account access, saved game records, public scores you choose to share, responses to inquiries, and site security. Required account information is separate from optional profile fields. Creating an account does not subscribe you to marketing.</p>
<h2>Providers and public content</h2><p>GitHub Pages hosts the website. Supabase provides account, profile, catalog, and game databases; the public leaderboard uses a separate Supabase project. Product and profile images can be served by external image hosts, which receive the technical request information needed to load them. The Supabase browser library is served from this website.</p><p>Provider information: <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub privacy statement</a> and <a href="https://supabase.com/privacy">Supabase privacy policy</a>. Providers may process data in countries other than yours. Public gallery photos and public leaderboard entries are visible without an account.</p>
<h2>Cookies, browser storage, and tracking</h2><p>This site does not include advertising trackers or visitor-analytics scripts. It uses browser storage for sign-in sessions, the local cart, game progress, and remembering a dismissed storage notice. See the <a href="/cookie-policy/">cookie and storage policy</a> for details and controls.</p>
<h2>Retention and security</h2><p>Account and game records are retained while used for these features, until removed through a verified request or site maintenance, subject to any records that must be retained for legal or security reasons. There is no automatic account-expiration schedule. Hosting logs and backups follow the relevant providers’ retention practices. Browser data remains until you clear it, sign out where applicable, or the browser removes it.</p><p>Access controls are used to limit account-data access. No online service can guarantee absolute security. Please do not send passwords, government identification, payment-card details, or medical records with a request.</p>
<h2>Your choices and requests</h2><p>You can edit optional profile fields, sign out, clear local browser data, or request access, correction, or deletion. Email from the address associated with your account when possible. For a public score, identify the nickname and approximate submission date; additional verification may be needed because public entries are not linked to an account. Deleting browser storage does not delete server records.</p><p>Depending on your location, you may have additional rights, including objection, restriction, portability, or a complaint to a privacy regulator. Requests are reviewed according to applicable law. If a record must be retained or a request cannot be verified, Tristan will explain the issue in the response.</p>
<h2>Children</h2><p>Accounts and public score submissions are for people age 13 or older. Please do not create an account or submit personal information if you are under 13. The site does not offer a parental-consent process. If you believe a child’s personal information has been submitted, contact {CONTACT} to request review and removal.</p>
<h2>Changes to this policy</h2><p>Changes to this policy will be posted here with an updated date.</p>
"""),
"terms-and-conditions": ("Terms of use", f"""
<p class="policy-summary">These terms describe use of Tristan Merson’s personal website and its current tools.</p>
<h2>The site and its tools</h2><p>The site includes personal information, a travel gallery, creative and game tools, optional accounts, and a shop catalog. Tools are provided for personal use and entertainment. Availability and functionality can change.</p><p>The site is not a healthcare service. Personal references to nursing do not create a clinician–patient relationship. Do not use the site or its contact inbox for medical advice or emergency care.</p>
<h2>Accounts and eligibility</h2><p>You must be at least 13 to create an account or submit a public score. Keep your sign-in details secure, provide an email you control, and use only your own account. You can use an alias and leave optional profile fields blank. If you are not old enough to enter an agreement where you live, involve a parent or guardian before using account features.</p>
<h2>Acceptable use</h2><p>Do not use the site for unlawful activity, impersonation, harassment, spam, unauthorized access, or interference with other users or the site. Do not submit someone else’s private information or content you do not have permission to share. Access may be restricted for misuse.</p>
<h2>Public and private game scores</h2><p>Guest leaderboard submissions are public when you choose to publish them. Account score history is private to the account in the site interface. The game is an experiment; leaderboard scores are not verified competition results and have no cash value or prizes. Do not put contact details or other personal information in a public nickname.</p>
<h2>Catalog, prices, and refunds</h2><p>The shop is a catalog preview. Saving items to the local cart does not place an order, reserve inventory, or authorize a charge. Displayed numeric prices are in US dollars. No payment, shipping charge, tax, subscription, or other fee is collected through this site. See the <a href="/refund-policy/">refund and purchasing policy</a>.</p>
<h2>Content and third-party materials</h2><p>Respect applicable copyrights and other rights. Third-party names and materials remain subject to their owners’ rights; their appearance does not imply endorsement or a license to reuse them. You retain your rights in material you submit and authorize the processing and display needed for the feature you select, including public display of a score you choose to publish. See <a href="/credits/">credits and content information</a>.</p>
<h2>Availability and responsibility</h2><p>Experimental tools may contain errors, lose progress, or be unavailable. Use your own judgment and keep any important information elsewhere. Nothing in these terms excludes rights, remedies, or responsibilities that applicable law does not allow to be excluded.</p>
<h2>Privacy, account closure, and contact</h2><p>The <a href="/privacy-policy/">privacy policy</a> explains how information is handled. You can ask to close an account or remove information through <a href="/privacy-requests/">Privacy requests</a>. Contact the operator, Tristan Merson, at {CONTACT}.</p>
<h2>Updates</h2><p>Revised terms will be posted here with an updated date. New paid services, if offered later, will need their own clearly stated purchasing terms before an order is accepted.</p>
"""),
"refund-policy": ("Refund and purchasing policy", f"""
<p class="policy-summary">The shop is currently a catalog only. This website does not accept orders or payments.</p>
<h2>Cart and prices</h2><p>Adding an item to your cart saves a selection in this browser. It does not create an order, reserve a product, or charge you. Numeric catalog prices are shown in US dollars and are preview information, not a final checkout total. No recurring billing or paid subscription is offered.</p>
<h2>Refunds and unexpected charges</h2><p>There are no website purchase payments to refund. If you see a charge you believe relates to this site, contact {CONTACT} with the date and a brief description so it can be investigated. Do not email card numbers or banking passwords. A transaction made through a separate seller or platform must be handled through that seller’s process and applicable consumer rights.</p>
<h2>Before any future sales</h2><p>If purchasing is introduced, the applicable seller details, complete costs, delivery information, cancellation and return conditions, and refund process must be displayed before you commit to an order. This page does not waive any consumer rights provided by law.</p>
"""),
"cookie-policy": ("Cookies and browser storage", """
<p class="policy-summary">No advertising or analytics cookies are added by this site. Browser storage supports features you choose to use. There are no optional tracking categories to accept.</p>
<h2>What is stored</h2><ul>
<li><strong>Sign-in session:</strong> Supabase stores authentication tokens under <code>sb-azuixkurdzbvgsnuotkr-auth-token</code> and related keys, so you can stay signed in. Signing out removes the local session. A token from the previous leaderboard project may also exist in older browsers.</li>
<li><strong>Local cart:</strong> <code>tristan-merson-storefront-cart-v1</code> holds product identifiers, names, prices, and quantities after you change your cart. It is not an order.</li>
<li><strong>Game progress:</strong> <code>diceGameProgression</code> holds dice-game progression in this browser.</li>
<li><strong>Storage notice:</strong> <code>tristan-storage-notice-v1</code> records when you dismiss the notice. The notice is shown again after 180 days. This records dismissal, not consent to tracking.</li></ul>
<p>Cart and game storage have no automatic expiration. Sign-in data can remain until sign-out or browser clearing, subject to authentication expiry. Your browser may remove stored data sooner. GitHub and Supabase also receive technical requests to host and protect their services; that processing is separate from browser storage.</p>
<h2>Your controls</h2><p>You can browse without an account, sign out, reset game progress in the game, remove cart items, or clear saved site data below. Your browser’s privacy settings also control local storage and cookies. Blocking storage may prevent sign-in persistence and saved progress.</p>
<form id="clear-browser-data-form">
<label><input type="checkbox" required><span>I understand this removes saved sign-in details, the cart, and dice-game progress from this browser. It does not delete my account or server records.</span></label>
<button type="submit">Clear this browser’s saved site data</button>
<p id="clear-browser-data-status" role="status"></p></form>
<p>For account or server-data deletion, use <a href="/privacy-requests/">Privacy requests</a>. Close other tabs for this site before clearing data so they do not save old state again.</p>
<h2>Changes to tracking</h2><p>If optional tracking is added later, this notice and the controls must be updated before it is enabled. Dismissing today’s notice does not authorize future tracking.</p>
"""),
"privacy-requests": ("Privacy and deletion requests", f"""
<p class="policy-summary">To request access, correction, or deletion of your information, email {CONTACT}. You do not need to sign in to make a request.</p>
<h2>What to include</h2><p>Describe the request and, if possible, write from the email address associated with your account. For public leaderboard entries, give the nickname, approximate date, and score. For a gallery photo, include its page or description. Do not send a password, identification document, financial information, or medical records.</p>
<p>Tristan may ask for proportionate information to verify that the records relate to you. Some records may need to be retained for legal or security reasons; if that affects your request, the response will explain it. Public copies made by other people may be outside the site operator’s control.</p>
<h2>Prepare an email</h2><p>This optional helper prepares a draft on your device. You must send it through your email app. No request is submitted or stored by this form.</p>
<form id="privacy-request-form" data-contact="{EMAIL}">
<label for="request-type">Request type<select id="request-type"><option>Delete my account and related personal data</option><option>Delete a public leaderboard entry</option><option>Access a copy of my data</option><option>Correct my information</option><option>Remove a photo involving me</option><option>Other privacy request</option></select></label>
<label for="request-reference">Relevant nickname or page (optional)<input id="request-reference" maxlength="250" autocomplete="off"></label>
<button type="submit">Prepare email draft</button>
<p id="privacy-request-status" role="status"></p><a id="privacy-email-draft" href="mailto:{EMAIL}" hidden>Open draft in email app</a>
</form>
<noscript><p>Email {CONTACT} directly with the request you want to make.</p></noscript>
<h2>Browser data is separate</h2><p><a href="/cookie-policy/">Clear this browser’s stored data</a> to remove saved sign-in details, cart, and game progress. This does not submit a deletion request or remove the account and server records.</p>
"""),
"contact": ("Contact and site details", f"""
<p class="policy-summary">This personal website is operated by Tristan Merson.</p>
<p><strong>Website:</strong> tristans-website.com<br><strong>Contact:</strong> {CONTACT}</p>
<h2>Get in touch</h2><p>Use the email above for site questions, accessibility problems, content permissions, and catalog questions. The shop currently accepts no orders or payments.</p>
<p>For access, correction, or deletion of personal information, see <a href="/privacy-requests/">Privacy requests</a>. Please avoid sending sensitive information.</p>
<h2>Messages and subscriptions</h2><p>The site has no newsletter or marketing-email sign-up. Account confirmation and password-reset emails support actions you request; creating an account is not marketing consent. See <a href="/communications/">email preferences</a> for help with unwanted messages.</p>
<h2>Healthcare questions</h2><p>This is a personal and creative-project website, not a healthcare service. This inbox is not for medical advice or emergencies.</p>
"""),
"communications": ("Email preferences", f"""
<p class="policy-summary">There is currently no newsletter or marketing mailing list on this website.</p>
<h2>Account emails</h2><p>You may receive account confirmation or password-reset emails when those actions are requested. Those messages support access to your account. They do not enroll you in marketing.</p>
<h2>Unwanted messages</h2><p>If you received a message you did not request, contact {CONTACT} with a brief description. Do not forward passwords or sign-in links. To ask to close an account, use <a href="/privacy-requests/">Privacy requests</a>.</p>
<h2>Future marketing</h2><p>If marketing email is introduced, it will need a clearly identified sender and a working unsubscribe process. No marketing permission is collected through the current account form.</p>
"""),
"accessibility": ("Accessibility", f"""
<p class="policy-summary">The site is being improved so more people can browse and use its tools with a keyboard, screen reader, or browser zoom.</p>
<h2>Features</h2><p>Pages include skip links, visible keyboard focus, labeled form fields, and policy links. Photo-viewer controls support keyboard operation. Shared styles respect a reduced-motion preference.</p>
<h2>Report a barrier</h2><p>Email {CONTACT} with the page and the task you were trying to complete. If useful, include your browser and assistive technology; do not send medical information. You can request an alternative way to access content.</p>
<h2>Ongoing review</h2><p>Accessibility work is ongoing. This statement is not a claim that every page, third-party image, document, or future catalog entry conforms to an accessibility standard. Some older creative content and documents may still need improvements.</p>
"""),
"credits": ("Credits and content information", f"""
<h2>Site and photos</h2><p>The site presents Tristan Merson’s projects and a personal Japan-trip gallery. To ask about an image, request a correction, or request removal of a photo involving you, contact {CONTACT}. Public display does not grant permission to reuse an image.</p>
<h2>Software and fonts</h2><p>The site uses the open-source Supabase JavaScript library under its MIT license. The pinned version, notices, and source information are included in the <a href="https://github.com/tristantheguy/website/tree/main/assets/vendor">website repository</a>. Text uses fonts installed on your device; the site does not download web fonts.</p>
<h2>Creative references</h2><p>The existing magical-effects collection and its accompanying document credit <em>The Net Libram of Random Magical Effects</em>, version 1.20, by Orrex. Character and game references belong to their respective rights holders. Attribution is not a grant of permission or a statement of endorsement.</p>
<p>If you own rights in material on this site and want to discuss its use or removal, email the contact above with enough detail to identify the material.</p>
"""),
}

for slug, (title, body) in PAGES.items():
    destination = ROOT / slug / "index.html"
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(f'''<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="{html.escape(title)} for Tristan Merson’s personal website.">
<meta name="referrer" content="no-referrer">
<title>{title} | Tristan Merson</title>
<link rel="canonical" href="https://tristans-website.com/{slug}/">
<link rel="stylesheet" href="/site-ui.css"><script src="/site-ui.js" defer></script>
</head><body class="policy-body">
<header class="policy-header"><a href="/">Tristan Merson</a><nav aria-label="Primary"><a href="/shop.html">Shop</a> · <a href="/account.html">Account</a> · <a href="/contact/">Contact</a></nav></header>
<main id="main-content" class="policy-main" tabindex="-1"><h1>{title}</h1><p class="policy-date">Last updated: {DATE}</p>{body}</main>
</body></html>
''', encoding="utf-8")

for slug in ["privacy-policy", "terms-and-conditions"]:
    (ROOT / (slug + ".html")).write_text(f'''<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=/{slug}/"><link rel="canonical" href="https://tristans-website.com/{slug}/"><title>Policy page moved</title></head><body><main><h1>Policy page moved</h1><p><a href="/{slug}/">Read the current {PAGES[slug][0].lower()}</a>.</p></main></body></html>''', encoding="utf-8")
    (ROOT / (slug + ".md")).write_text(f'# {PAGES[slug][0]}\n\nThe current policy is maintained at [{slug}/index.html]({slug}/index.html) and published at https://tristans-website.com/{slug}/.\n', encoding="utf-8")

(ROOT / "sms-opt-in.html").write_text('<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=/"><link rel="canonical" href="https://tristans-website.com/"><title>Tristan Merson</title></head><body><main><h1>Tristan Merson</h1><p><a href="/">Visit the homepage</a>.</p></main></body></html>', encoding="utf-8")
print(f"Built {len(PAGES)} policy pages and retired legacy policy/SMS pages.")
