/* ============================================================================
   IONITY · edge-diagnostics.js  —  THE EDGE MICRO-AUDIT
   A live, on-device diagnostic that demonstrates Ionity's Audit + Edge craft.
   PRINCIPLE: 100% REAL, MEASURED DATA. NO SIMULATION. NOTHING LEAVES THE DEVICE.
   Every number below is read from a real browser API or measured in-browser.
   ========================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('edge');
  if (!root) return;

  const term   = root.querySelector('#edgeTerm');
  const metrics= root.querySelector('#edgeMetrics');
  const runBtn = root.querySelector('#edgeRun');
  const scoreEl= root.querySelector('#edgeScore');
  let running = false;

  const now = () => (performance.now()).toFixed(0);
  const T = (cls = '') => `<span class="ts">[${(performance.now()/1000).toFixed(2)}s]</span> `;

  function log(msg, cls = '') {
    if (!term) return;
    const line = document.createElement('div');
    line.className = 'ln';
    line.innerHTML = T() + `<span class="${cls}">${msg}</span>`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  }
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function setMetric(key, value, live = false, pct = null) {
    if (!metrics) return;
    let el = metrics.querySelector(`[data-k="${key}"]`);
    if (!el) {
      el = document.createElement('div');
      el.className = 'metric';
      el.dataset.k = key;
      el.innerHTML = `<div class="k">${key}</div><div class="v${live ? ' live' : ''}">—</div>` +
        (pct !== null ? `<div class="bar"><i></i></div>` : '');
      metrics.appendChild(el);
    }
    el.querySelector('.v').textContent = value;
    if (pct !== null) { const bar = el.querySelector('.bar > i'); if (bar) requestAnimationFrame(() => bar.style.width = Math.max(2, Math.min(100, pct)) + '%'); }
  }

  /* ---- REAL probes ------------------------------------------------------- */
  function gpuInfo() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return { renderer: 'No WebGL', vendor: '—' };
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const vendor   = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)   : gl.getParameter(gl.VENDOR);
      return { renderer, vendor };
    } catch { return { renderer: 'Unavailable', vendor: '—' }; }
  }

  function measureRefresh() {                       // measured from real frame timing
    return new Promise(res => {
      let n = 0, last = performance.now(), sum = 0;
      const step = (t) => { const d = t - last; last = t; if (n > 1) sum += d; if (++n < 60) requestAnimationFrame(step); else res(Math.round(1000 / (sum / (n - 2)))); };
      requestAnimationFrame(step);
    });
  }

  async function measureRTT() {                     // real round trips to same-origin
    const url = (loc => loc.origin + '/assets/img/favicon.ico')(window.location);
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      try { await fetch(url + '?_=' + t0, { cache: 'no-store' }); samples.push(performance.now() - t0); } catch {}
      await sleep(60);
    }
    if (!samples.length) return null;
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)];   // median ms
  }

  async function measureThroughput() {              // real bytes / real time
    const url = window.location.origin + '/assets/og/social-card.png';
    try {
      const t0 = performance.now();
      const r = await fetch(url + '?_=' + t0, { cache: 'no-store' });
      const buf = await r.arrayBuffer();
      const sec = (performance.now() - t0) / 1000;
      const mbps = (buf.byteLength * 8) / sec / 1e6;
      return { mbps, bytes: buf.byteLength };
    } catch { return null; }
  }

  function benchmark() {                             // real compute work, measured
    const t0 = performance.now();
    let acc = 0; const N = 6e6;
    for (let i = 0; i < N; i++) acc += Math.sqrt(i) * Math.sin(i) % 7;
    const ms = performance.now() - t0;
    // ops/sec, real
    return { ms, mops: (N / ms / 1000).toFixed(2), acc };
  }

  async function storageInfo() {
    try { if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); return e; } } catch {}
    return null;
  }

  async function batteryInfo() {
    try { if (navigator.getBattery) return await navigator.getBattery(); } catch {}
    return null;
  }

  /* ---- the scan --------------------------------------------------------- */
  async function run() {
    if (running) return;
    running = true; runBtn && (runBtn.disabled = true, runBtn.textContent = 'Scanning…');
    if (term) term.innerHTML = '';
    if (metrics) metrics.innerHTML = '';
    if (scoreEl) scoreEl.textContent = '··';

    log('IONITY EDGE MICRO-AUDIT — initialising local probe', 'ok');
    log('privacy: all computation is on-device; no telemetry is transmitted.', 'warn');
    await sleep(250);

    // --- compute / hardware ---
    const cores = navigator.hardwareConcurrency || null;
    const mem   = navigator.deviceMemory || null;
    log(`probing compute fabric…`);
    setMetric('CPU THREADS', cores ? cores + ' logical' : 'restricted', false, cores ? cores / 32 * 100 : null);
    setMetric('DEVICE MEMORY', mem ? '≈ ' + mem + ' GB' : 'restricted', false, mem ? mem / 16 * 100 : null);
    await sleep(180);

    const g = gpuInfo();
    log(`GPU → ${g.renderer}`, 'ok');
    setMetric('GPU RENDERER', g.renderer);
    setMetric('GPU VENDOR', g.vendor);
    setMetric('WEBGPU', ('gpu' in navigator) ? 'available' : 'not exposed', ('gpu' in navigator));
    await sleep(180);

    // --- display ---
    log('measuring display refresh from frame cadence…');
    const hz = await measureRefresh();
    setMetric('DISPLAY', `${screen.width}×${screen.height} @${window.devicePixelRatio}x`);
    setMetric('REFRESH RATE', hz + ' Hz (measured)', true, hz / 144 * 100);
    log(`refresh ≈ ${hz} Hz · depth ${screen.colorDepth}-bit`, 'ok');
    await sleep(150);

    // --- compute benchmark ---
    log('running on-device compute benchmark (6M ops)…');
    const b = benchmark();
    setMetric('COMPUTE', b.mops + ' Mops/s', true, Math.min(100, b.mops / 8 * 100));
    setMetric('BENCH TIME', b.ms.toFixed(1) + ' ms');
    log(`benchmark complete in ${b.ms.toFixed(1)} ms → ${b.mops} Mops/s`, 'ok');
    await sleep(120);

    // --- network (REAL measurements) ---
    const conn = navigator.connection || navigator.webkitConnection;
    if (conn) {
      setMetric('LINK TYPE', (conn.effectiveType || '—').toUpperCase() + (conn.saveData ? ' · data-saver' : ''));
      if (conn.downlink) setMetric('LINK DOWNLINK', conn.downlink + ' Mb/s (hint)');
    }
    log('measuring edge latency (5 real round-trips)…');
    const rtt = await measureRTT();
    if (rtt != null) { setMetric('EDGE RTT', rtt.toFixed(1) + ' ms', true, Math.max(2, 100 - rtt)); log(`median RTT ${rtt.toFixed(1)} ms`, 'ok'); }
    else { setMetric('EDGE RTT', 'blocked'); log('RTT probe blocked by environment', 'warn'); }

    log('measuring real throughput…');
    const tp = await measureThroughput();
    if (tp) { setMetric('THROUGHPUT', tp.mbps.toFixed(1) + ' Mb/s', true, Math.min(100, tp.mbps)); log(`downloaded ${(tp.bytes/1024).toFixed(0)} KB → ${tp.mbps.toFixed(1)} Mb/s`, 'ok'); }

    // --- environment ---
    const uad = navigator.userAgentData;
    setMetric('PLATFORM', (uad && uad.platform) || navigator.platform || '—');
    setMetric('LANGUAGES', (navigator.languages || [navigator.language]).slice(0,3).join(', '));
    setMetric('CORES×THREADS', (cores || '?') + ' · ' + (uad?.mobile ? 'mobile' : 'desktop'));
    setMetric('TIMEZONE', Intl.DateTimeFormat().resolvedOptions().timeZone || '—');

    const bat = await batteryInfo();
    if (bat) { setMetric('BATTERY', Math.round(bat.level * 100) + '%' + (bat.charging ? ' ⚡' : ''), true, bat.level * 100); log(`battery ${Math.round(bat.level*100)}% ${bat.charging ? '(charging)' : ''}`); }

    const st = await storageInfo();
    if (st && st.quota) setMetric('STORAGE QUOTA', (st.quota / 1073741824).toFixed(1) + ' GB');

    // --- a single honest composite "edge score" from real signals --------
    let score = 0, parts = 0;
    if (cores) { score += Math.min(100, cores / 16 * 100); parts++; }
    if (mem)   { score += Math.min(100, mem / 8 * 100); parts++; }
    score += Math.min(100, b.mops / 6 * 100); parts++;
    if (rtt != null) { score += Math.max(0, 100 - rtt); parts++; }
    if (hz) { score += Math.min(100, hz / 120 * 100); parts++; }
    const final = Math.round(score / parts);
    if (scoreEl) {
      let v = 0; const tick = () => { v += Math.ceil((final - v) / 6) || 1; scoreEl.textContent = Math.min(v, final); if (v < final) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    log(`composite EDGE READINESS index → ${final}/100 (derived from measured signals)`, 'ok');
    log('audit complete. this is the same evidence-first lens Ionity applies to', '');
    log('client infrastructure — only at scale, with consent, across your estate.', 'ok');
    window.Ionity && window.Ionity.blip && window.Ionity.blip('ok');

    running = false; runBtn && (runBtn.disabled = false, runBtn.textContent = 'Re-run edge scan');
  }

  runBtn && runBtn.addEventListener('click', run);
})();
