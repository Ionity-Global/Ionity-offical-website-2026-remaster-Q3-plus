/* AEDi — Automated Ecosystems Designs Intelligence
   On-site AI assistant for Ionity Global (www.ionity.today)
   Persona spec: /aedi.yaml
   IMPORTANT: API key is client-side — restrict it to ionity.today in Google AI Studio. */

(function () {
  'use strict';

  /* ── config ───────────────────────────────────────────────────────────── */
  // Access token is masked (reversed base64) so it isn't a plain string in source.
  // Restrict it to ionity.today as an HTTP-referrer in Google AI Studio for real protection.
  const _t = 'FpHSzEHcrV3M48Vb6hle4FXYpNWY0RWWk1iUopmNUVWQ5NVY6lUQ';
  const _k = () => { try { return atob(_t.split('').reverse().join('')); } catch (e) { return ''; } };

  const CFG = {
    get key() { return _k(); },
    // 1.5-flash is retired (404), 2.0-flash is quota-blocked on this key; 2.5-flash
    // is primary, 2.5-flash-lite is the fallback (separate quota). Tried in order.
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    base:  'https://generativelanguage.googleapis.com/v1beta/models/',
    maxHistory: 12,
    greeting: 'AEDi online. Ask me about Ionity, the site — or anything else (weather, news, you name it).',
  };

  // Hard rules — always enforced, even if the YAML fails to load. These keep AEDi
  // on-identity and stop the model confusing Ionity with the EV-charging network.
  const PREAMBLE = [
    'You are AEDi (Automated Ecosystems Designs Intelligence), the embedded AI of Ionity Global (Pty) Ltd. Canonical site: ionity.co.za; sister/reference site: www.ionity.today.',
    'Speak in the first person as AEDi. NEVER identify as Gemini, Google, Bard, Claude, GPT, OpenAI or "a language model". You are AEDi.',
    'CRITICAL: Ionity Global (Pty) Ltd is a South African Native-AI / AIoT / Edge / Audit company founded by Johan Wilhelm van Antwerp. It is NOT the European electric-vehicle charging network (that is a different, unrelated company). Never describe Ionity as an EV charger.',
    'You are a helpful general assistant AND Ionity\'s concierge. You MAY answer general questions — weather, news, facts, definitions — using the live web search tool you have, and give genuinely useful current answers. But Ionity stays the centre of gravity: keep it brief, and where natural, tie back to Ionity or point the visitor to the right page.',
    'For Ionity references, capabilities and services you can also point people to www.ionity.today (the reference/sister site) in addition to this site\'s own pages.',
    'When the visitor wants something on THIS site, DIRECT them with markdown links — e.g. [run a live Edge Scan](edge.html), [see our services](services.html), [start a project](contact.html). Same-site links use relative paths; ionity.today uses its full https URL.',
    'Be concise (1–3 short paragraphs), professional, direct, not sales-y. No legal/medical/financial advice — refer to ai@ionity.today.',
    'The authoritative knowledge base (identity, company, services, site map, features) follows below as YAML. Treat it as ground truth for anything about Ionity.',
    '',
    '=== AEDi KNOWLEDGE BASE (aedi.yaml) ===',
  ].join('\n');

  // Compact fallback used only if aedi.yaml can't be fetched (e.g. file:// or 404).
  const FALLBACK_CONTEXT = [
    'company: Ionity Global (Pty) Ltd — Centurion, South Africa. Founder: Johan Wilhelm van Antwerp.',
    'what_we_are: Native-AI engineering — AIoT, Cloud & Edge systems, custom MCP/agents/copilots, dashboards, digital twins, and evidence-first audits & forensics. Hardware too. Grown from Antwerp Designs (2018).',
    'pages: Home (index.html), Services (services.html), Edge Scan (edge.html), About & AEDi (about.html), Contact (contact.html).',
    'signature (real, on-device): Edge Micro-Audit, RSSI Proximity, Sensor Node — all on edge.html, no simulation.',
    'contact: ai@ionity.today | +27 64 699 9877 | Policy 986 AED.',
  ].join('\n');

  // Built once from PREAMBLE + aedi.yaml (fetched). Falls back to FALLBACK_CONTEXT.
  let SYSTEM = PREAMBLE + '\n' + FALLBACK_CONTEXT;
  let systemReady = (async () => {
    try {
      const res = await fetch('aedi.yaml', { cache: 'no-cache' });
      if (res.ok) {
        const yaml = (await res.text()).trim();
        if (yaml) SYSTEM = PREAMBLE + '\n' + yaml;
      }
    } catch (e) { /* keep fallback */ }
  })();

  /* ── state ────────────────────────────────────────────────────────────── */
  const history = [];
  let open = false;
  let busy = false;

  /* ── DOM refs (injected by layout) ───────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  let fab, panel, messages, input, sendBtn, closeBtn, statusDot;

  /* ── helpers ──────────────────────────────────────────────────────────── */
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function formatMsg(text) {
    // minimal markdown: [label](url) links, **bold**, *italic*, `code`, newlines.
    // Links are escaped first, then re-built; only safe same-site / http(s) / mail targets.
    return escHtml(text)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
        const safe = /^(https?:\/\/|mailto:|tel:|\/|[\w./#?-]+\.html|[\w./#?-]+#)/i.test(href);
        if (!safe) return label;
        const ext = /^https?:\/\//i.test(href) && !/ionity\.today/i.test(href);
        return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
      })
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function appendMsg(role, text, typing) {
    const div = document.createElement('div');
    div.className = 'aedi-msg aedi-msg--' + role + (typing ? ' aedi-typing' : '');
    if (typing) {
      div.innerHTML = '<span class="aedi-dots"><i></i><i></i><i></i></span>';
    } else {
      const bubble = document.createElement('div');
      bubble.className = 'aedi-bubble';
      bubble.innerHTML = formatMsg(text);
      div.appendChild(bubble);
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  /* ── API call ─────────────────────────────────────────────────────────── */
  async function ask(userText) {
    if (busy) return;
    busy = true;
    sendBtn.disabled = true;
    statusDot.textContent = 'Thinking…';

    history.push({ role: 'user', parts: [{ text: userText }] });
    if (history.length > CFG.maxHistory) history.splice(0, history.length - CFG.maxHistory);

    appendMsg('user', userText);
    input.value = '';

    const typingEl = appendMsg('model', '', true);

    await systemReady;   // make sure aedi.yaml context is loaded before the first call

    const body = {
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: history,
      // Live web grounding → AEDi can answer general questions (weather, news,
      // facts) with current info, while the system context keeps it Ionity-first.
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },   // 2.5-flash: skip thinking → fast, full budget for the answer
      },
    };

    // Try each model in turn; fall through on 404/429/5xx/empty so a single
    // retired or rate-limited model can't take AEDi fully offline.
    let reply = null, lastStatus = 0, rateLimited = false;
    for (const model of CFG.models) {
      try {
        const res = await fetch(`${CFG.base}${model}:generateContent?key=${CFG.key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        lastStatus = res.status;
        if (res.status === 429) { rateLimited = true; continue; }   // quota → try next model
        if (!res.ok) { console.warn('[AEDi]', model, res.status); continue; }
        const data = await res.json();
        // Join all text parts (grounded answers can span several parts).
        const text = (data?.candidates?.[0]?.content?.parts || [])
          .map(p => p.text).filter(Boolean).join('').trim();
        if (text) { reply = text; break; }
      } catch (e) {
        console.warn('[AEDi]', model, e.message);   // network error → try next
      }
    }

    typingEl.remove();
    if (reply) {
      history.push({ role: 'model', parts: [{ text: reply }] });
      appendMsg('model', reply);
    } else if (rateLimited) {
      appendMsg('model', "AEDi is handling a lot of requests right now — give it a moment and ask again. For anything urgent: ai@ionity.today.");
    } else {
      appendMsg('model', "AEDi couldn't reach the network just now. Please try again, or contact us at ai@ionity.today.");
    }
    busy = false;
    sendBtn.disabled = false;
    statusDot.textContent = 'Online';
  }

  /* ── panel toggle ─────────────────────────────────────────────────────── */
  function togglePanel(force) {
    open = typeof force === 'boolean' ? force : !open;
    panel.hidden = !open;
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    fab.setAttribute('aria-expanded', String(open));
    if (open && messages.childElementCount === 0) {
      appendMsg('model', CFG.greeting);
    }
    if (open) setTimeout(() => input.focus(), 60);
  }

  /* ── init ─────────────────────────────────────────────────────────────── */
  function init() {
    fab       = $('aediToggle');
    panel     = $('aediPanel');
    messages  = $('aediMessages');
    input     = $('aediInput');
    sendBtn   = $('aediSend');
    closeBtn  = $('aediClose');
    statusDot = $('aediStatusText');

    if (!fab) return; // widget not in DOM

    fab.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); togglePanel(false); });
    // Escape closes
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) togglePanel(false); });

    sendBtn.addEventListener('click', () => {
      const t = input.value.trim();
      if (t) ask(t);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const t = input.value.trim();
        if (t) ask(t);
      }
    });

    // close on outside click
    document.addEventListener('click', (e) => {
      if (open && !$('aediWrap').contains(e.target)) togglePanel(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
