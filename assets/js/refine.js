/* ============================================================================
   IONITY · refine.js — v19.2 smoothing layer (2026-10-03)
   Small, dependency-free progressive enhancements that sit on top of core.js:
   · spotlight: cards light up where the pointer is (CSS vars --mx / --my)
   · grid stagger: reveal children of a grid cascade instead of popping at once
   · inline videos: play only while on screen (battery / CPU friendly)
   · contact: ?service=… pre-selects the matching topic in the form
   Everything degrades silently; reduced-motion is respected.
   ========================================================================== */
(() => {
  'use strict';
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;

  /* ---- spotlight cards ---------------------------------------------------- */
  if (fine && !reduce) {
    const sel = '.card, .free-card, .mini, .pillar-list li';
    let raf = 0, last = null;
    document.addEventListener('pointermove', (e) => {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = last.target && last.target.closest ? last.target.closest(sel) : null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((last.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((last.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  /* ---- grid stagger: children of a grid that have .reveal but no delay ----- */
  if (!reduce) {
    $$('.grid, .free-grid, .mini-grid, .flow, .duo').forEach(g => {
      let i = 0;
      [...g.children].forEach(ch => {
        if (!ch.classList.contains('reveal')) return;
        if (/\bd[0-9]\b/.test(ch.className)) return;           // author already staggered it
        ch.style.transitionDelay = (Math.min(i, 6) * 0.07).toFixed(2) + 's';
        i++;
      });
    });
  }

  /* ---- inline videos: play on screen, pause off screen -------------------- */
  const vids = $$('video[data-autopause]');
  if (vids.length) {
    vids.forEach(v => { v.muted = true; v.playsInline = true; });
    if (reduce) {
      vids.forEach(v => { v.removeAttribute('autoplay'); v.pause && v.pause(); });
    } else if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          const v = e.target;
          if (e.isIntersecting) { const p = v.play && v.play(); if (p && p.catch) p.catch(() => {}); }
          else { v.pause && v.pause(); }
        });
      }, { threshold: 0.2 });
      vids.forEach(v => io.observe(v));
    }
  }

  /* ---- contact: ?service=<id> pre-selects the topic ----------------------- */
  const topic = document.getElementById('cf-topic');
  if (topic) {
    const svc = new URLSearchParams(location.search).get('service');
    if (svc) {
      const opt = [...topic.options].find(o => (o.dataset.svc || '').split(' ').includes(svc));
      if (opt) {
        topic.value = opt.value;
        topic.classList.add('preset');
        setTimeout(() => topic.classList.remove('preset'), 2400);
      }
    }
  }
})();

/* ---- any [data-aedi-open] control launches the AEDi assistant ------------ */
document.addEventListener('click', (e) => {
  const t = e.target && e.target.closest ? e.target.closest('[data-aedi-open]') : null;
  if (!t) return;
  e.preventDefault();
  e.stopPropagation();
  const fab = document.getElementById('aediToggle');
  if (fab && fab.getAttribute('aria-expanded') !== 'true') fab.click();
}, true);
