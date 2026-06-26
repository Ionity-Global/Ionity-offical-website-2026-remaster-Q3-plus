/* ============================================================================
   IONITY remaster — supporting pages
   ========================================================================== */
export function buildPages(ctx) {
  const { page, SITE, ICON, SERVICES, serviceCard, edgeBlock, proximityBlock, sensorBlock, write } = ctx;

  const crumbLd = (name, path) => ({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.origin + '/' },
      { '@type': 'ListItem', position: 2, name, item: `${SITE.origin}/${path}` },
    ],
  });

  /* ---- SERVICES (expanded, de-bulked) ---------------------------------- */
  const serviceDetail = (s) => `
<section class="wrap" id="${s[0]}" data-act="${s[2].replace(/&amp;/g,'&')}">
  <div class="feature split reveal">
    <div>
      <div class="ico" style="margin-bottom:1rem">${s[1]}</div>
      <h2>${s[2]}</h2>
      <p class="lead mt-1">${s[3]}</p>
      <div class="tag-row mt-2">${s[4].map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    </div>
    <ul class="timeline">
      ${serviceBullets(s[0]).map(b=>`<li><h4>${b.t}</h4><p>${b.d}</p></li>`).join('')}
    </ul>
  </div>
</section>`;

  function serviceBullets(id) {
    const map = {
      'native-ai': [
        { t:'Custom MCP servers', d:'Tools, resources and prompts that connect Claude and other models straight into your data and operations — safely scoped.' },
        { t:'Agents & copilots', d:'Task-running agents and in-product copilots that do real work, with guardrails and observability.' },
        { t:'AEDi-powered delivery', d:'Our own AI fabric accelerates everything we ship for you — native, not glued on.' },
      ],
      'aiot': [
        { t:'Edge inference', d:'Models that run on-device for low latency, privacy and resilience when the network drops.' },
        { t:'Wi-Fi sensing', d:'RuView & Ionify — presence, motion and vital signals from radio, no cameras.' },
        { t:'Fleet telemetry', d:'Provision, monitor and update device fleets with live dashboards.' },
      ],
      'cloud': [
        { t:'Pipelines & APIs', d:'Reliable data movement and clean interfaces that other systems can trust.' },
        { t:'Digital twins', d:'A live mirror of your operation so decisions run on reality, not guesswork.' },
        { t:'Observability', d:'Know what is happening, why, and what it costs — continuously.' },
      ],
      'audit': [
        { t:'Web & system audits', d:'Performance, accessibility, SEO/AEO, security and forensics — scored with evidence.' },
        { t:'Digital forensics', d:'Capture, preserve and interpret the trail when something matters.' },
        { t:'LoE return', d:'Every finding is ranked by effort vs. saving, so you fix what pays first.' },
      ],
      'hardware': [
        { t:'PCB & firmware', d:'From schematic to ESP32 firmware to enclosure — we build the body for the software.' },
        { t:'Mechatronics', d:'Mechanical, electrical and IT under one roof, with artisan craft.' },
        { t:'Edge nodes', d:'Sensing and compute nodes designed for the field, not the lab.' },
      ],
      'twins': [
        { t:'Bespoke dashboards', d:'Decision surfaces tailored to how your team actually works.' },
        { t:'Integrations', d:'Make your existing tools talk — cleanly, and for good.' },
        { t:'Built to grow', d:'Systems engineered to keep paying for themselves as you scale.' },
      ],
    };
    return map[id] || [];
  }

  write('services.html', page(
    { path:'services.html', title:'Services — Ionity Global', desc:'Native-AI & MCP, AIoT & Edge, Cloud & digital twins, Audit & forensics, Hardware & firmware, and custom B2B systems — engineered to integrate and to return.', jsonld: crumbLd('Services','services.html') },
    `
<section class="hero" style="min-height:60svh" data-act="Services">
  <div class="inner">
    <span class="kicker" style="justify-content:center">Capabilities</span>
    <h1 class="mt-1">Six disciplines.<br><span class="grad-text">One integrated stack.</span></h1>
    <p class="lead">Clean and composable — chosen à la carte or chained into a full digital twin. No overlap, no bloat, all return.</p>
  </div>
  <div class="scroll-hint" aria-hidden="true"><i></i><i></i></div>
</section>
<section class="wrap"><div class="grid cols-3">${SERVICES.map((s,i)=>serviceCard(s,'d'+(i%3)).replace('article','article')).join('')}</div></section>
<hr class="divider wrap">
${SERVICES.map(serviceDetail).join('')}
<section class="wrap"><div class="feature center reveal"><h2>Not sure which you need?</h2><p class="lead mt-1" style="margin-inline:auto;max-width:46ch">Start with an audit. We'll measure, then recommend only what returns.</p><div class="cta-row" style="justify-content:center;margin-top:1.4rem"><a class="btn btn-primary" href="contact.html">Book an audit ${ICON.arrow}</a><a class="btn btn-ghost" href="edge.html">Try the live scan</a></div></div></section>
`));

  /* ---- EDGE page (signature) ------------------------------------------- */
  write('edge.html', page(
    { path:'edge.html', title:'Edge Micro-Audit — live, on-device | Ionity', desc:'Run a real, on-device diagnostic of your hardware and network — measured entirely in your browser, nothing transmitted. A live taste of how Ionity audits infrastructure.', jsonld: crumbLd('Edge Micro-Audit','edge.html') },
    `
<section class="hero" style="min-height:54svh" data-act="Edge">
  <div class="inner">
    <span class="pill" style="margin-inline:auto"><span class="dot"></span> 100% on-device · no upload</span>
    <h1 class="mt-1">The <span class="grad-text">edge micro-audit</span>.</h1>
    <p class="lead">Real measurements of this device &amp; link, computed in your browser. No simulation. This is the honest, evidence-first lens Ionity brings to infrastructure — pointed, for a moment, at you.</p>
  </div>
</section>
<section class="wrap" id="edge" data-act="Run scan">${edgeBlock()}</section>
<hr class="divider wrap">
<section class="wrap" id="proximity" data-act="RSSI Proximity">
  <div class="section-head reveal"><span class="kicker">RSSI proximity</span><h2>How many are <span class="warm-text">nearby</span>?</h2><p>Real Bluetooth-LE RSSI, counted and turned into a people-nearby estimate — on-device, no upload, no simulation. Connect an Ionity edge node for hardware-grade RSSI.</p></div>
  ${proximityBlock()}
</section>
<hr class="divider wrap">
<section class="wrap" id="sensor" data-act="Sensor Node">
  <div class="section-head reveal"><span class="kicker">Edge sensing</span><h2>This device as an <span class="grad-text">Ionity node</span></h2><p>Wake the real sensors on your device — motion, tilt, compass, ambient light and live sound — the same signals our field nodes read.</p></div>
  ${sensorBlock()}
</section>
`));

  /* ---- ABOUT ----------------------------------------------------------- */
  write('about.html', page(
    { path:'about.html', title:'About & AEDi — Ionity Global', desc:'From Antwerp Designs (2018) to Ionity Global — a Native-AI company of solutionists across mechanical, electrical and IT. Meet AEDi, our AI fabric, and the founder.', jsonld: crumbLd('About','about.html') },
    `
<section class="hero" style="min-height:56svh" data-act="About">
  <div class="inner">
    <span class="kicker" style="justify-content:center">Who we are</span>
    <h1 class="mt-1">Designers who learned to make things <span class="grad-text">think</span>.</h1>
    <p class="lead">Ionity Global grew from Antwerp Designs — a product-design firm since 2018. Today we serve the next era: Native-AI, AIoT, custom MCP, dashboards, digital twins, and the hardware to ground them.</p>
  </div>
  <div class="scroll-hint" aria-hidden="true"><i></i><i></i></div>
</section>

<section class="wrap" data-act="Story">
  <div class="feature split">
    <div class="reveal"><span class="kicker">The arc</span><h2 class="mt-1">A studio that became a system.</h2>
      <p class="lead mt-1">We started by designing products. We kept being asked to make them smarter, connected, measurable — so we grew into ecosystems: sensing at the edge, intelligence in the cloud, and audits to keep it all honest.</p>
      <p class="mt-1">We're solutionists. The same team will design a mechanism, lay out a PCB, write the firmware, train the model and ship the dashboard — with real artisan knowledge across mechanical, electrical and IT.</p>
    </div>
    <ul class="timeline reveal d1">
      <li><div class="yr">2018</div><h4>Antwerp Designs</h4><p>Product design firm — the craft foundation.</p></li>
      <li><div class="yr">2022+</div><h4>Connected ecosystems</h4><p>Designs gain sensing, edge and cloud.</p></li>
      <li><div class="yr">Today</div><h4>Ionity Global (Pty) Ltd</h4><p>A Native-AI company building &amp; auditing for the next era.</p></li>
    </ul>
  </div>
</section>

<section class="wrap" id="aedi" data-act="AEDi">
  <div class="section-head reveal"><span class="kicker">Our intelligence</span><h2>AEDi — the fabric we build on.</h2>
  <p class="lead">Antwerp Ecosystem Designs Ionity · also <em>Automated Ecosystems Designs Intelligence</em>. AEDi orchestrates agents, MCP and data so what we deliver is native by construction. We use Claude, and we enjoy it.</p></div>
  <div class="grid cols-3">
    <div class="card reveal"><h3>Native-AI delivery</h3><p>Models, agents and tools wired in from day one — not bolted on later.</p></div>
    <div class="card reveal d1"><h3>Hardware-aware</h3><p>AEDi reaches the edge: it knows about the devices, because we built them.</p></div>
    <div class="card reveal d2"><h3>Evidence-first</h3><p>Audit and forensics thinking baked into every system we ship.</p></div>
  </div>
</section>

<section class="wrap" id="founder" data-act="Founder">
  <div class="feature center reveal" style="max-width:60ch;margin-inline:auto">
    <span class="kicker" style="justify-content:center">Founder</span>
    <h2 class="mt-1">${SITE.founder}</h2>
    <p class="lead mt-1">Director &amp; Founder, ${SITE.legal}. Building Native-AI, AIoT and audit practice — hands-on across disciplines.</p>
    <div class="flex gap wrapf aic mt-2" style="justify-content:center">
      <a class="btn btn-ghost" href="${SITE.linkedin}" target="_blank" rel="noopener me">LinkedIn · in/ionity</a>
      <a class="btn btn-ghost" href="${SITE.gravatar}" target="_blank" rel="noopener me">Gravatar · antwerpdesigns</a>
    </div>
  </div>
</section>
`));

  /* ---- CONTACT --------------------------------------------------------- */
  write('contact.html', page(
    { path:'contact.html', title:'Contact — Ionity Global', desc:'Start a project with Ionity Global — Native-AI, AIoT, Cloud, Edge, hardware, audits and forensics. Tell us the problem; we bring the whole stack.', jsonld: {
      '@context':'https://schema.org','@type':'ContactPage', name:'Contact Ionity Global', url:SITE.origin+'/contact.html',
      mainEntity:{ '@type':'Organization', name:SITE.legal, email:SITE.email, url:SITE.origin } } },
    `
<section class="hero" style="min-height:52svh" data-act="Contact">
  <div class="inner">
    <span class="kicker" style="justify-content:center">Your move</span>
    <h1 class="mt-1">Let's build something <span class="grad-text">unlike anything</span>.</h1>
    <p class="lead">An audit, an integration, a custom AI system, or hardware that thinks. Send the problem.</p>
  </div>
</section>
<section class="wrap" data-act="Reach us">
  <div class="feature split">
    <form class="reveal" action="mailto:${SITE.email}" method="post" enctype="text/plain" id="contactForm">
      <div class="field"><label for="cf-name">Name</label><input id="cf-name" name="name" required></div>
      <div class="field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" required></div>
      <div class="field"><label for="cf-topic">Interested in</label>
        <select id="cf-topic" name="topic">
          <option>Audit &amp; forensics</option><option>Native-AI &amp; MCP</option><option>AIoT &amp; Edge</option>
          <option>Cloud &amp; digital twins</option><option>Hardware &amp; firmware</option><option>Custom B2B system</option>
        </select></div>
      <div class="field"><label for="cf-msg">Your problem, briefly</label><textarea id="cf-msg" name="message" required></textarea></div>
      <button class="btn btn-primary" type="submit">Send ${ICON.arrow}</button>
      <p class="note mt-2">This form opens your mail client (no third-party tracker). Prefer direct? <a href="mailto:${SITE.email}" style="color:var(--cyan)">${SITE.email}</a></p>
    </form>
    <div class="reveal d1">
      <div class="hud">
        <div class="hud-head"><span class="t">direct lines</span><span class="pill"><span class="dot"></span> open</span></div>
        <div class="metric-grid">
          <div class="metric"><div class="k">EMAIL</div><div class="v" style="font-size:.95rem">${SITE.email}</div></div>
          <div class="metric"><div class="k">PHONE</div><div class="v" style="font-size:.95rem">${SITE.phone}</div></div>
          <div class="metric"><div class="k">BASED IN</div><div class="v" style="font-size:.95rem">${SITE.location}</div></div>
          <div class="metric"><div class="k">GITHUB</div><div class="v" style="font-size:.95rem">Ionity-Global</div></div>
          <div class="metric"><div class="k">FOUNDER</div><div class="v" style="font-size:.95rem">in/ionity</div></div>
          <div class="metric"><div class="k">WEB</div><div class="v" style="font-size:.95rem">ionity.co.za</div></div>
        </div>
        <p class="note mt-2">${SITE.legal} · ${SITE.policy}. We reply fast and start with evidence.</p>
      </div>
    </div>
  </div>
</section>
`));

  /* ---- LEGAL: privacy + terms ----------------------------------------- */
  const legalShell = (title, kicker, body, path) => page(
    { path, title:`${title} — Ionity Global`, desc:`${title} for ${SITE.legal} (${SITE.origin}).`, jsonld: crumbLd(title, path) },
    `<section class="hero" style="min-height:40svh"><div class="inner"><span class="kicker" style="justify-content:center">${kicker}</span><h1 class="mt-1">${title}</h1><p class="lead">Last updated <span data-year>2026</span> · ${SITE.legal} · ${SITE.policy}</p></div></section>
     <section class="wrap"><div class="feature reveal" style="max-width:75ch;margin-inline:auto">${body}</div></section>`);

  const lp = (h, p) => `<h3 style="margin-top:1.6rem">${h}</h3><p class="mt-1">${p}</p>`;

  write('privacy.html', legalShell('Privacy Notice', 'Trust', `
    <p class="lead">We collect as little as possible, are honest about what we do, and never sell your data. This notice explains it plainly.</p>
    ${lp('What we store on your device', 'A single strictly-necessary cookie (<code>ionity_consent</code>) records your cookie choice for 180 days. Optional categories (preferences, analytics, marketing) stay <strong>off</strong> until you switch them on. Manage anytime via <a href="#" data-cookie-open style="color:var(--cyan)">Cookie settings</a>.')}
    ${lp('The edge micro-audit', 'Our on-device scan reads only what your browser exposes (GPU, cores, memory, network timings, etc.) and computes locally. <strong>None of it is transmitted to us</strong> — there is no server endpoint receiving it.')}
    ${lp('RuView', 'If you connect a RuView endpoint, your browser talks directly to that node; we do not proxy or store its data.')}
    ${lp('Contact form', 'The contact form opens your own email client. We only receive what you choose to send to '+SITE.email+'.')}
    ${lp('Fonts & assets', 'Web fonts load from Google Fonts (which sets no cookies). Everything else is served from this domain.')}
    ${lp('Your rights', 'Access, correction, deletion and objection — email '+SITE.email+'. We align with GDPR/POPIA principles under '+SITE.policy+'.')}`,
    'privacy.html'));

  write('terms.html', legalShell('Terms of Use', 'Trust', `
    <p class="lead">Friendly, plain terms for using this website. Engagement contracts are separate and bespoke.</p>
    ${lp('Use of this site', 'You may browse, learn and contact us. Do not abuse the site, the edge scan, or the RuView connector, and do not use them against systems you do not own or are not authorised to test.')}
    ${lp('No warranty', 'Content and the edge micro-audit are provided “as is” for information. Measurements are best-effort and browser-dependent.')}
    ${lp('Intellectual property', '© '+new Date().getFullYear()+' '+SITE.legal+'. Brand, code and content are ours unless noted. Open-source components remain under their own licenses — see our '+'<a href="'+SITE.github+'" style="color:var(--cyan)">GitHub</a>.')}
    ${lp('Contact', 'Questions about these terms: '+SITE.email+'.')}`,
    'terms.html'));

  /* ---- 404 ------------------------------------------------------------- */
  write('404.html', page(
    { path:'404.html', title:'Lost at the edge — 404 | Ionity', desc:'That page drifted off the grid.' },
    `<section class="hero"><div class="orbit-field" aria-hidden="true"><div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div></div>
      <div class="inner"><span class="kicker" style="justify-content:center">404 · signal lost</span>
      <h1 class="mt-1">You drifted <span class="grad-text">off the grid</span>.</h1>
      <p class="lead">That node doesn't exist — but everything else is still humming.</p>
      <div class="cta-row" style="justify-content:center"><a class="btn btn-primary" href="index.html">Back to base ${ICON.arrow}</a><a class="btn btn-ghost" href="edge.html">Run an edge scan</a></div></div>
    </section>`));

  console.log('All pages built.');
}
