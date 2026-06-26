/* ============================================================================
   IONITY · proximity.js — LIVE RSSI PROXIMITY  ·  "how many are nearby?"
   REAL RSSI, NO SIMULATION. Three honest sources, in order of availability:
     1. Web Bluetooth LE scanning (navigator.bluetooth.requestLEScan) — reads
        the REAL rssi (dBm) of every BLE advertisement around you, counts unique
        devices, buckets them by distance and estimates people from device density.
     2. An Ionity edge node (ESP32 Wi-Fi promiscuous sniffer) streaming real RSSI
        over WebSocket/HTTP — set window.IONITY_RSSI_ENDPOINT or paste one.
     3. If neither is available, it says so plainly. It never invents a number.
   ========================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('proximity');
  if (!root) return;

  const $ = (s) => root.querySelector(s);
  const startBtn = $('#pxStart');
  const statusEl = $('#pxStatus');
  const peopleEl = $('#pxPeople');
  const devEl    = $('#pxDevices');
  const bestEl   = $('#pxBest');
  const bars     = { near: $('#pxNear>i'), mid: $('#pxMid>i'), far: $('#pxFar>i') };
  const noteEl   = $('#pxNote');
  const form     = $('#pxForm');
  const input    = $('#pxEndpoint');
  const sweep    = $('#pxSweep');

  const devices = new Map();   // id -> { rssi, ts }
  let scan = null, ticker = null, ws = null, poll = null, live = false;

  const setStatus = (t, kind) => { if (statusEl) { statusEl.textContent = t; statusEl.dataset.kind = kind || ''; } };
  const bucketOf = (rssi) => rssi >= -60 ? 'near' : rssi >= -80 ? 'mid' : 'far';

  function recompute() {
    const nowt = performance.now();
    for (const [id, d] of devices) if (nowt - d.ts > 12000) devices.delete(id); // forget stale (>12s)
    const counts = { near: 0, mid: 0, far: 0 };
    let best = -127;
    for (const d of devices.values()) { counts[bucketOf(d.rssi)]++; if (d.rssi > best) best = d.rssi; }
    const total = devices.size;
    // honest, stated heuristic: most people carry ~1 advertising radio in near/mid range.
    const people = Math.max(counts.near + Math.round(counts.mid * 0.6), total ? 1 : 0);
    devEl && (devEl.textContent = total);
    peopleEl && (peopleEl.textContent = people);
    bestEl && (bestEl.textContent = total ? best + ' dBm' : '—');
    const max = Math.max(1, total);
    bars.near && (bars.near.style.width = counts.near / max * 100 + '%');
    bars.mid  && (bars.mid.style.width  = counts.mid  / max * 100 + '%');
    bars.far  && (bars.far.style.width  = counts.far  / max * 100 + '%');
    if (sweep) sweep.style.opacity = live ? '1' : '.25';
  }

  /* ---- source 1: Web Bluetooth LE scan (real rssi) ---------------------- */
  async function startBLE() {
    if (!(navigator.bluetooth && navigator.bluetooth.requestLEScan)) return false;
    try {
      navigator.bluetooth.addEventListener('advertisementreceived', (e) => {
        const id = e.device && (e.device.id || e.device.name) || Math.random().toString(36);
        if (typeof e.rssi === 'number') devices.set(id, { rssi: e.rssi, ts: performance.now() });
      });
      scan = await navigator.bluetooth.requestLEScan({ acceptAllAdvertisements: true });
      live = true;
      setStatus('● LIVE · BLE RSSI', 'live');
      noteEl && (noteEl.innerHTML = 'Reading <strong>real</strong> Bluetooth-LE advertisement RSSI around you. Counts unique radios; people are estimated from near/mid-range device density. Nothing is uploaded.');
      ticker = setInterval(recompute, 1000);
      window.Ionity && window.Ionity.blip && window.Ionity.blip('ok');
      return true;
    } catch (err) {
      setStatus('PERMISSION / UNSUPPORTED', 'idle');
      noteEl && (noteEl.innerHTML = `Bluetooth scan was blocked (${(err && err.name) || 'denied'}). It needs a Chromium browser with the experimental <em>Web Bluetooth scanning</em> capability and your permission. You can still connect an Ionity edge node below.`);
      return false;
    }
  }

  /* ---- source 2: Ionity edge node (real RSSI from hardware) ------------- */
  function connectNode(ep) {
    if (!ep) return;
    setStatus('CONNECTING…', 'idle');
    const ingest = (d) => {
      if (Array.isArray(d.devices)) { devices.clear(); d.devices.forEach((x, i) => { if (typeof x.rssi === 'number') devices.set(x.id || ('n' + i), { rssi: x.rssi, ts: performance.now() }); }); }
      if (typeof d.people === 'number' && peopleEl) peopleEl.textContent = d.people; // node may pre-compute
      live = true; setStatus('● LIVE · EDGE NODE', 'live'); recompute();
    };
    if (/^wss?:\/\//i.test(ep)) {
      try {
        ws = new WebSocket(ep);
        const to = setTimeout(() => { if (ws && ws.readyState !== 1) { try { ws.close(); } catch {} setStatus('NODE UNREACHABLE', 'idle'); } }, 6000);
        ws.onopen = () => clearTimeout(to);
        ws.onmessage = (e) => { try { ingest(JSON.parse(e.data)); } catch {} };
        ws.onerror = () => { clearTimeout(to); setStatus('NODE ERROR', 'idle'); };
      } catch { setStatus('BAD ENDPOINT', 'idle'); }
    } else {
      const hit = async () => { try { const r = await fetch(ep, { cache: 'no-store' }); ingest(await r.json()); } catch { setStatus('NODE UNREACHABLE', 'idle'); clearInterval(poll); } };
      hit(); poll = setInterval(hit, 2000);
    }
  }

  async function start() {
    startBtn && (startBtn.disabled = true, startBtn.textContent = 'Scanning…');
    const ok = await startBLE();
    if (!ok && (window.IONITY_RSSI_ENDPOINT || (input && input.value))) connectNode(window.IONITY_RSSI_ENDPOINT || input.value.trim());
    startBtn && (startBtn.disabled = false, startBtn.textContent = ok ? 'Scanning live…' : 'Retry BLE scan');
  }

  startBtn && startBtn.addEventListener('click', start);
  form && form.addEventListener('submit', (e) => { e.preventDefault(); const ep = (input && input.value || '').trim(); if (ep) connectNode(ep); });

  // capability hint up front (honest)
  if (!(navigator.bluetooth && navigator.bluetooth.requestLEScan)) {
    setStatus('BLE SCAN UNSUPPORTED', 'idle');
    noteEl && (noteEl.innerHTML = 'This browser does not expose live Bluetooth-LE scanning, so a page alone cannot read nearby RSSI here. Use Chrome/Edge with the <em>Web Bluetooth scanning</em> flag, or connect an Ionity edge node (ESP32 Wi-Fi sniffer) below for real RSSI from hardware.');
  } else {
    setStatus('READY · BLE AVAILABLE', 'idle');
  }
  const preset = window.IONITY_RSSI_ENDPOINT || root.dataset.endpoint || '';
  if (preset) { if (input) input.value = preset; connectNode(preset); }

  window.addEventListener('beforeunload', () => { try { scan && scan.stop && scan.stop(); } catch {}; clearInterval(ticker); clearInterval(poll); ws && ws.close(); });
})();
