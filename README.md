<div align="center">

<img src="assets/img/icon.svg" width="96" alt="Ionity">

# Ionity Global — Official Website (2026 Q3+ Remaster)

**Native-AI · AIoT · Cloud · Edge · Audit & Forensics**
Solutionists across mechanical, electrical and IT.

[www.ionity.today](https://www.ionity.today) · [LinkedIn](https://www.linkedin.com/in/ionity) · [Gravatar](https://gravatar.com/antwerpdesigns) · Policy 986 AED

</div>

---

A ground-up remaster of the Ionity Global website — rebuilt as an **immersive, single-page "adventure"** experience backed by lean supporting pages. The brand vibe (dark + electric blue/cyan, industrial-AIoT) is kept and *refined*; the bulk is gone. No frameworks, no tracker bloat, no build step required to deploy — pure static, GitHub-Pages-native.

> This repo is a **combined remaster**, not a straight `master` pull. The legacy site's `master` was already the integration branch (most feature branches were merged into it); we distilled its best ideas — the dark immersive aesthetic, AI-friendly `robots.txt`, real cookie consent, the SEO/IndexNow groundwork — and rebuilt them clean, modular and dramatically lighter.

## ✨ What makes it different

| | |
|---|---|
| **Immersive adventure** | A scroll journey of 9 "acts" with a side rail, progress bar, parallax orbital field and reveal choreography. |
| **🛰️ Edge Micro-Audit** (signature) | A live, **100% on-device** diagnostic of *your* hardware & network — real GPU/renderer, CPU threads, memory, a compute benchmark, display refresh measured from frame timing, **measured** network RTT + throughput, battery, storage. **No simulation. Nothing is transmitted.** It's a 20-second taste of how Ionity audits infrastructure. |
| **📡 RuView connector** | Wi-Fi (CSI) presence sensing is hardware-bound, so the panel streams **real** data from a connected RuView edge node — or stays honestly dark. It never fabricates a count. |
| **🎛️ 8-bit industrial soundscape** | A soft procedural machine-room drone + chiptune UI blips, **synthesised live** with the Web Audio API (zero audio files). Off by default; toggle in the nav. |
| **🍪 Real consent** | Granular, opt-in cookie manager (necessary / preferences / analytics / marketing) with a durable `ionity_consent` cookie and a `ionity:consent` event for gating. |
| **🔎 SEO + AEO** | Canononical URLs, Open Graph/Twitter, JSON-LD (Organization, Breadcrumb, ContactPage), `sitemap.xml`, AI-welcoming `robots.txt`, `llms.txt`, `humans.txt`, `security.txt`, PWA manifest + maskable icons. |
| **⚡ Lean** | Pages went from 119–314 KB each to **9–28 KB**. Assets from **132 MB → ~3 MB**. |

## 🗂 Structure

Published files live at the **repo root** (so GitHub Pages serves them directly with the `CNAME`). The site generator lives in `_build/`.

```
/                      ← published static site (served by Pages)
  index.html           ← immersive adventure home
  services.html        ← six disciplines, expanded & de-bulked
  edge.html            ← the live Edge Micro-Audit
  about.html           ← Antwerp Designs → Ionity, AEDi, founder
  contact.html  privacy.html  terms.html  404.html
  assets/css/ionity.css     ← single design system
  assets/js/*.js            ← core · audio · cookies · edge-diagnostics · ruview
  assets/img · assets/og · assets/video
  manifest.json robots.txt sitemap.xml llms.txt humans.txt security.txt CNAME
_build/                ← page generator (node, run on your machine)
  build.mjs layout.mjs pages.mjs gen-icons.mjs serve.cjs
```

See [`.filesystem`](.filesystem) for an annotated map and [`.workdone`](.workdone) for the full change log.

## 🛠 Develop / regenerate

```bash
npm install          # only needed to (re)generate icons via sharp
npm run build        # regenerate all HTML from _build/*.mjs
npm run icons        # regenerate PWA icons + OG card from assets/img/icon.svg
npm run dev          # build + serve at http://localhost:4321
```

Editing content? Change `_build/layout.mjs` (head/nav/footer — one source of truth) or `_build/pages.mjs` / `_build/build.mjs`, then `npm run build`. The HTML is committed, so **deployment needs no build** — Pages just serves the root.

## 🚀 Deploy (GitHub Pages)

1. Settings → Pages → Build and deployment → **Deploy from a branch** → `master` / `/ (root)`.
2. Custom domain is set via `CNAME` → `www.ionity.today`.
3. `.nojekyll` is present so `_build/` and dotfiles are served as-is.

## 🔌 Going live with RuView

Point the panel at a real node: set a global before the scripts, or paste an endpoint in the UI.

```html
<script>window.IONITY_RUVIEW_ENDPOINT = "wss://your-node.local:8787";</script>
```

The bridge should emit JSON frames: `{ "devices": <int>, "presence": 0..1, "motion": 0..1, "rooms": <int>, "ts": <ms> }`.

---

<div align="center">
© 2026 <b>Ionity Global (Pty) Ltd</b> · Founder: Johan Wilhelm van Antwerp · Built Native-AI, with Claude in the loop.
</div>
