# ionity.co.za — v19.2 release

Ionity Global (Pty) Ltd · built 2026-10-03 · cache key `?v=192` · service-worker cache `ionity-v19.2`

## What's new

| Area | Change |
|---|---|
| **New page** | `software.html` — ProGramerly feature page, links to **https://ionity.digital/** (download, version history, GitHub releases) |
| **New page** | `freebies.html` — free shelf, IO-MAN front and centre, links to **https://www.ionity.fun/** |
| **New services** | Pillar 05 · Now trending (2026): nine services with detail sections on `services.html` (`#sovereign-ai`, `#ai-security`, `#cyber-defence`, `#physical-ai`, `#predictive-maintenance`, `#energy-esg`, `#ai-visibility`, `#provenance`, `#ai-literacy`) |
| **Home** | Five pillars / twenty-one services, the AEDi Edge AI Node video (X870M display loop) and a Software + Freebies teaser |
| **Nav / footer** | 8-item nav (Software, Freebies + FREE badge) on every page; footer gets a "Now trending" column and links to ionity.digital / ionity.fun |
| **Smoothing** | View transitions between pages, blur-in reveals, pointer spotlight cards, tactile buttons, themed scrollbar, calmer CRT scroll shimmer, balanced headlines, wider page heroes |
| **Contact** | Topic list covers all 21 services; `contact.html?service=<id>` pre-selects the topic |
| **AEDi** | `aedi.yaml` and the chat fallback know about Software, Freebies and the 2026 track |
| **SEO / AEO** | JSON-LD for ProGramerly (SoftwareApplication), IO-MAN (VideoGame), nine new Services and three new FAQs; `sitemap.xml`, `llms.txt`, `ai.txt`, `humans.txt`, `manifest.json` updated |

## Files

New: `software.html`, `freebies.html`, `assets/js/refine.js`, `assets/video/aedi-edge-node-x870m.mp4` + `.webm`, `assets/img/aedi-edge-node-poster.webp`, `assets/img/software/*`, `assets/img/freebies/*`, `DEPLOY-v19.2.md`

Changed: all 11 existing pages, `assets/css/ionity.css` (v19.2 refinement layer appended; nothing above it removed, except the mobile-nav breakpoint 880px → 1120px), `assets/js/aedi-chat.js`, `aedi.yaml`, `ai.txt`, `llms.txt`, `humans.txt`, `sitemap.xml`, `manifest.json`, `sw.js`

Unchanged and carried over from the live site: every other asset, `CNAME`, `.nojekyll`, PDFs, team images.

## Deploy (GitHub Pages)

1. Open the repository that serves ionity.co.za.
2. Copy the contents of `ionity.co.za-v19.2-changes.zip` over the repo root. Copying over the repo keeps anything only the repo has.
3. Commit (`v19.2 — Software + Freebies pages, 2026 trending services, smoothing pass`) and push to the Pages branch.
4. After Pages finishes building, hard-refresh once (Ctrl+F5). The new service-worker version clears old caches on its own.

## Check after deploy

- `/software.html` → "Open ionity.digital" opens ProGramerly
- `/freebies.html` → "Play on ionity.fun" opens IO-MAN
- `/services.html#ai-security` → "Enquire" opens the contact page with the topic pre-selected
- Home → the edge-node video plays when scrolled into view and pauses when it leaves
- Phone width → burger menu shows all eight items

Rollback: revert the commit. Older cached assets use `?v=73` and do not clash with `?v=192`.

BUILDING TOMORROW, TODAY

---

## v19.3 addendum — 2026-10-06 · backdrop made self-hosted

**Why.** Opened from a local folder (file://) the v19.2 pages lost the Three.js backdrop — browsers refuse ES-module imports and the jsDelivr importmap over file://, so every page fell back to the flat CSS field (`html.no3d`). The live site was unaffected, but the dependency on a third-party CDN was the same risk online.

**What changed.**

| Area | Change |
|---|---|
| `assets/js/backdrop.bundle.js` | New. `backdrop.js` + three@0.160.0 (EffectComposer, RenderPass, UnrealBloomPass) bundled with esbuild into one classic script (~670 KB). The scene now renders offline, without a CDN, and in local previews. All PERF guards (reduced-motion, low-core, no WebGL → `html.no3d`) are unchanged. |
| All 13 pages | The jsDelivr importmap, `dns-prefetch`/`preconnect` to cdn.jsdelivr.net and `<script type="module" src="assets/js/backdrop.js">` are replaced by `<script defer src="assets/js/backdrop.bundle.js?v=193">`. |
| `cookies.html` | jsDelivr row removed from the third-party table (no longer loaded). |
| `sw.js` | Cache `ionity-v19.3`. |
| `assets/js/backdrop.js` | Kept as the readable source. Rebuild: `npx esbuild assets/js/backdrop.js --bundle --format=iife --minify --target=es2019 --outfile=assets/js/backdrop.bundle.js` with `three@0.160.0` installed. |

Verified: 3D backdrop active (`html.no3d` absent, canvas sized) on all 13 pages over HTTP and over file://.
