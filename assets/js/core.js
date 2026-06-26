/* ============================================================================
   IONITY · core.js — navigation, scroll choreography, reveals, the "adventure"
   Vanilla JS. No dependencies. Progressive-enhancement first.
   ========================================================================== */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- loader ----------------------------------------------------------- */
  window.addEventListener('load', () => {
    const l = $('#loader');
    if (l) setTimeout(() => l.classList.add('done'), 350);
  });

  /* ---- nav: scrolled state + mobile menu -------------------------------- */
  const nav = $('.nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
    const p = $('#progressTop');
    if (p) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      p.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger'), links = $('#navLinks');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    $$('a', links).forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open'); burger.setAttribute('aria-expanded', false);
    }));
  }

  /* ---- reveal on scroll -------------------------------------------------- */
  const reveals = $$('.reveal');
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(el => io.observe(el));
    }
  }

  /* ---- adventure scroll-rail (active section dot) ----------------------- */
  const acts = $$('[data-act]');
  const rail = $('#scrollRail');
  if (acts.length && rail) {
    rail.innerHTML = acts.map(a =>
      `<a href="#${a.id}" data-for="${a.id}" aria-label="${a.dataset.act}"><span>${a.dataset.act}</span></a>`
    ).join('');
    const dots = $$('a', rail);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            dots.forEach(d => d.classList.toggle('active', d.dataset.for === e.target.id));
          }
        });
      }, { threshold: 0.5 });
      acts.forEach(a => io.observe(a));
    }
  }

  /* ---- count-up numbers -------------------------------------------------- */
  const counters = $$('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target, end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
        const dec = (el.dataset.count.split('.')[1] || '').length;
        let t0 = null;
        const tick = (t) => {
          if (!t0) t0 = t;
          const p = Math.min((t - t0) / 1400, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (end * eased).toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(c => io.observe(c));
  } else { counters.forEach(c => c.textContent = c.dataset.count + (c.dataset.suffix || '')); }

  /* ---- hero parallax (pointer) ------------------------------------------ */
  const orbit = $('.orbit-field');
  if (orbit && !reduce && matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', (e) => {
      const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
      orbit.style.transform = `translate(${x * 18}px, ${y * 18}px)`;
    }, { passive: true });
  }

  /* ---- year stamp -------------------------------------------------------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---- expose tiny event bus for blips ---------------------------------- */
  window.Ionity = window.Ionity || {};
  $$('a.btn, .nav-cta .btn, .icon-btn').forEach(b => {
    b.addEventListener('mouseenter', () => window.Ionity.blip && window.Ionity.blip('hover'));
    b.addEventListener('click',      () => window.Ionity.blip && window.Ionity.blip('click'));
  });
})();
