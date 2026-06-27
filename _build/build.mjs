/* ============================================================================
   IONITY remaster — page generator. Emits pure static HTML into ../site
   Run:  node build/build.mjs
   ========================================================================== */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { head, footer, SITE } from './layout.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = (file, html) => { writeFileSync(join(OUT, file), html); console.log('· wrote', file); };
const page = (p, body) => head(p) + body + footer();

/* ---- shared fragments --------------------------------------------------- */
const ICON = {
  ai:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h6v6H9z"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>`,
  iot:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="2.5"/><path d="M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 4"/></svg>`,
  cloud:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 18 18z"/><path d="M12 13v5M9 16l3 3 3-3"/></svg>`,
  audit:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h12l4 4v12H4z"/><path d="M8 11l2.5 2.5L16 8M8 16h8"/></svg>`,
  chip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></svg>`,
  twin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/></svg>`,
  edge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="6" width="12" height="12" rx="2"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>`,
  server:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/></svg>`,
  cam:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="6" width="14" height="12" rx="2"/><path d="M16.5 10l5-3v10l-5-3z"/><circle cx="9.5" cy="12" r="2.4"/></svg>`,
  arrow:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
};

const SERVICES = [
  ['native-ai', ICON.ai, 'Native-AI &amp; MCP', 'We are AI-native, not AI-bolted-on. Custom MCP servers, agents, copilots and dashboards wired straight into your stack — built with Claude and our own AEDi systems.', ['Custom MCP', 'AI agents', 'Copilots', 'RAG']],
  ['aiot', ICON.iot, 'AIoT &amp; Edge', 'Sensing, inference and control at the edge. Device fleets, Wi-Fi sensing (RuView / Ionify), and low-latency intelligence that runs where the data is born.', ['Edge inference', 'Wi-Fi sensing', 'Fleets', 'Telemetry']],
  ['cloud', ICON.cloud, 'Cloud &amp; Digital Twins', 'Data plumbing that actually holds: pipelines, APIs and live digital twins that mirror your operation so decisions are made on reality, not guesswork.', ['Pipelines', 'APIs', 'Digital twins', 'Observability']],
  ['audit', ICON.audit, 'Audit &amp; Forensics', 'Evidence-first audits of websites, systems and infrastructure — surfacing risk, waste and quick wins, each ranked by <strong>Level of Effort (LoE)</strong> vs. return. We don\'t just find problems; we lift productivity and effectiveness, then prove the saving.', ['Web audits', 'Forensics', 'Cost savings', 'Level-of-Effort (LoE)']],
  ['hardware', ICON.chip, 'Hardware &amp; Firmware', 'When software needs a body, we build it: PCBs, ESP32/edge nodes and firmware. Solutionists across mechanical, electrical and IT — with real artisan knowledge.', ['PCB', 'ESP32', 'Firmware', 'Mechatronics']],
  ['twins', ICON.twin, 'Custom B2B Systems', 'Custom anything: bespoke dashboards, internal tools and integrations engineered to grow with the business — and to keep paying for themselves.', ['Dashboards', 'Integrations', 'Internal tools', 'Growth']],
  ['edge-hw', ICON.edge, 'Edge Computing Hardware', 'Purpose-built edge compute — rugged nodes, GPU/NPU accelerators and gateways that run AI inference and control on-site, where latency, privacy and uptime actually matter.', ['Edge nodes', 'GPU / NPU', 'Gateways', 'On-site AI']],
  ['hosting', ICON.server, 'Cloud Hosting Services', 'Managed, secure hosting for sites, APIs and apps — resilient infrastructure with backups, monitoring and sane TLS / DNS. We keep it online so you don’t have to think about it.', ['Managed hosting', 'APIs', 'Backups', 'TLS / DNS']],
  ['software', ICON.code, 'Software Development &amp; Web', 'Full-stack software and web relations — from fast marketing sites to complex web apps, portals and integrations — designed, built and maintained with a Native-AI workflow.', ['Web apps', 'Websites', 'APIs', 'Maintenance']],
];

const serviceCard = (s, cls = '') => `
<article class="card reveal ${cls}">
  <div class="ico">${s[1]}</div>
  <h3>${s[2]}</h3>
  <p>${s[3]}</p>
  <div class="tag-row">${s[4].map(t => `<span class="tag">${t}</span>`).join('')}</div>
</article>`;

/* ================================================================ INDEX === */
const indexJsonld = {
  '@context': 'https://schema.org', '@type': 'Organization',
  '@id': SITE.origin + '/#org',
  name: SITE.legal, alternateName: ['Ionity', 'Ionity Global', 'Ionity AI', 'Ionity South Africa', 'AEDi'], url: SITE.origin,
  logo: SITE.origin + '/assets/img/icon-512.png',
  email: SITE.email, slogan: SITE.tagline,
  description: SITE.desc,
  disambiguatingDescription: 'Ionity Global (Pty) Ltd is a South African Native-AI, AIoT, Edge, cloud-hosting and audit/forensics company founded by Johan Wilhelm van Antwerp. It is a distinct, unrelated entity from the European electric-vehicle charging network IONITY GmbH (ionity.com).',
  foundingDate: '2018',
  telephone: SITE.phone,
  address: { '@type': 'PostalAddress', addressLocality: 'Centurion', addressCountry: 'ZA' },
  founder: { '@type': 'Person', name: SITE.founder,
    jobTitle: 'Director & Founder — Solutionist, Tech-PUG, Design Engineer',
    description: 'Design & Development, IoT and business-owner consulting. Bridges the software–hardware gap and advances into unseen integrations to excel systems across industries with AI edge ecosystems and sustainable cloud. Backed by Toolmaking and Mechanical Engineering qualifications; rapid prototyping and product design. Connected across FMCG, Robotics, Medical, Aerospace, Industrial, Energy and Households.',
    knowsAbout: ['IoT', 'AI', 'Cloud', 'Edge', 'Mechanical Engineering', 'Electronic design', 'Electrotechnics', 'Toolmaking', 'Fabrication', 'Rapid Prototyping', 'Product Design', 'Automation', 'Autonomous AI Systems', 'Real-time sensing', 'Edge Nodes'],
    sameAs: [SITE.linkedin, SITE.gravatar] },
  sameAs: [SITE.sister, SITE.linkedin, SITE.github, SITE.gravatar],
  knowsAbout: ['Native AI', 'AIoT', 'Edge computing', 'Cloud', 'Model Context Protocol', 'Digital twins', 'Website audit', 'Digital forensics', 'Wi-Fi sensing', 'Automation', 'Autonomous AI', 'Mechanical engineering', 'Electrotechnics', 'Toolmaking', 'Fabrication', 'Rapid prototyping', 'Product design', 'Real-time sensing', 'Multi-industry intelligence'],
  keywords: 'IoT, AIoT, AI, Edge, Cloud, Automation, Autonomous AI, Mechanical Engineering, Electrotechnics, Toolmaking, Fabrication, Rapid Prototyping, Product Design, Real-time sensing, Edge Nodes, FMCG, Hospitality, Robotics, Medical, Aerospace, Industrial, Energy, Household automation, Security, B2B, B2G, B2C',
  knowsLanguage: 'en',
  brand: [
    { '@type': 'Brand', name: 'ionity.co.za — B2B Systems & Engineering', url: SITE.origin },
    { '@type': 'Brand', name: 'ionity.today — Advanced Services & AI Intelligence', url: SITE.sister }
  ],
  areaServed: 'Worldwide',
};

// WebSite node (no SearchAction — there is no on-site search endpoint, and a fake
// one is flaggable). Links to the Org via @id so engines resolve one entity.
const websiteJsonld = {
  '@context': 'https://schema.org', '@type': 'WebSite',
  '@id': SITE.origin + '/#website', url: SITE.origin + '/',
  name: SITE.name, inLanguage: 'en',
  publisher: { '@id': SITE.origin + '/#org' },
  description: SITE.desc,
};

const index = page(
  { path: 'index.html', title: 'Ionity Global — Native-AI · AIoT · Cloud · Edge · Audit', desc: SITE.desc, jsonld: [indexJsonld, websiteJsonld] },
  `
<!-- ACT 1 ── portal hero (wordmark + Talk to AEDi) ── -->
<section class="hero portal-hero" id="hero" data-act="Enter">
  <div class="orbit-field" aria-hidden="true">
    <div class="ring r1"><span class="sat"></span></div>
    <div class="ring r2"><span class="sat"></span></div>
    <div class="ring r3"><span class="sat"></span></div>
  </div>

  <div class="portal-id">
    <img class="hero-wm" src="assets/img/wordmark.png" alt="Ionity Global" width="460" height="307" fetchpriority="high" decoding="async">
    <span class="pill"><span class="dot"></span> Native-AI · AIoT · Edge · Audit · ${SITE.location} · since 2018</span>
  </div>

  <!-- CENTRE — AEDi (the focal point) -->
  <div class="portal portal-ai portal-main reveal">
    <span class="portal-kicker">AEDi</span>
    <h2>Automated Ecosystems<br>Designs Intelligence</h2>
    <p>Our own Native-AI fabric. Ask it anything about Ionity — it routes you through the build.</p>
    <button class="btn btn-primary aedi-cta" id="portalAccess" data-sfx="powerup" aria-label="Talk to AEDi">Talk to AEDi ${ICON.arrow}</button>
  </div>

  <a class="portal-skip" href="#ethos" data-sfx="coin">scroll to explore ${ICON.arrow}</a>
  <div class="scroll-hint" aria-hidden="true"><i></i><i></i></div>
</section>

<div class="marquee" aria-hidden="true"><ul>
  ${Array(2).fill(0).map(()=>`<li>Native-AI</li><li>AIoT</li><li>Edge</li><li>Cloud</li><li>Custom MCP</li><li>Digital Twins</li><li>Audit &amp; Forensics</li><li>Wi-Fi Sensing</li><li>Hardware</li>`).join('')}
</ul></div>

<!-- ACT 2 ───────────────────────────────────────────── -->
<section class="wrap" id="ethos" data-act="Native-AI">
  <div class="section-head reveal">
    <span class="kicker">01 · The premise</span>
    <h2>AI-native — not AI-attached.</h2>
    <p class="lead">Most companies bolt AI onto old shapes. We start from intelligence: every dashboard, device and decision-loop is designed around models, agents and live data from day one — with our own <a href="about.html#aedi" style="color:var(--cyan)">AEDi</a> systems doing the heavy lifting and Claude in the loop.</p>
  </div>
  <div class="grid cols-3">
    <div class="card reveal"><h3>Solutionists</h3><p>Across mechanical, electrical and IT — with artisan hands. If the answer needs a circuit, a script and a bracket, we make all three.</p></div>
    <div class="card reveal d1"><h3>Evidence-first</h3><p>We measure before we claim. Audits, forensics and benchmarks turn opinions into numbers — and numbers into savings.</p></div>
    <div class="card reveal d2"><h3>Return-driven</h3><p>Every engagement carries a <strong>Level of Effort (LoE)</strong> return — ranked effort vs. saving. We build for measurable gains in productivity and effectiveness; systems should pay for themselves, and we design them to.</p></div>
  </div>
</section>

<!-- ACT 2.5 ── TRAJECTORY + INDUSTRIES ──────────────────── -->
<section class="wrap" id="trajectory" data-act="Trajectory">
  <div class="section-head reveal">
    <span class="kicker">01b · The arc</span>
    <h2>Building <span class="grad-text">tomorrow</span>, today.</h2>
    <p>A Native-AI company driving automation across <strong>cloud solutions</strong> and <strong>offline / on-device AI</strong> — and carrying digital design &amp; development all the way into <strong>physical hardware</strong>.</p>
  </div>
  <ol class="timeline-row reveal">
    <li><span class="ty">2018</span><h4>Antwerp Designs</h4><p>Product design &amp; development — the artisan roots.</p></li>
    <li class="d1"><span class="ty">2022</span><h4>Ionity · AEDi</h4><p>Native-AI, AIoT &amp; edge — intelligence designed in from day one.</p></li>
    <li class="now d2"><span class="ty">NOW</span><h4>Automation, everywhere</h4><p>Cloud automation + offline AI for industry — digital → physical.</p></li>
  </ol>
  <div class="reveal mt-2">
    <p class="kicker" style="margin-bottom:.9rem">Industries we automate</p>
    <div class="tag-row">
      <span class="tag">Aerospace</span><span class="tag">Hospitality</span><span class="tag">Governance</span>
      <span class="tag">Medical</span><span class="tag">Corporate Sales</span><span class="tag">Production &amp; Fabrication</span>
      <a class="tag tag-cta" href="contact.html" data-sfx="coin">Enquire for more ${ICON.arrow}</a>
    </div>
  </div>
</section>

<!-- ACT 3 ───────────────────────────────────────────── -->
<section class="wrap" id="capabilities" data-act="Capabilities">
  <div class="section-head reveal">
    <span class="kicker">02 · What we do</span>
    <h2>Ten disciplines, <span class="grad-text">one stack</span>.</h2>
    <p>Clean, composable, and built to integrate. Pick one or chain them into a full digital twin of your operation.</p>
  </div>
  <div class="grid cols-3">
    ${SERVICES.map((s,i)=>serviceCard(s, 'd'+((i%3)+0))).join('')}
  </div>
  <div class="center mt-2 reveal"><a class="btn btn-ghost" href="services.html">See services in depth ${ICON.arrow}</a></div>
</section>

<!-- ACT 3.5 ── DISCIPLINES (3D mindmap) ─────────────────── -->
<section class="wrap" id="disciplines" data-act="Disciplines">
  <div class="section-head reveal">
    <span class="kicker">02b · The disciplines</span>
    <h2>Ten disciplines, <span class="grad-text">one mind</span>.</h2>
    <p>Services are how we package it; <em>disciplines</em> are what we actually master. Drag the graph — it's a live 3D map of the fields Ionity fuses into every build.</p>
  </div>
  <div class="disc-stage reveal" id="discStage">
    <canvas id="discCanvas" aria-hidden="true"></canvas>
    <ul class="disc-list" aria-label="Ionity disciplines">
      <li>Digital Innovation</li><li>Internet of Things</li><li>Artificial Intelligence — Offline</li>
      <li>Artificial Intelligence — Online</li><li>Mechanical Engineering</li><li>Electrotechnics</li>
      <li>Product Development</li><li>Software Engineering</li><li>Computer-Aided Drafting</li><li>Cloud &amp; Edge</li>
    </ul>
  </div>
</section>

<!-- ACT 4 ───────────────────────────────────────────── -->
<section class="wrap" id="audit" data-act="Audit">
  <div class="feature split">
    <div class="reveal">
      <span class="kicker">03 · Audit &amp; forensics</span>
      <h2 class="mt-1">We find what your systems hide.</h2>
      <p class="lead mt-1">Our audit practice (the engine behind our CEO-grade WebAudit reports) inspects sites, infrastructure and code the way a forensic examiner would — capturing live evidence, scoring it, and handing you a prioritised path to lower cost and lower risk.</p>
      <div class="statband mt-2">
        <div><div class="n grad-text" data-count="100" data-suffix="%">100%</div><div class="l">Evidence-based</div></div>
        <div><div class="n grad-text" data-count="6">6</div><div class="l">Audit dimensions</div></div>
        <div><div class="n grad-text" data-count="24" data-suffix="h">24h</div><div class="l">Rapid turnaround</div></div>
        <div><div class="n grad-text">LoE</div><div class="l">Level of Effort · return modelled</div></div>
      </div>
    </div>
    <div class="reveal d2">
      <div class="hud">
        <div class="hud-head"><span class="t">live · audit lens</span><span class="pill"><span class="dot"></span> ready</span></div>
        <p class="note">Performance · Accessibility · SEO/AEO · Security · Forensics · Cost.<br>The same lens we point at client estates — and, below, at your own device.</p>
        <a class="btn btn-primary mt-2" href="#edge" style="width:100%;justify-content:center">Audit my device now ${ICON.arrow}</a>
      </div>
    </div>
  </div>
</section>

<!-- ACT 5 ── THE SIGNATURE: LIVE EDGE MICRO-AUDIT ──────── -->
<section class="wrap" id="edge" data-act="Edge Scan">
  <div class="section-head reveal">
    <span class="kicker">04 · Something unheard of</span>
    <h2>Run a <span class="grad-text">live edge micro-audit</span> — on yourself.</h2>
    <p>A real diagnostic of <em>this</em> device and link, computed entirely in your browser. No simulation, no upload — every number is measured locally. It's a 20-second taste of how Ionity audits infrastructure.</p>
  </div>
  ${edgeBlock()}
</section>

<!-- ACT 6 ── MATRIX VISION (camera, on-device) ──────────── -->
<section class="wrap" id="vision" data-act="Vision">
  <div class="section-head reveal">
    <span class="kicker">05 · matrix vision</span>
    <h2>See yourself in <span class="grad-text">blue digits</span> — and let it <span class="warm-text">recognise</span>.</h2>
    <p>Enable your camera: Ionity renders the live view as matrix digits <em>and</em> runs on-device computer vision over it — counting people, faces and hands and recognising everyday objects, boxed live. 100% on-device; the frame is turned to glyphs and discarded, never recorded or uploaded.</p>
  </div>
  ${visionBlock()}
</section>

<!-- ACT 6b ── DEVICE-AS-SENSOR-NODE (real) ─────────────── -->
<section class="wrap" id="sensor" data-act="Sensor Node">
  <div class="section-head reveal">
    <span class="kicker">06 · Edge sensing</span>
    <h2>Turn this device into an <span class="grad-text">Ionity node</span>.</h2>
    <p>Motion, tilt, compass, ambient light and live sound — read straight from your device's real sensors. A working taste of the edge nodes we deploy in the field.</p>
  </div>
  ${sensorBlock()}
</section>

<!-- ACT 7 ── AEDi ──────────────────────────────────────── -->
<section class="wrap" id="aedi" data-act="AEDi">
  <div class="feature split">
    <div class="reveal">
      <span class="kicker">07 · Our intelligence</span>
      <h2 class="mt-1">AEDi.</h2>
      <p class="lead mt-1">Antwerp Ecosystem Designs Ionity — also read as <em>Automated Ecosystems Designs Intelligence</em>. AEDi is the in-house AI fabric we build on and with: orchestrating agents, MCP and data so that what we ship for you is genuinely native, not glued together.</p>
      <p class="mt-1">We use Claude, and we enjoy it — pairing frontier models with our own systems and hardware to deliver custom anything, B2B.</p>
    </div>
    <ul class="timeline reveal d1">
      <li><div class="yr">2018</div><h4>Antwerp Designs</h4><p>A product-design firm — the artisan, cross-discipline roots.</p></li>
      <li><div class="yr">2022+</div><h4>Ecosystems</h4><p>Designs become connected systems: sensing, edge, cloud.</p></li>
      <li><div class="yr">Now</div><h4>Ionity Global</h4><p>Native-AI for the next era — MCP, twins, audits, hardware.</p></li>
    </ul>
  </div>
</section>

<!-- ACT 8 ── FOUNDER ───────────────────────────────────── -->
<section class="wrap" id="founder" data-act="Founder">
  <div class="center reveal" style="max-width:60ch;margin-inline:auto">
    <span class="kicker" style="justify-content:center">08 · Behind it</span>
    <h2 class="mt-1">Founder-led, evidence-driven.</h2>
    <p class="lead mt-1">Ionity Global is directed and founded by ${SITE.founder}. The work — and the receipts — are public.</p>
    <div class="flex gap wrapf aic mt-2" style="justify-content:center">
      <a class="btn btn-ghost" href="${SITE.linkedin}" target="_blank" rel="noopener me">LinkedIn · in/ionity</a>
      <a class="btn btn-ghost" href="${SITE.gravatar}" target="_blank" rel="noopener me">Gravatar · ionity</a>
      <a class="btn btn-ghost" href="${SITE.github}" target="_blank" rel="noopener">GitHub · Ionity-Global</a>
    </div>
  </div>
</section>

<!-- ACT 8.5 ── LATEST (video + LinkedIn) ───────────────── -->
<section class="wrap" id="latest" data-act="Latest">
  <div class="section-head reveal">
    <span class="kicker">08 · Latest</span>
    <h2>See it <span class="grad-text">in motion</span>.</h2>
    <p>A look at what Ionity is building — it plays automatically when you reach it (muted; tap for sound). More on our LinkedIn.</p>
  </div>
  <div class="yt-embed reveal" id="ytEmbed" data-yt="mk4qoNVtKrI" role="button" tabindex="0" aria-label="Play the Ionity video">
    <div class="yt-poster"></div>
    <span class="yt-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
    <span class="yt-label">Watch · Ionity</span>
  </div>
  <div class="cta-row mt-2 reveal" style="justify-content:center">
    <a class="btn btn-primary" href="https://www.linkedin.com/feed/update/urn:li:activity:7476582605912604673" target="_blank" rel="noopener" data-sfx="coin">See the LinkedIn post ${ICON.arrow}</a>
    <a class="btn btn-ghost" href="https://www.youtube.com/watch?v=mk4qoNVtKrI" target="_blank" rel="noopener">Watch on YouTube ${ICON.arrow}</a>
  </div>
</section>

<!-- ACT 9 ── CTA ──────────────────────────────────────── -->
<section class="wrap" id="cta" data-act="Begin">
  <div class="feature center reveal">
    <span class="kicker" style="justify-content:center">09 · Your move</span>
    <h2 class="mt-1">Let's build something <span class="grad-text">unlike anything</span>.</h2>
    <p class="lead mt-1" style="margin-inline:auto;max-width:48ch">Audit, integration, a custom AI system, or hardware that thinks — tell us the problem and we'll bring the whole stack.</p>
    <div class="cta-row" style="justify-content:center;margin-top:1.6rem">
      <a class="btn btn-primary" href="contact.html">Start a project ${ICON.arrow}</a>
      <a class="btn btn-ghost" href="mailto:${SITE.email}">${SITE.email}</a>
    </div>
  </div>
</section>
`);

/* ---- reusable blocks for edge + ruview (used on index and edge.html) ---- */
function edgeBlock() {
  return `
<div class="feature split reveal">
  <div class="hud">
    <div class="hud-head"><span class="t">ionity · edge micro-audit</span><span class="pill"><span class="dot"></span> on-device</span></div>
    <div class="flex gap aic wrapf" style="justify-content:space-between">
      <div><div class="k mono" style="font-size:.6rem;letter-spacing:.2em;color:var(--faint)">EDGE READINESS</div>
        <div style="font-family:var(--f-display);font-size:3.2rem;font-weight:700;line-height:1" class="grad-text"><span id="edgeScore">··</span><span style="font-size:1rem;color:var(--faint)">/100</span></div></div>
      <button class="btn btn-primary" id="edgeRun">Run edge scan ${ICON.arrow}</button>
    </div>
    <div class="metric-grid mt-2" id="edgeMetrics"></div>
    <div class="terminal" id="edgeTerm" aria-live="polite"><div class="ln"><span class="ts">[ready]</span> press “Run edge scan” — all computation stays on this device.</div></div>
  </div>
  <div>
    <h3>What it actually measures</h3>
    <p class="mt-1">Real browser APIs and live in-browser measurements — GPU &amp; renderer, CPU threads, device memory, a compute benchmark, display refresh sampled from frame timing, measured network round-trips and throughput, battery and storage.</p>
    <p class="note mt-2">Privacy by design: nothing is transmitted. The scan reads only what your browser already exposes and times work locally. This is the honest version of a “scan” — no fabricated radar, no fake device list.</p>
  </div>
</div>`;
}

function visionBlock() {
  return `
<div class="feature split reveal">
  <div class="hud mx-hud">
    <div class="hud-head"><span class="t">ionity · vision matrix</span><span class="pill live"><span class="dot"></span> <span id="mxStatus" data-kind="idle">CAMERA OFF</span></span></div>
    <div class="mx-stage" id="mxStage" tabindex="-1">
      <video id="mxVideo" playsinline muted autoplay></video>
      <canvas id="mxCanvas" width="384" height="288" aria-label="Live matrix camera view"></canvas>
      <div class="mx-scanline" aria-hidden="true"></div>
      <div class="mx-off" id="mxOff">CAMERA OFF</div>
    </div>
    <div class="metric-grid mt-2 mx-metrics" style="grid-template-columns:repeat(3,1fr)">
      <div class="metric"><div class="k">PEOPLE</div><div class="v live" id="mxPeople">0</div></div>
      <div class="metric"><div class="k">FACES</div><div class="v live" id="mxFaces">—</div></div>
      <div class="metric"><div class="k">HANDS</div><div class="v live" id="mxHands">—</div></div>
      <div class="metric"><div class="k">OBJECTS</div><div class="v live" id="mxObjects">0</div></div>
      <div class="metric"><div class="k">PRESENCE</div><div class="v live" id="mxPresence">—</div></div>
      <div class="metric"><div class="k">MOTION</div><div class="bar"><i id="mxMotion"></i></div></div>
    </div>
    <div class="metric mx-seen mt-1" style="grid-column:1/-1"><div class="k">SEEN</div><div class="v" id="mxLabels" style="font-size:.72rem;letter-spacing:.04em">—</div></div>
  </div>
  <div>
    <h3>See the room in <span class="grad-text">matrix</span></h3>
    <p class="mt-1">Enable your camera and Ionity renders <em>you</em>, live, as a field of blue matrix digits — luminance becomes glyphs, movement lights the rain. A playful demo of the on-device vision pipeline our edge nodes run in the field.</p>
    <div class="cta-row mt-2"><button class="btn btn-primary" id="mxStart" data-sfx="powerup">Enable camera ${ICON.arrow}</button> <button class="btn btn-ghost" id="mxStop" hidden>Stop camera</button></div>
    <p class="note mt-2" id="mxNote">100% on-device: the video never leaves your browser — it's drawn straight to a canvas as digits and discarded frame by frame. Nothing is recorded or uploaded. Camera permission is asked on tap; deny it and this simply stays off.</p>
  </div>
</div>`;
}

function sensorBlock() {
  return `
<div class="feature split reveal">
  <div>
    <h3>Your browser, as an <span class="grad-text">edge sensor node</span></h3>
    <p class="mt-1">This is what an Ionity node does in the field — now in your hand. Tap to wake the real sensors on <em>this</em> device: motion, tilt &amp; compass, ambient light, and a live microphone sound meter. Readings are live and stay on-device.</p>
    <div class="cta-row mt-2"><button class="btn btn-warm" id="snStart">Activate sensors ${ICON.arrow}</button></div>
    <p class="note mt-2">On a phone you'll feel it: tilt the device and watch the horizon. Desktop exposes fewer sensors — that honesty is the point. Permissions are asked on tap.</p>
  </div>
  <div class="hud">
    <div class="hud-head"><span class="t">edge node · this device</span><span class="pill live"><span class="dot"></span> <span id="snStatus" data-kind="idle">DORMANT</span></span></div>
    <div class="sn-level"><div class="sn-horizon" id="snHorizon"></div><span class="sn-bubble" id="snBubble"></span></div>
    <div class="metric-grid mt-2">
      <div class="metric metric-graph"><div class="k">SOUND · dBFS — live spectrum<span class="v live" id="snSound" style="float:right">—</span></div><canvas class="sn-graph" id="snSoundGraph"></canvas></div>
      <div class="metric"><div class="k">MOVEMENT · m/s</div><div class="bar"><i id="snVelBar"></i></div><div class="v" id="snVel">—</div></div>
      <div class="metric"><div class="k">ACCEL · m/s²</div><div class="bar"><i id="snAccelBar"></i></div><div class="v" id="snAccel">—</div></div>
      <div class="metric"><div class="k">TILT β/γ</div><div class="bar"><i id="snTiltBar"></i></div><div class="v live" id="snTilt">—</div></div>
      <div class="metric"><div class="k">COMPASS</div><div class="bar"><i id="snHeadingBar"></i></div><div class="v live" id="snHeading">—</div></div>
      <div class="metric"><div class="k">AMBIENT LIGHT</div><div class="bar"><i id="snLightBar"></i></div><div class="v" id="snLight">—</div></div>
    </div>
  </div>
</div>`;
}

write('index.html', index);

/* ================================================================ build others === */
import('./pages.mjs').then(m => m.buildPages({ OUT, page, SITE, ICON, SERVICES, serviceCard, edgeBlock, visionBlock, sensorBlock, write })).catch(e => { console.error(e); process.exit(1); });
