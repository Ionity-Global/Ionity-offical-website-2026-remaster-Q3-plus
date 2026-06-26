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
  arrow:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
};

const SERVICES = [
  ['native-ai', ICON.ai, 'Native-AI &amp; MCP', 'We are AI-native, not AI-bolted-on. Custom MCP servers, agents, copilots and dashboards wired straight into your stack — built with Claude and our own AEDi systems.', ['Custom MCP', 'AI agents', 'Copilots', 'RAG']],
  ['aiot', ICON.iot, 'AIoT &amp; Edge', 'Sensing, inference and control at the edge. Device fleets, Wi-Fi sensing (RuView / Ionify), and low-latency intelligence that runs where the data is born.', ['Edge inference', 'Wi-Fi sensing', 'Fleets', 'Telemetry']],
  ['cloud', ICON.cloud, 'Cloud &amp; Digital Twins', 'Data plumbing that actually holds: pipelines, APIs and live digital twins that mirror your operation so decisions are made on reality, not guesswork.', ['Pipelines', 'APIs', 'Digital twins', 'Observability']],
  ['audit', ICON.audit, 'Audit &amp; Forensics', 'Evidence-first audits of websites, systems and infrastructure — surfacing risk, waste and quick wins with a clear Level-of-Effort return. Improve and save.', ['Web audits', 'Forensics', 'Cost savings', 'LoE return']],
  ['hardware', ICON.chip, 'Hardware &amp; Firmware', 'When software needs a body, we build it: PCBs, ESP32/edge nodes and firmware. Solutionists across mechanical, electrical and IT — with real artisan knowledge.', ['PCB', 'ESP32', 'Firmware', 'Mechatronics']],
  ['twins', ICON.twin, 'Custom B2B Systems', 'Custom anything: bespoke dashboards, internal tools and integrations engineered to grow with the business — and to keep paying for themselves.', ['Dashboards', 'Integrations', 'Internal tools', 'Growth']],
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
  name: SITE.legal, alternateName: 'Ionity', url: SITE.origin,
  logo: SITE.origin + '/assets/img/icon-512.png',
  email: SITE.email, slogan: SITE.tagline,
  description: SITE.desc,
  foundingDate: '2018',
  telephone: SITE.phone,
  address: { '@type': 'PostalAddress', addressLocality: 'Centurion', addressCountry: 'ZA' },
  founder: { '@type': 'Person', name: SITE.founder, sameAs: [SITE.linkedin, SITE.gravatar] },
  sameAs: [SITE.linkedin, SITE.github, SITE.gravatar],
  knowsAbout: ['Native AI', 'AIoT', 'Edge computing', 'Cloud', 'Model Context Protocol', 'Digital twins', 'Website audit', 'Digital forensics', 'Wi-Fi sensing'],
  areaServed: 'Worldwide',
};

const index = page(
  { path: 'index.html', title: 'Ionity Global — Native-AI · AIoT · Cloud · Edge · Audit', desc: SITE.desc, jsonld: indexJsonld },
  `
<!-- ACT 1 ── split-portal hero (the old "Access System / IO // WAY" concept) ── -->
<section class="hero portal-hero" id="hero" data-act="Enter">
  <div class="orbit-field" aria-hidden="true">
    <div class="ring r1"><span class="sat"></span></div>
    <div class="ring r2"><span class="sat"></span></div>
    <div class="ring r3"><span class="sat"></span></div>
  </div>

  <div class="portal-id">
    <img class="hero-wm" src="assets/img/wordmark.png" alt="Ionity Global" width="460">
    <span class="pill"><span class="dot"></span> Native-AI · AIoT · Edge · Audit · ${SITE.location} · since 2018</span>
  </div>

  <!-- CENTRE — AEDi / Access System (the focal point) -->
  <div class="portal portal-ai portal-main reveal">
    <span class="portal-kicker">AEDi</span>
    <h2>Automated Ecosystems<br>Designs Intelligence</h2>
    <button class="portal-btn portal-btn-lg" id="portalAccess" data-sfx="powerup" aria-label="Access the AEDi system">
      <span class="portal-orbit"></span>
      <span class="portal-scan"></span>
      <span class="portal-core">Access<br>System</span>
    </button>
    <p>Our own Native-AI fabric. Talk to it, brief it, let it route you through the build.</p>
  </div>

  <!-- LEFT CORNER — IO // WAY / Gateway -->
  <a class="portal-corner reveal" href="edge.html" data-sfx="coin" aria-label="Enter the IO Way gateway — live on-device edge scan">
    <span class="portal-corner-orbit" aria-hidden="true"></span>
    <span class="portal-corner-text">
      <span class="portal-kicker warm-text">IO // WAY</span>
      <span class="portal-corner-title">Enter the Gateway System</span>
      <span class="portal-corner-cue">Live edge scan ${ICON.arrow}</span>
    </span>
  </a>

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
    <div class="card reveal d2"><h3>Return-driven</h3><p>Every engagement carries a Level-of-Effort return. Systems should pay for themselves; we design them to.</p></div>
  </div>
</section>

<!-- ACT 3 ───────────────────────────────────────────── -->
<section class="wrap" id="capabilities" data-act="Capabilities">
  <div class="section-head reveal">
    <span class="kicker">02 · What we do</span>
    <h2>Six disciplines, <span class="grad-text">one stack</span>.</h2>
    <p>Clean, composable, and built to integrate. Pick one or chain them into a full digital twin of your operation.</p>
  </div>
  <div class="grid cols-3">
    ${SERVICES.map((s,i)=>serviceCard(s, 'd'+((i%3)+0))).join('')}
  </div>
  <div class="center mt-2 reveal"><a class="btn btn-ghost" href="services.html">See services in depth ${ICON.arrow}</a></div>
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
        <div><div class="n grad-text">LoE</div><div class="l">Return modelled</div></div>
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

<!-- ACT 6 ── RSSI PROXIMITY (real) ─────────────────────── -->
<section class="wrap" id="proximity" data-act="Proximity">
  <div class="section-head reveal">
    <span class="kicker">05 · RSSI proximity</span>
    <h2>How many are <span class="warm-text">nearby</span>? Ask the radio.</h2>
    <p>Real RSSI from the Bluetooth-LE advertisements around you — counted, distance-bucketed, and turned into a people-nearby estimate, live in your browser. No camera, no upload, no simulation.</p>
  </div>
  ${proximityBlock()}
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
      <a class="btn btn-ghost" href="${SITE.gravatar}" target="_blank" rel="noopener me">Gravatar · antwerpdesigns</a>
      <a class="btn btn-ghost" href="${SITE.github}" target="_blank" rel="noopener">GitHub · Ionity-Global</a>
    </div>
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

function proximityBlock() {
  return `
<div class="feature split reveal" data-endpoint="">
  <div class="hud">
    <div class="hud-head"><span class="t">ionity · rssi proximity</span><span class="pill live"><span class="dot"></span> <span id="pxStatus" data-kind="idle">READY</span></span></div>
    <div class="center">
      <div class="radar" id="pxSweep" style="opacity:.25"><div class="sweep"></div>
        <svg viewBox="0 0 100 100" fill="none" stroke="rgba(120,170,255,.25)"><circle cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="16"/><line x1="50" y1="2" x2="50" y2="98"/><line x1="2" y1="50" x2="98" y2="50"/></svg>
      </div>
      <div class="flex gap aic" style="justify-content:center;gap:2.5rem">
        <div><div style="font-family:var(--f-display);font-size:3rem;font-weight:700" class="grad-text" id="pxPeople">—</div><div class="k mono" style="font-size:.56rem;letter-spacing:.18em;color:var(--faint)">PEOPLE NEARBY (est.)</div></div>
        <div><div style="font-family:var(--f-display);font-size:3rem;font-weight:700" class="warm-text" id="pxDevices">—</div><div class="k mono" style="font-size:.56rem;letter-spacing:.18em;color:var(--faint)">RADIOS SENSED</div></div>
      </div>
      <div class="metric-grid mt-2" style="grid-template-columns:repeat(3,1fr)">
        <div class="metric"><div class="k">NEAR &lt;-60dBm</div><div class="bar"><i id="pxNear"></i></div></div>
        <div class="metric"><div class="k">MID</div><div class="bar"><i id="pxMid"></i></div></div>
        <div class="metric"><div class="k">FAR &gt;-80dBm</div><div class="bar"><i id="pxFar"></i></div></div>
      </div>
      <p class="mono mt-1" style="font-size:.62rem;color:var(--faint)">strongest signal <span id="pxBest" class="orange">—</span></p>
    </div>
  </div>
  <div>
    <h3>Count the room — from <span class="warm-text">radio</span>, not cameras</h3>
    <p class="mt-1">Tap scan and Ionity reads the <strong>real RSSI</strong> of Bluetooth-LE advertisements around you — counting unique radios, bucketing them by distance, and estimating people from near-range density. Same idea our Wi-Fi edge nodes run in the field.</p>
    <div class="cta-row mt-2"><button class="btn btn-primary" id="pxStart">Start RSSI scan ${ICON.arrow}</button></div>
    <p class="note mt-2" id="pxNote">All processing is on-device; no signal data is uploaded. Live BLE scanning needs a Chromium browser with the Web&nbsp;Bluetooth scanning capability — or connect an Ionity edge node for real RSSI from hardware.</p>
    <form id="pxForm" class="mt-2">
      <div class="field"><label for="pxEndpoint">Ionity edge node (ESP32 RSSI sniffer)</label>
      <input id="pxEndpoint" type="text" placeholder="wss://node.local:8787  or  https://…/rssi.json" autocomplete="off"></div>
      <button class="btn btn-ghost" type="submit">Connect node ${ICON.arrow}</button>
    </form>
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
      <div class="metric"><div class="k">TILT β/γ</div><div class="v live" id="snTilt">—</div></div>
      <div class="metric"><div class="k">COMPASS</div><div class="v live" id="snHeading">—</div></div>
      <div class="metric"><div class="k">ACCEL</div><div class="v" id="snAccel">—</div><div class="bar"><i id="snAccelBar"></i></div></div>
      <div class="metric"><div class="k">SOUND</div><div class="v" id="snSound">—</div><div class="bar"><i id="snSoundBar"></i></div></div>
      <div class="metric"><div class="k">AMBIENT LIGHT</div><div class="v" id="snLight">—</div></div>
    </div>
  </div>
</div>`;
}

write('index.html', index);

/* ================================================================ build others === */
import('./pages.mjs').then(m => m.buildPages({ OUT, page, SITE, ICON, SERVICES, serviceCard, edgeBlock, proximityBlock, sensorBlock, write })).catch(e => { console.error(e); process.exit(1); });
