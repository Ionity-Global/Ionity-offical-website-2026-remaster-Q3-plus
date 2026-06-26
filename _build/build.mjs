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
  founder: { '@type': 'Person', name: SITE.founder, sameAs: [SITE.linkedin, SITE.gravatar] },
  sameAs: [SITE.linkedin, SITE.github, SITE.gravatar],
  knowsAbout: ['Native AI', 'AIoT', 'Edge computing', 'Cloud', 'Model Context Protocol', 'Digital twins', 'Website audit', 'Digital forensics', 'Wi-Fi sensing'],
  areaServed: 'Worldwide',
};

const index = page(
  { path: 'index.html', title: 'Ionity Global — Native-AI · AIoT · Cloud · Edge · Audit', desc: SITE.desc, jsonld: indexJsonld },
  `
<!-- ACT 1 ───────────────────────────────────────────── -->
<section class="hero" id="hero" data-act="Enter">
  <div class="orbit-field" aria-hidden="true">
    <div class="ring r1"><span class="sat"></span></div>
    <div class="ring r2"><span class="sat"></span></div>
    <div class="ring r3"><span class="sat"></span></div>
  </div>
  <div class="inner">
    <span class="pill"><span class="dot"></span> Native-AI company · since 2018</span>
    <h1>We build systems that <span class="grad-text">think at the edge</span>.</h1>
    <p class="lead">Ionity Global engineers Native-AI, AIoT, Cloud &amp; Edge — and runs evidence-first audits that cut cost and prove return. Software, hardware, forensics. One team of solutionists.</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="#capabilities">Explore the build ${ICON.arrow}</a>
      <a class="btn btn-ghost" href="#edge">Run a live edge scan</a>
    </div>
    <div class="hero-stats">
      <div><div class="n grad-text">2018</div><div class="l">Roots · Antwerp Designs</div></div>
      <div><div class="n grad-text">M·E·IT</div><div class="l">Cross-discipline</div></div>
      <div><div class="n grad-text">AEDi</div><div class="l">Our own AI</div></div>
    </div>
  </div>
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

<!-- ACT 6 ── RUVIEW LIVE ───────────────────────────────── -->
<section class="wrap" id="ruview" data-act="RuView">
  <div class="section-head reveal">
    <span class="kicker">05 · Wi-Fi sensing</span>
    <h2>RuView — presence from <span class="grad-text">radio, not cameras</span>.</h2>
    <p>RuView turns commodity Wi-Fi (CSI) into presence, motion and device sensing — privately, without a single pixel of video. A browser can't do that alone, so this panel streams <strong>real</strong> data from a RuView edge node, or honestly stays dark until one is connected.</p>
  </div>
  ${ruviewBlock()}
</section>

<!-- ACT 7 ── AEDi ──────────────────────────────────────── -->
<section class="wrap" id="aedi" data-act="AEDi">
  <div class="feature split">
    <div class="reveal">
      <span class="kicker">06 · Our intelligence</span>
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
    <span class="kicker" style="justify-content:center">07 · Behind it</span>
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
    <span class="kicker" style="justify-content:center">08 · Your move</span>
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

function ruviewBlock() {
  return `
<div class="feature split reveal">
  <div class="hud">
    <div class="hud-head"><span class="t">ruview · live edge node</span><span class="pill"><span class="dot" style="background:var(--warn);box-shadow:0 0 10px var(--warn)"></span> <span id="rvStatus" data-kind="idle">NO EDGE NODE</span></span></div>
    <div class="center">
      <div class="radar" id="rvSweep" style="opacity:.25"><div class="sweep"></div>
        <svg viewBox="0 0 100 100" fill="none" stroke="rgba(120,170,255,.25)"><circle cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="16"/><line x1="50" y1="2" x2="50" y2="98"/><line x1="2" y1="50" x2="98" y2="50"/></svg>
      </div>
      <div style="font-family:var(--f-display);font-size:3.6rem;font-weight:700" class="grad-text" id="rvCount">—</div>
      <div class="k mono" style="font-size:.6rem;letter-spacing:.2em;color:var(--faint)">DEVICES SENSED</div>
      <p class="note mt-2" id="rvSub" style="text-align:left">No RuView node connected. This panel shows <strong>real</strong> sensing only — it will not invent a number.</p>
    </div>
  </div>
  <div>
    <h3>Connect a real node</h3>
    <p class="mt-1">RuView runs on an Ionity edge node (ESP32 / router CSI) that streams JSON over WebSocket or HTTP. Paste a reachable node endpoint and this panel goes live — genuinely.</p>
    <form id="rvForm" class="mt-2">
      <div class="field"><label for="rvEndpoint">RuView bridge endpoint</label>
      <input id="rvEndpoint" type="text" placeholder="wss://node.local:8787  or  https://…/ruview.json" autocomplete="off"></div>
      <button class="btn btn-ghost" type="submit">Connect live ${ICON.arrow}</button>
    </form>
    <p class="note mt-2">Expected frame: <code>{ devices, presence, motion, rooms, ts }</code>. No endpoint? The honest default is “dark”. See <a href="about.html#aedi" style="color:var(--cyan)">AEDi &amp; hardware</a>.</p>
  </div>
</div>`;
}

write('index.html', index);

/* ================================================================ build others === */
import('./pages.mjs').then(m => m.buildPages({ OUT, page, SITE, ICON, SERVICES, serviceCard, edgeBlock, ruviewBlock, write })).catch(e => { console.error(e); process.exit(1); });
