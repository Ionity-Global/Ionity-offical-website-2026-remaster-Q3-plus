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
| **Real brand** | Official **IONITY GLOBAL** wordmark (blue `#0079E3` + orange `#FF9500`) and the **AI** monogram as the app/PWA icon, pulled from the brand assets — with cyan + red as live/forensic accents. |
| **Immersive adventure** | A 10-act scroll journey (Enter → Native-AI → Capabilities → Audit → Edge Scan → Proximity → Sensor Node → AEDi → Founder → Begin) with a side rail, progress bar, parallax orbital field and reveal choreography. |
| **🛰️ Edge Micro-Audit** (signature) | A live, **100% on-device** diagnostic of *your* hardware & network — real GPU/renderer, CPU threads, memory, a compute benchmark, display refresh measured from frame timing, **measured** network RTT + throughput, battery, storage. **No simulation. Nothing is transmitted.** |
| **📡 RSSI Proximity** (signature) | Reads the **real RSSI** of Bluetooth-LE advertisements around you to count nearby radios and **estimate people nearby** — distance-bucketed, on-device, no upload. Falls back honestly when the browser can't scan, and can connect to a real Ionity ESP32 edge node for hardware-grade RSSI. Never fabricates a count. |
| **🛰️ Edge Sensor Node** (signature) | Turns *your* browser into a live edge node: real accelerometer, gyro/tilt/compass, ambient light and microphone sound-level — visualised live. The field-sensing pitch, demonstrated in your hand. |
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
  edge.html            ← Edge Micro-Audit + RSSI Proximity + Sensor Node
  about.html           ← Antwerp Designs → Ionity, AEDi, founder
  contact.html  privacy.html  terms.html  404.html
  assets/css/ionity.css     ← single design system
  assets/js/*.js            ← core · audio · cookies · edge-diagnostics · proximity · sensor-node
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

## 🔌 RSSI Proximity — how it stays real

The proximity panel has three honest sources, in order:

1. **Web Bluetooth LE scanning** — `navigator.bluetooth.requestLEScan` reads the real `rssi` of every BLE advertisement nearby (Chromium with the *Web Bluetooth scanning* capability, on user permission).
2. **Ionity edge node** — an ESP32 Wi-Fi-promiscuous sniffer streaming real RSSI. Set a global or paste an endpoint in the UI:
   ```html
   <script>window.IONITY_RSSI_ENDPOINT = "wss://your-node.local:8787";</script>
   ```
   Frame: `{ "devices": [{ "id": "..", "rssi": -57 }, …], "people": <int?>, "ts": <ms> }`.
3. **Nothing available** → the panel says so. It never invents a number.

The **Sensor Node** panel reads real device sensors (motion, orientation/compass, `AmbientLightSensor`, mic level via `getUserMedia`) — all on-device, permission-gated.

---

<div align="center">
© 2026 <b>Ionity Global (Pty) Ltd</b> · Founder: Johan Wilhelm van Antwerp · Built Native-AI, with Claude in the loop.
</div>
