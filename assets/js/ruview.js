/* ============================================================================
   IONITY · ruview.js — LIVE RuView edge connector  (NO SIMULATION)
   RuView turns commodity Wi-Fi (CSI) into presence / device sensing — but that
   sensing happens on Ionity HARDWARE (an ESP32/router node running the RuView
   agent), not in a web page. A browser is sandboxed and cannot scan a LAN or
   count nearby radios on its own. So this connector does the only honest thing:
     • If a real RuView node endpoint is configured/pasted AND reachable, it
       streams that node's REAL telemetry (device count, presence, motion).
     • If not, it shows a truthful "no edge node connected" state — never a
       fabricated number. Connect a node and the panel goes live.
   Endpoint protocol (what an Ionity RuView bridge should emit as JSON):
     { "devices": <int>, "presence": <0..1>, "motion": <0..1>, "rooms": <int>, "ts": <ms> }
   ========================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('ruview');
  if (!root) return;

  const statusEl = root.querySelector('#rvStatus');
  const countEl  = root.querySelector('#rvCount');
  const subEl    = root.querySelector('#rvSub');
  const form     = root.querySelector('#rvForm');
  const input    = root.querySelector('#rvEndpoint');
  const sweep    = root.querySelector('#rvSweep');
  let ws = null, poll = null;

  const setStatus = (txt, kind) => {
    if (statusEl) { statusEl.textContent = txt; statusEl.dataset.kind = kind || ''; }
  };
  const showDisconnected = (msg) => {
    setStatus('NO EDGE NODE', 'idle');
    if (countEl) countEl.textContent = '—';
    if (subEl) subEl.innerHTML = msg ||
      'No RuView node connected. This panel shows <strong>real</strong> sensing only — ' +
      'it will not invent a number. Point it at a live RuView bridge to go online.';
    if (sweep) sweep.style.opacity = '.25';
  };
  const render = (d) => {
    setStatus('● LIVE', 'live');
    if (sweep) sweep.style.opacity = '1';
    if (countEl) countEl.textContent = (typeof d.devices === 'number') ? d.devices : '—';
    const bits = [];
    if (typeof d.presence === 'number') bits.push(`presence ${(d.presence*100|0)}%`);
    if (typeof d.motion === 'number')   bits.push(`motion ${(d.motion*100|0)}%`);
    if (typeof d.rooms === 'number')    bits.push(`${d.rooms} zones`);
    if (subEl) subEl.innerHTML = `Live from RuView edge node · ${bits.join(' · ') || 'streaming'} ` +
      `<span class="muted">(${new Date(d.ts || Date.now()).toLocaleTimeString()})</span>`;
  };

  function disconnect() {
    if (ws) { try { ws.close(); } catch {} ws = null; }
    if (poll) { clearInterval(poll); poll = null; }
  }

  function connect(endpoint) {
    disconnect();
    if (!endpoint) { showDisconnected(); return; }
    setStatus('CONNECTING…', 'idle');
    const isWS = /^wss?:\/\//i.test(endpoint);
    if (isWS) {
      try {
        ws = new WebSocket(endpoint);
        const to = setTimeout(() => { if (ws && ws.readyState !== 1) { try { ws.close(); } catch {} showDisconnected('Could not reach that RuView node (timeout). Check the bridge is running and reachable.'); } }, 6000);
        ws.onopen   = () => clearTimeout(to);
        ws.onmessage= (e) => { try { render(JSON.parse(e.data)); } catch { /* ignore malformed frame */ } };
        ws.onerror  = () => { clearTimeout(to); showDisconnected('Connection error reaching that RuView node.'); };
        ws.onclose  = () => { if (statusEl && statusEl.dataset.kind === 'live') setStatus('● CLOSED', 'idle'); };
      } catch { showDisconnected('Invalid WebSocket endpoint.'); }
    } else {
      // HTTP(S) polling bridge
      const hit = async () => {
        try {
          const r = await fetch(endpoint, { cache: 'no-store' });
          if (!r.ok) throw 0;
          render(await r.json());
        } catch { showDisconnected('Could not reach that RuView HTTP bridge.'); disconnect(); }
      };
      hit(); poll = setInterval(hit, 2000);
    }
  }

  // optional preconfigured endpoint (set window.IONITY_RUVIEW_ENDPOINT or data-endpoint)
  const preset = window.IONITY_RUVIEW_ENDPOINT || root.dataset.endpoint || '';
  if (preset) { if (input) input.value = preset; connect(preset); }
  else showDisconnected();

  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ep = (input && input.value || '').trim();
    if (ep) connect(ep); else showDisconnected();
  });
})();
