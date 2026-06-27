/* ============================================================================
   IONITY remaster — shared layout (head / nav / footer / cookie / scripts)
   Pure static output for GitHub Pages. One source of truth → consistent
   footers, links, meta and JSON-LD on every page.
   ========================================================================== */

export const SITE = {
  name: 'Ionity Global',
  legal: 'Ionity Global (Pty) Ltd',
  origin: 'https://ionity.co.za',
  sister: 'https://www.ionity.today',   // related domain — cross-linked for SEO
  tagline: 'Building tomorrow, today — Native-AI automation across cloud & offline AI, into hardware.',
  desc: 'Ionity Global is a Native-AI company. We build AIoT, Cloud & Edge systems, custom MCP, dashboards and digital twins — and run evidence-first audits & forensics that cut cost and prove return. Solutionists across mechanical, electrical and IT.',
  email: 'ai@ionity.today',
  phone: '+27 64 699 9877',
  phoneHref: '+27646999877',
  location: 'Centurion, South Africa',
  policy: 'Policy 986 AED',
  founder: 'Johan Wilhelm van Antwerp',
  linkedin: 'https://www.linkedin.com/in/ionity',
  gravatar: 'https://gravatar.com/ionity',
  github: 'https://github.com/Ionity-Global',
};

export const NAV = [
  ['index.html', 'Home'],
  ['services.html', 'Services'],
  ['edge.html', 'Edge Scan'],
  ['about.html', 'About'],
  ['contact.html', 'Contact'],
];

const navHtml = (active) => `
<a class="skip" href="#main">Skip to content</a>
<header class="nav" id="nav">
  <a class="brand" href="index.html" aria-label="Ionity Global home">
    <img class="wm" src="assets/img/wordmark.png" alt="Ionity Global" height="58">
  </a>
  <nav class="nav-links" id="navLinks" aria-label="Primary">
    ${NAV.map(([h, l]) => `<a href="${h}"${h === active ? ' aria-current="page"' : ''}>${l}</a>`).join('\n    ')}
  </nav>
  <div class="nav-cta">
    <button class="icon-btn" data-sfx-toggle title="Toggle 8-bit power-up sounds" aria-label="Toggle interface sounds">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M9.5 9.5h5M12 8v8M10 16h4"/></svg>
    </button>
    <button class="icon-btn" data-audio-toggle title="Toggle 8-bit industrial soundscape" aria-label="Toggle ambient soundscape">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>
    </button>
    <a class="btn btn-primary" href="contact.html">Start a project</a>
    <button class="icon-btn burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
  </div>
</header>`;

export function head(page) {
  const url = `${SITE.origin}/${page.path === 'index.html' ? '' : page.path}`;
  const title = page.title;
  const desc = page.desc || SITE.desc;
  const jsonld = page.jsonld ? `\n<script type="application/ld+json">${JSON.stringify(page.jsonld)}</script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#07080D">
<meta name="author" content="${SITE.founder} — ${SITE.legal}">
<meta name="generator" content="Ionity remaster build">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="keywords" content="Ionity, Ionity Global, Ionity South Africa, Ionity AI, AEDi, Native-AI, AIoT, edge computing hardware, cloud hosting, software development, custom MCP, AI dashboards, digital twins, website audit, digital forensics, Level of Effort, RuView, Wi-Fi sensing, Antwerp Designs, ${SITE.founder}, Centurion">
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/assets/og/social-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE.origin}/assets/og/social-card.png">
<!-- Icons / PWA -->
<link rel="icon" href="assets/img/favicon.ico?v=17" sizes="any">
<link rel="icon" href="assets/img/favicon-64.png?v=17" type="image/png" sizes="64x64">
<link rel="icon" href="assets/img/icon-192.png?v=17" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png?v=17">
<link rel="manifest" href="manifest.json">
<!-- Fonts (no cookies set; degrades to system) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Chakra+Petch:wght@500;600;700&display=swap">
<link rel="stylesheet" href="assets/css/ionity.css?v=17">
<!-- Three.js backdrop importmap (must precede the module) -->
<script type="importmap">
{ "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
}}
</script>${jsonld}
</head>
<body${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>
<canvas id="bg3d" aria-hidden="true"></canvas>
<div class="bg-field" aria-hidden="true"></div>
<div class="bg-grid" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<div class="crt-fx" aria-hidden="true"></div>
<div class="crt-frame" aria-hidden="true"></div>
<div class="progress-top" id="progressTop"></div>
<div class="loader" id="loader" aria-hidden="true"><img class="mark" src="assets/img/ionity-anim.webp" onerror="this.onerror=null;this.src='assets/img/ai-mark-white.png';this.style.cssText='width:72px;height:72px'" alt="" width="280" height="147"><span class="lbl">Initialising edge…</span></div>
${navHtml(page.path)}
<main id="main">`;
}

const socialSvg = {
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21H9z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85l-.01 2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>`,
  gravatar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.8A4 4 0 0 1 10 16h4a4 4 0 0 1 3.8 2.9"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
};

export function footer() {
  return `</main>
<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="index.html"><img class="wm" src="assets/img/wordmark.png" alt="Ionity Global" height="40"></a>
        <p class="blurb">${SITE.legal} — a Native-AI company building AIoT, Cloud & Edge systems and running evidence-first audits across mechanical, electrical and IT. Grown from Antwerp Designs (2018).</p>
        <p class="blurb mono" style="font-size:.66rem;margin-top:.8rem">${SITE.location} · <a href="tel:${SITE.phoneHref}" style="color:var(--cyan)">${SITE.phone}</a> · <a href="mailto:${SITE.email}" style="color:var(--cyan)">${SITE.email}</a></p>
        <div class="socials">
          <a href="${SITE.linkedin}" target="_blank" rel="noopener me" aria-label="LinkedIn">${socialSvg.linkedin}</a>
          <a href="${SITE.github}" target="_blank" rel="noopener" aria-label="GitHub">${socialSvg.github}</a>
          <a href="${SITE.gravatar}" target="_blank" rel="noopener me" aria-label="Gravatar">${socialSvg.gravatar}</a>
          <a href="mailto:${SITE.email}" aria-label="Email">${socialSvg.mail}</a>
        </div>
      </div>
      <div>
        <h5>Capabilities</h5>
        <a href="services.html#native-ai">Native-AI &amp; MCP</a>
        <a href="services.html#aiot">AIoT &amp; Edge</a>
        <a href="services.html#cloud">Cloud &amp; Twins</a>
        <a href="services.html#audit">Audit &amp; Forensics</a>
        <a href="services.html#hardware">Hardware &amp; Firmware</a>
      </div>
      <div>
        <h5>Explore</h5>
        <a href="edge.html">Edge Micro-Audit</a>
        <a href="about.html">About &amp; AEDi</a>
        <a href="about.html#founder">Founder</a>
        <a href="contact.html">Contact</a>
        <a href="${SITE.github}" target="_blank" rel="noopener">Open source</a>
        <a href="${SITE.sister}" rel="me">ionity.today ↗</a>
      </div>
      <div>
        <h5>Trust</h5>
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
        <a href="#" data-cookie-open>Cookie settings</a>
        <a href="${SITE.origin}/security.txt">Security</a>
        <a href="${SITE.origin}/llms.txt">llms.txt</a>
      </div>
    </div>
    <div class="foot-base">
      <p>© <span data-year>2026</span> ${SITE.legal}. All rights reserved. · ${SITE.policy}</p>
      <p>Built Native-AI · <a href="${SITE.origin}/humans.txt">humans.txt</a> · ${SITE.origin.replace('https://','')} · also at <a href="${SITE.sister}" rel="me">ionity.today</a></p>
    </div>
  </div>
</footer>
${cookieHtml()}
<aside class="scroll-rail" id="scrollRail" aria-hidden="true"></aside>

<!-- AEDi on-site AI assistant -->
<div class="aedi-wrap" id="aediWrap">
  <button class="aedi-fab" id="aediToggle" aria-label="Chat with AEDi — Ionity AI" aria-expanded="false" title="Chat with AEDi">
    <img class="aedi-fab-logo" src="assets/img/ai-mark-white.png" alt="" width="24" height="24" aria-hidden="true">
    <span class="aedi-badge">AEDi</span>
    <span class="aedi-pulse" aria-hidden="true"></span>
  </button>
  <div class="aedi-panel" id="aediPanel" role="dialog" aria-label="AEDi — Ionity AI" aria-hidden="true" hidden>
    <div class="aedi-head">
      <div>
        <span class="aedi-name">AEDi</span>
        <span class="aedi-sub">Automated Ecosystems Intelligence</span>
      </div>
      <div class="aedi-status"><span class="dot"></span><span id="aediStatusText">Online</span></div>
      <button class="aedi-close" id="aediClose" aria-label="Close AEDi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>
    <div class="aedi-messages" id="aediMessages"></div>
    <div class="aedi-input-row">
      <input class="aedi-input" id="aediInput" type="text" placeholder="Ask AEDi…" autocomplete="off" maxlength="500" aria-label="Message AEDi">
      <button class="aedi-send" id="aediSend" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
    </div>
    <p class="aedi-disc">AEDi by Ionity · messages processed via cloud API</p>
  </div>
</div>

<script src="assets/js/audio.js?v=17" defer></script>
<script src="assets/js/mario.js?v=17" defer></script>
<script src="assets/js/cookies.js?v=17" defer></script>
<script src="assets/js/core.js?v=17" defer></script>
<script src="assets/js/edge-diagnostics.js?v=17" defer></script>
<script src="assets/js/matrix-cam.js?v=17" defer></script>
<script src="assets/js/sensor-node.js?v=17" defer></script>
<script src="assets/js/disciplines-graph.js?v=17" defer></script>
<script src="assets/js/aedi-chat.js?v=17" defer></script>
<script>window.IonityGlitch=window.IonityGlitch||{};window.IonityGlitch.config={zIndex:3000};</script>
<script src="assets/js/glitch.js?v=17" defer></script>
<!-- Three.js WebGL backdrop (ES module; degrades to CSS via html.no3d) -->
<script type="module" src="assets/js/backdrop.js?v=17"></script>
</body>
</html>`;
}

function cookieHtml() {
  return `
<section class="cookie" id="cookie" role="dialog" aria-live="polite" aria-label="Cookie consent">
  <h4>We respect your edge 🍪</h4>
  <p>We use a strictly-necessary cookie to remember this choice. Optional cookies stay <strong>off</strong> until you allow them. Read our <a href="privacy.html">privacy notice</a>.</p>
  <div id="cookieDetails" hidden>
    <div class="cookie-toggles" id="cookieToggles"></div>
  </div>
  <div class="row">
    <button class="btn btn-primary" id="ckAccept">Accept all</button>
    <button class="btn btn-ghost" id="ckReject">Reject non-essential</button>
    <button class="btn btn-ghost" id="ckCustomize">Customize</button>
    <button class="btn btn-ghost" id="ckSave" style="display:none">Save choices</button>
  </div>
</section>`;
}
