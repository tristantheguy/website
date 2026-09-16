# Website checklist review

Updated 2026-09-16. This records source changes and remaining operational work; it is not a legal or accessibility certification. The shop is a catalog only: no orders or payments. Nine policy/help pages replace the retired Lyra SMS material.

**Public contact:** the owner supplied and confirmed `tristan@tristans-website.com` for contact, privacy, and deletion requests. Policies were rebuilt with that address. Email delivery has not been independently tested; the draft helper does not send or submit a request.

## All 20 items

“Implemented” below means present in the reviewed code. Final automated results and live-backend verification are separate.

| # | Item | Implemented or applicable status | Remaining work |
| --- | --- | --- | --- |
| 1 | Privacy policy | Current accounts, optional profiles, private/public scores, both databases, hosting, remote images, local storage, and requests described. | Verify actual provider settings and retention. |
| 2 | Terms | Website/game/account/catalog terms replace SMS terms; legacy policy routes point to current content and the old signup route redirects home. | Owner review; no claim that old SMS records were erased. |
| 3 | Refund policy | Explains that no orders/payments are accepted and cart selections are not purchases. | Define seller, fulfillment, cancellation/return/refund terms before actual sales. |
| 4 | Cookie policy | Names authentication, local cart, dice progress, and notice-dismissal storage; separates browser clearing from server deletion. | Update before storage practices change. |
| 5 | Cookie banner | Informative storage notice, dismissal saved for 180 days, and clearing controls. No advertising/analytics scripts or fictitious optional-tracking toggles. Dismissal is explicitly not tracking consent. | Reassess requirements before adding optional tracking; implement actual gating when needed. |
| 6 | Form consents | Unchecked account age/terms declarations; version/time recorded. Guests explicitly choose public score sharing. Signed-in scores go only to private history. Labels and feedback added. | Browser checks/metadata are not trusted server enforcement. |
| 7 | Data minimization | Optional nickname/profile fields; email-prefix naming removed. No phone, address, payment, or full-birth-date collection. Avatar previews require an explicit action. | Review existing records and retention; do not add sensitive information to profiles. |
| 8 | SDK audit | Supabase 2.116.0 self-hosted under `assets/vendor`; npm SHA512 integrity verified by the implementation agent, MIT license retained. HTML CDN imports removed. Decorative image hotlinks replaced by CSS gradients; obsolete README host script removed. | Dependency and tslib license notices retained; monitor updates. Product image hosts remain external and require ongoing review. |
| 9 | Dark patterns | Explicit sharing controls, dismissible notice, clear catalog-only/cart wording, and improved dialog/focus behavior. | Review future checkout, marketing, or subscription flows. |
| 10 | Hidden fees | No charge, checkout, tax, shipping, or recurring billing collected; USD and preview status explained. | Show complete costs before any future payable commitment. |
| 11 | Fake reviews | No review/testimonial feature or fabricated customer counts found in source. | Owner must keep database descriptions and future testimonials accurate. |
| 12 | Unsupported claims | Terms identify experimental, unverified game scores; catalog-only status is explicit. Fabricated gallery day assignments removed. | Validate professional claims, product descriptions, badges, image rights, and prices supplied outside the repository. |
| 13 | Alt text | Gallery has scene descriptions; controls have accessible names; decorative/thumbnail images use appropriate alternatives. PDF no longer auto-embeds. | Dynamic product imagery and the linked legacy PDF still need content-specific review. |
| 14 | Contrast | Shared focus styles and page/control contrast improved, with reduced-motion support. | Automated desktop/mobile checks passed on 18 pages; no blanket WCAG claim. |
| 15 | Keyboard | Skip links, labeled inputs, gallery dialog focus/keyboard controls, and shop dialog fixes implemented. | Integrated browser checks passed; further assistive-technology testing and complex legacy game interactions remain outside the tested flows. |
| 16 | Business details | Public operator name Tristan Merson and site URL shown; contact page added. No invented company/address. | Applicable seller details before commerce. |
| 17 | Children's data | Age 13+ declarations for accounts/public submissions; guests can play without publishing. No parental-consent process is falsely claimed. | Owner must assess actual audience and backend enforcement. A checkbox is not verifiable parental consent; child-directed operation needs a separate process. |
| 18 | Email unsubscribe | Communications page distinguishes transactional auth email from marketing. No newsletter, marketing list, or SMS enrollment found. | Before campaigns, configure genuine unsubscribe/suppression and required sender details at the sending provider. |
| 19 | Asset licenses | System fonts; local SDK license retained; unverified decorative hotlinks removed; Orrex attribution added. | PDF/copied effects, photos/icons, product imagery, and imported character material need rights evidence. Attribution does not establish permission. |
| 20 | Deletion request | Request page prepares an email draft and clearly states it is not sent. Separate local-data clearing removes named site keys. | Working inbox and owner processing are required. Server deletion is manual across both projects; procedure below. |

## Backend scope and deletion procedure

Two independent Supabase projects are used:

- **Main `azuixkurdzbvgsnuotkr`:** Auth accounts, `profiles`, private `player_dice_scores`, and catalog `products`. Schema also defines a `leaderboard`; check for historical copies there.
- **Legacy `ykfrfjtjfzthumypaxqi`:** public `leaderboard` aliases/scores. Rows have no account-owner ID. Main-account deletion cannot delete this project's entries.

1. Monitor the working public inbox, record receipt/scope minimally, and apply the relevant response deadline. Accept requests without requiring special wording or this form.
2. Verify account control proportionately; never ask for passwords/tokens. For anonymous scores use nickname, score, and approximate date, recognizing that aliases can collide. Do not disclose others' records or assume email identifies every old score.
3. In the **main** administrator dashboard, review the Auth user, profile, private scores, possible leaderboard copies, and other actual linked records/storage. Confirm deployed cascading deletions before relying on them. Handle owned storage objects and session revocation as appropriate; deleting only a profile is not account deletion.
4. In the **legacy** administrator dashboard, independently remove verified matching public-score rows. Review actual exports/backups too. Never expose a service-role/secret key in frontend code.
5. Remove unnecessary correspondence and any verified historical Lyra records covered by the request. Document narrow legal/security retention exceptions and actual provider backup schedules; reapply deletions after a restore where needed.
6. Confirm completed actions and explain justified exceptions. Local session/cart/game-data clearing is separate. Keep only a proportionate request-handling record; do not promise removal of copies already made by others.

No production records were read or changed in this review. Public browser keys are publishable credentials, not administrator secrets. Frontend privacy controls do not prove backend access restrictions.

## Outstanding owner and backend checks

- **Contact:** monitor `tristan@tristans-website.com` and process incoming requests. Email draft recipients are checked; no test message has been sent.
- **Database security:** verify deployed RLS/grants in both projects, including older permissive policies. Test isolation of profiles/private scores, protection of admin flags and product costs, and catalog write restrictions. The checked-in main schema does not establish the legacy project's configuration. Public-score insertion needs trusted validation and abuse/rate controls.
- **Age/consent:** declarations and metadata can be bypassed through direct API requests. Review actual audience and any intended server-side enrollment/publication requirements; do not claim completed COPPA compliance.
- **Rights:** `NLRMEv12.pdf` is Orrex's 84-page *The Net Libram of Random Magical Effects v1.20*. Page 4 discusses removal of TSR material but grants no redistribution license. No explicit license/permission grant was found in extracted text; HTML entries match the PDF table. Automatic embedding was removed, but the download and copied effects remain pending rights clarification. Keep provenance/permissions for other images, icons, and imported content too.
- **Operations:** confirm retention, provider logs/backups, historical messaging records, image hosts, and request handling. No paid commerce or marketing is enabled by this change. Apache rules in `htaccess.htaccess` do not configure GitHub Pages security headers.

## Validation record

Completed local verification on 2026-09-16:

- `scripts/verify_site.py` checked 18 pages at 1280px and 390px, with Supabase calls mocked and backend writes rejected. All pages had the expected main landmark, policy/deletion links, image alternative attributes, and no mobile overflow. No uncaught JavaScript errors occurred.
- axe-core 4.13.0 reported zero WCAG A/AA automated findings in the scanned desktop and mobile page states. This is a limited automated result, not a WCAG conformance certification or legal assessment.
- Storage notice persistence, selective browser-data removal, blocked-storage fallback, privacy email-draft preparation, catalog product/cart behavior, and Escape handling passed. All local HTML links/assets resolve.
- Additional isolated browser checks covered unchecked signup consents, optional nicknames, sign-in, password-recovery matching/update flow, explicit HTTPS avatar previews, prevention of automatic guest score publication, explicit guest sharing, private account score saving, and error messages. No real accounts or scores were created.
- Gallery checks covered all 63 visually described photos, tab arrows/Home/End, modal focus/background inertness/Escape/return focus, load-more focus, and desktop/mobile layout. Shop checks covered cart quantity/remove/re-render focus, modal focus, filter triggers/reset/breakpoint changes, and open-modal automated accessibility scans.
- `git diff --check` passed. Supabase bundle integrity matched the official npm distribution SHA-512; original package/dependency license notices are retained.

The owner supplied `tristan@tristans-website.com`; generated contact links and the privacy-draft recipient were updated before publication. Supabase recovery redirects, actual RLS/grants, retention, inbox delivery, legal applicability, and third-party content permissions are not verified by these tests. Publication and live-site verification are recorded in the deployment commit and task report.

## Primary references

- [FTC data minimization](https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business) and [ICO privacy-notice contents](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/).
- [ICO storage/access exceptions, updated 2026](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/) and [erasure requests](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/). UK applicability must be assessed; these are not universal rules.
- [FTC COPPA FAQs](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), [CAN-SPAM](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business), [reviews rule](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers), and [dark patterns](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers).
- [W3C alt text](https://www.w3.org/WAI/tutorials/images/decision-tree/), [contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum), and [keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html).
- [Copyright Office permissions](https://www.copyright.gov/what-is-copyright/); [Supabase user deletion](https://supabase.com/docs/guides/auth/managing-user-data) and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).