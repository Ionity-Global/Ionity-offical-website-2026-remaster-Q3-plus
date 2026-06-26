/*!
 * IonityGlitch — analog-TV / VHS RGB-tear / datamosh page-transition.
 * Self-contained vanilla module. No deps. Safe to drop in <body> as a deferred script.
 *
 * Brand tokens (2026): blue #0079E3 · deep #0A51AB · cyan #00D2FF · orange #FF9500
 *                      amber #FFB23E · live #FF2828 · bg #07080D
 *
 * Public API:
 *   window.IonityGlitch.play(durationMs?, callback?)   // run a randomized glitch burst
 *   window.IonityGlitch.config = { ... }               // tweak defaults (optional)
 *
 * Auto-wires:
 *   (a) first-paint burst when the loader dismisses (or on DOMContentLoaded fallback)
 *   (b) interstitial on same-origin internal <a> clicks → ~550ms glitch → navigate
 *
 * Honors prefers-reduced-motion (fast fade, no canvas storm).
 * Never traps navigation: any error → immediate navigate / immediate callback.
 */
(function () {
  'use strict';

  if (window.IonityGlitch && window.IonityGlitch.__ready) return; // idempotent

  /* ---------------------------------------------------------------- config */
  var CONFIG = {
    zIndex: 3000,
    firstPaintMs: 480,      // burst length on first paint
    navMs: 550,             // interstitial length between pages
    reducedFadeMs: 120,     // fade length when prefers-reduced-motion
    maxNoiseCells: 26000,   // cap on noise blocks per frame (perf guard)
    brandTintChance: 0.45   // probability a given frame is brand-tinted
  };

  /* ------------------------------------------------------- brand palette */
  var BRAND = [
    [0, 121, 227],   // #0079E3 blue
    [10, 81, 171],   // #0A51AB deep
    [0, 210, 255],   // #00D2FF cyan
    [255, 149, 0],   // #FF9500 orange
    [255, 178, 62],  // #FFB23E amber
    [255, 40, 40]    // #FF2828 live
  ];

  /* ----------------------------------------------------------- utilities */
  // Lightweight seeded-ish PRNG (mulberry32). Seed mixes performance.now()+Math.random()
  // so every run differs, but a single run is internally coherent.
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function ri(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
  function rf(rng, lo, hi) { return lo + rng() * (hi - lo); }
  // tiny global-rng helper for duration jitter (independent of frame rng)
  function rf0(lo, hi) { return lo + Math.random() * (hi - lo); }
  function reducedMotion() {
    try {
      return window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  /* ----------------------------------------------------------- internals */
  var active = false;           // a glitch is currently playing
  var rafId = 0;
  var canvas = null, ctx = null;
  var dpr = 1, cw = 0, ch = 0;  // backing-store dims (device px)
  var vw = 0, vh = 0;           // css dims

  function buildCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'ionity-glitch-canvas';
    var s = canvas.style;
    s.position = 'fixed';
    s.top = '0'; s.left = '0';
    s.width = '100%'; s.height = '100%';
    s.zIndex = String(CONFIG.zIndex);
    s.pointerEvents = 'none';
    s.display = 'block';
    s.background = '#07080D';
    ctx = canvas.getContext('2d', { alpha: true });
    sizeCanvas();
    document.body.appendChild(canvas);
  }

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap dpr for perf
    vw = window.innerWidth || document.documentElement.clientWidth || 1;
    vh = window.innerHeight || document.documentElement.clientHeight || 1;
    cw = Math.max(1, Math.floor(vw * dpr));
    ch = Math.max(1, Math.floor(vh * dpr));
    canvas.width = cw;
    canvas.height = ch;
  }

  function destroyCanvas() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null; ctx = null;
    document.body.classList.remove('glitching');
  }

  /* ---------------------------------------------------- noise frame paint */
  // Renders one randomized static frame. `t` is 0..1 progress through the burst.
  function paintFrame(rng, t) {
    var w = cw, h = ch;

    // 1) base wipe — dark brand bg
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#07080D';
    ctx.fillRect(0, 0, w, h);

    // 2) per-frame coarse noise (blocky for speed + VHS look)
    var cell = ri(rng, 2, 4) * Math.round(dpr); // pixel block size
    var cols = Math.ceil(w / cell);
    var rows = Math.ceil(h / cell);
    var density = rf(rng, 0.5, 0.92);            // fraction of cells lit
    var brandFrame = rng() < CONFIG.brandTintChance;
    var tint = BRAND[ri(rng, 0, BRAND.length - 1)];
    var budget = CONFIG.maxNoiseCells;

    ctx.save();
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        if (budget-- <= 0) { y = rows; break; }
        if (rng() > density) continue;
        var lum = ri(rng, 30, 255);
        if (brandFrame && rng() < 0.35) {
          var k = lum / 255;
          ctx.fillStyle = 'rgb(' +
            Math.round(tint[0] * k) + ',' +
            Math.round(tint[1] * k) + ',' +
            Math.round(tint[2] * k) + ')';
        } else {
          ctx.fillStyle = 'rgb(' + lum + ',' + lum + ',' + lum + ')';
        }
        ctx.globalAlpha = rf(rng, 0.35, 0.9);
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // 3) horizontal RGB-split tear bars (chromatic aberration strips)
    var bars = ri(rng, 3, 9);
    for (var b = 0; b < bars; b++) {
      var by = ri(rng, 0, h);
      var bh = ri(rng, Math.round(2 * dpr), Math.round(46 * dpr));
      var off = ri(rng, Math.round(4 * dpr), Math.round(38 * dpr));
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = rf(rng, 0.25, 0.6);
      // red strip shifted left
      ctx.fillStyle = 'rgba(255,40,40,1)';
      ctx.fillRect(-off, by, w + off, bh);
      // cyan strip shifted right
      ctx.fillStyle = 'rgba(0,210,255,1)';
      ctx.fillRect(off, by + Math.round(1 * dpr), w + off, bh);
      // occasional orange ghost
      if (rng() < 0.3) {
        ctx.fillStyle = 'rgba(255,149,0,1)';
        ctx.fillRect(Math.round(off / 2), by - Math.round(2 * dpr), w + off, bh);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // 4) block-displacement slices (datamosh) — copy a band, paste offset
    var slices = ri(rng, 0, 5);
    for (var sIdx = 0; sIdx < slices; sIdx++) {
      var sy = ri(rng, 0, h - 1);
      var sh = ri(rng, Math.round(6 * dpr), Math.round(60 * dpr));
      var sx = ri(rng, -Math.round(80 * dpr), Math.round(80 * dpr));
      sh = Math.min(sh, h - sy);
      if (sh <= 0) continue;
      try {
        ctx.drawImage(canvas, 0, sy, w, sh, sx, sy, w, sh);
      } catch (e) { /* drawImage from self can throw on zero-dim — ignore */ }
    }

    // 5) scanlines (CRT)
    ctx.globalAlpha = rf(rng, 0.08, 0.18);
    ctx.fillStyle = '#000';
    var step = Math.max(2, Math.round(3 * dpr));
    for (var ly = 0; ly < h; ly += step) {
      ctx.fillRect(0, ly, w, Math.max(1, Math.round(dpr)));
    }
    ctx.globalAlpha = 1;

    // 6) random full-frame flash (white or brand)
    if (rng() < 0.12) {
      var fc = rng() < 0.5 ? [255, 255, 255] : BRAND[ri(rng, 0, BRAND.length - 1)];
      ctx.globalAlpha = rf(rng, 0.06, 0.22);
      ctx.fillStyle = 'rgb(' + fc[0] + ',' + fc[1] + ',' + fc[2] + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // 7) ease-out: fade the whole storm toward the end of the burst
    if (t > 0.7) {
      var fade = (t - 0.7) / 0.3; // 0..1
      ctx.globalAlpha = Math.min(1, fade);
      ctx.fillStyle = '#07080D';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------- reduced-motion fade */
  function reducedFade(durationMs, done) {
    try {
      buildCanvas();
      document.body.classList.add('glitching');
      var start = performance.now();
      var dur = durationMs || CONFIG.reducedFadeMs;
      function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        ctx.clearRect(0, 0, cw, ch);
        ctx.globalAlpha = (t < 0.5 ? t * 2 : (1 - t) * 2);
        ctx.fillStyle = '#07080D';
        ctx.fillRect(0, 0, cw, ch);
        if (t < 1) { rafId = requestAnimationFrame(tick); }
        else { finish(done); }
      }
      rafId = requestAnimationFrame(tick);
    } catch (e) {
      finish(done);
    }
  }

  /* --------------------------------------------------------- finalize */
  function finish(cb) {
    active = false;
    destroyCanvas();
    if (typeof cb === 'function') {
      try { cb(); } catch (e) { /* swallow */ }
    }
  }

  /* ------------------------------------------------------------- play() */
  function play(durationMs, callback) {
    // Guard: if already playing, run the callback shortly after.
    if (active) {
      if (typeof callback === 'function') {
        setTimeout(function () { try { callback(); } catch (e) {} }, 60);
      }
      return;
    }

    // Reduced motion → fast fade, still fire callback.
    if (reducedMotion()) {
      active = true;
      reducedFade(CONFIG.reducedFadeMs, callback);
      return;
    }

    var dur = durationMs || CONFIG.navMs;
    // duration jitter so no two transitions feel identical
    dur = Math.round(dur * rf0(0.85, 1.18));

    try {
      active = true;
      var seed = (performance.now() * 1000) ^ (Math.random() * 0xffffffff);
      var rng = makeRng(seed >>> 0);

      buildCanvas();
      document.body.classList.add('glitching');

      // keep canvas sized if the viewport changes mid-burst
      var onResize = function () { if (canvas) sizeCanvas(); };
      window.addEventListener('resize', onResize, { passive: true });

      var start = performance.now();
      function loop(now) {
        var t = Math.min(1, (now - start) / dur);
        try {
          paintFrame(rng, t);
        } catch (e) {
          // a paint error must never trap navigation
          window.removeEventListener('resize', onResize);
          finish(callback);
          return;
        }
        if (t < 1) {
          rafId = requestAnimationFrame(loop);
        } else {
          window.removeEventListener('resize', onResize);
          finish(callback);
        }
      }
      rafId = requestAnimationFrame(loop);

      // hard safety timeout: never let the overlay live longer than dur + 400ms
      setTimeout(function () {
        if (active) {
          window.removeEventListener('resize', onResize);
          finish(callback);
        }
      }, dur + 400);
    } catch (e) {
      finish(callback);
    }
  }

  /* ----------------------------------------------- first-paint auto burst */
  var firstPaintDone = false;
  function firstPaintBurst() {
    if (firstPaintDone) return;
    firstPaintDone = true;
    // small async so the loader's own dismiss animation can begin
    setTimeout(function () { play(CONFIG.firstPaintMs); }, 30);
  }

  function wireFirstPaint() {
    // Prefer to fire when the loader is dismissed. The new site marks the loader
    // done by removing #loader or adding a class; watch for either, with a
    // load + hard-timeout fallback so we never miss it.
    var loader = document.getElementById('loader');

    if (loader && 'MutationObserver' in window) {
      var obs = new MutationObserver(function () {
        var hidden = !document.body.contains(loader) ||
          loader.classList.contains('done') ||
          loader.classList.contains('hidden') ||
          loader.getAttribute('aria-hidden') === 'true' ||
          getComputedStyle(loader).display === 'none' ||
          getComputedStyle(loader).opacity === '0';
        if (hidden) {
          obs.disconnect();
          firstPaintBurst();
        }
      });
      try {
        obs.observe(loader, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
        if (loader.parentNode) {
          obs.observe(loader.parentNode, { childList: true });
        }
      } catch (e) { /* fall through to fallbacks */ }
    }

    // Fallbacks: window load, then a hard timeout, guarantee the burst plays once.
    window.addEventListener('load', function () {
      setTimeout(firstPaintBurst, 250);
    });
    setTimeout(firstPaintBurst, 2600); // ultimate guarantee
  }

  /* --------------------------------------------- internal-link interception */
  function isInternalNavigable(a, ev) {
    if (!a || !a.href) return false;
    if (ev && (ev.defaultPrevented || ev.button !== 0 ||
      ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)) return false;
    if (a.target && a.target !== '' && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    if (a.getAttribute('rel') === 'external') return false;
    if (a.hasAttribute('data-no-glitch')) return false;

    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return false; }

    // same hostname only
    if (url.hostname !== location.hostname) return false;
    // only http(s) (skip mailto:, tel:, javascript:, etc.)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    // hash-only navigation on the same page → let the browser handle it
    if (url.pathname === location.pathname &&
      url.search === location.search &&
      url.hash && url.hash !== '#') return false;
    // identical URL → no-op, skip glitch
    if (url.href === location.href) return false;

    return url.href;
  }

  function onDocClick(ev) {
    try {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var dest = isInternalNavigable(a, ev);
      if (!dest) return;

      ev.preventDefault();
      play(CONFIG.navMs, function () {
        // assign at the very end so glitch fully renders before unload
        window.location.href = dest;
      });

      // ultra-safety: if the callback never fires, navigate anyway
      setTimeout(function () {
        if (window.location.href !== dest) {
          try { window.location.href = dest; } catch (e) {}
        }
      }, CONFIG.navMs + 700);
    } catch (e) {
      // never trap navigation — force-navigate as a fallback
      try {
        var a2 = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
        if (a2 && a2.href) window.location.href = a2.href;
      } catch (e2) {}
    }
  }

  function wireLinks() {
    document.addEventListener('click', onDocClick, true); // capture phase
  }

  /* ----------------------------------------------------------- bootstrap */
  function init() {
    wireFirstPaint();
    wireLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  /* ------------------------------------------------------------- export */
  window.IonityGlitch = {
    __ready: true,
    config: CONFIG,
    play: play
  };
})();