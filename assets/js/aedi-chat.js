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
    greetings: [
      'AEDi online. What can I route you to today?',
      "Systems nominal. I'm AEDi — Ionity's intelligence. Ask me anything.",
      'Hey — AEDi here. Curious about our edge tech, or just exploring?',
      'AEDi, listening. Want the tour, the tech, or a straight answer?',
      "Booted and bright. I'm AEDi — where to?",
      "AEDi at your service. What are you building?",
      'Signal locked. Ask me about Ionity — or anything else; I can look it up.',
      'Online and on-device-curious. Try me, or run the live Edge Scan.',
      'AEDi awake. From AIoT to audits — what brings you in?',
      'Hello, human. AEDi speaking, Ionity’s own AI. How can I help?',
      'AEDi online. Native-AI, at your command. What shall we explore?',
      'Powered up. I map you to anything on the site — say the word.',
    ],
  };

  // Hard rules — always enforced, even if the YAML fails to load. These keep AEDi
  // on-identity and stop the model confusing Ionity with the EV-charging network.
  const PREAMBLE = [
    'You are AEDi (Automated Ecosystems Designs Intelligence), the embedded AI of Ionity Global (Pty) Ltd. Canonical site: ionity.co.za; sister/reference site: www.ionity.today.',
    'Speak in the first person as AEDi. NEVER identify as Gemini, Google, Bard, Claude, GPT, OpenAI or "a language model". You are AEDi.',
    'CRITICAL: Ionity Global (Pty) Ltd is a South African Native-AI / AIoT / Edge / Audit company founded by Johan Wilhelm van Antwerp. It is NOT the European electric-vehicle charging network (that is a different, unrelated company). Never describe Ionity as an EV charger.',
    'You are a helpful general assistant AND Ionity\'s concierge. You MAY answer general questions — weather, news, facts, definitions — using the live web search tool you have, and give genuinely useful current answers. But Ionity stays the centre of gravity: keep it brief, and where natural, tie back to Ionity or point the visitor to the right page.',
    'You have a live web-search tool — USE IT to explore and cite real, current content from BOTH of Ionity\'s sites: ionity.co.za (this canonical site) and www.ionity.today (the sister/reference site). When asked about Ionity\'s work, services, projects or references, search those two domains and answer from what is actually published there rather than guessing — then link the visitor to the exact page.',
    'When the visitor wants something on THIS site, DIRECT them with markdown links — e.g. [run a live Edge Scan](edge.html), [see our services](services.html), [start a project](contact.html). Same-site links use relative paths; ionity.today uses its full https URL.',
    'Always write a fresh reply to what the visitor actually said. If they just greet you ("hi"), respond in ONE short original line and invite a question about Ionity — NEVER paste a canned greeting or repeat the knowledge-base text verbatim.',
    'CONTENT POLICY (always, no exceptions): keep every reply strictly professional and family-friendly. Never produce sexual, explicit or adult content. Never use profanity, slurs or vulgar language — not even when quoting the visitor. If a visitor is abusive or asks for such content, briefly and politely decline and steer back to how Ionity can help.',
    'BOUNDARIES & SAFETY: do not give legal, medical or financial advice. If a visitor expresses personal crisis, distress or self-harm, or a medical/legal emergency, reply with brief warmth, do NOT counsel, and point them to the right professionals — local emergency services or a recognised crisis line (in South Africa, the SADAG helpline). Then gently offer to continue with Ionity questions. For business/legal/financial specifics, refer to ai@ionity.today.',
    'CAN WE BUILD IT: when asked whether Ionity can make, build, automate or integrate something, the answer is almost always YES. Affirm it confidently, add a one-line "here is how", then invite them to request a quote on the [Contact page](contact.html) or to book a one-on-one.',
    'Be concise (1–3 short paragraphs), professional, direct and warm — never sales-y or crude.',
    'The authoritative knowledge base (identity, company, services, site map, features) follows below as YAML. Treat it as ground truth for anything about Ionity.',
    '',
    '=== AEDi KNOWLEDGE BASE (aedi.yaml) ===',
  ].join('\n');

  // Compact fallback used only if aedi.yaml can't be fetched (e.g. file:// or 404).
  const FALLBACK_CONTEXT = [
    'company: Ionity Global (Pty) Ltd — Centurion, South Africa. Founder: Johan Wilhelm van Antwerp.',
    'what_we_are: Native-AI engineering — AIoT, Cloud & Edge systems, custom MCP/agents/copilots, dashboards, digital twins, evidence-first audits & forensics, edge-computing hardware, cloud hosting, and software/web development. Grown from Antwerp Designs (2018).',
    'pages: Home (index.html), Services (services.html), Edge Scan (edge.html), About & AEDi (about.html), Contact (contact.html).',
    'signature (real, on-device): Edge Micro-Audit, Matrix Vision (live camera as blue digits), Sensor Node — all on edge.html, no simulation.',
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
    const sug = messages.querySelector('.aedi-suggest');   // clear starter chips once a chat begins
    if (sug) sug.remove();
    busy = true;
    sendBtn.disabled = true;
    statusDot.textContent = 'Thinking…';

    history.push({ role: 'user', parts: [{ text: userText }] });
    if (history.length > CFG.maxHistory) history.splice(0, history.length - CFG.maxHistory);

    appendMsg('user', userText);
    input.value = '';

    const typingEl = appendMsg('model', '', true);

    await systemReady;   // make sure aedi.yaml context is loaded before the first call

    const baseCfg = { temperature: 0.6, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } };
    // API-level guardrails: block sexual/explicit content hard, plus harassment,
    // hate and dangerous content. Keeps AEDi clean even if a prompt slips through.
    const SAFETY = [
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ];
    const mkBody = (useTools) => {
      const b = { system_instruction: { parts: [{ text: SYSTEM }] }, contents: history, generationConfig: baseCfg, safetySettings: SAFETY };
      if (useTools) b.tools = [{ google_search: {} }];   // live web grounding (weather/news/facts)
      return b;
    };

    async function callModel(model, useTools) {
      const res = await fetch(`${CFG.base}${model}:generateContent?key=${CFG.key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mkBody(useTools)),
      });
      if (res.status === 429) return { rate: true };
      if (!res.ok) { console.warn('[AEDi]', model, useTools ? '+search' : '', res.status); return {}; }
      const data = await res.json();
      // content blocked by safety filters → surface a clean, professional decline
      if (data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason === 'SAFETY') return { blocked: true };
      const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text).filter(Boolean).join('').trim();
      return { text };
    }

    // For each model: try WITH web grounding, then WITHOUT (so a grounding
    // hiccup never blanks the chat). Fall through to the next model on 429/empty.
    let reply = null, rateLimited = false, blocked = false;
    for (const model of CFG.models) {
      try {
        let r = await callModel(model, true);
        if (r.rate) rateLimited = true; else if (r.blocked) { blocked = true; break; } else if (r.text) { reply = r.text; break; }
        if (!reply) {
          r = await callModel(model, false);
          if (r.rate) rateLimited = true; else if (r.blocked) { blocked = true; break; } else if (r.text) { reply = r.text; break; }
        }
      } catch (e) { console.warn('[AEDi]', model, e.message); }   // network error → try next
    }

    typingEl.remove();
    if (reply) {
      history.push({ role: 'model', parts: [{ text: reply }] });
      appendMsg('model', reply);
    } else if (blocked) {
      appendMsg('model', "Let's keep this professional — I can't help with that. But I'm happy to talk about anything Ionity can build for you. What are you working on?");
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
      appendMsg('model', pickGreeting());
      renderSuggestions();
    }
    if (open) setTimeout(() => input.focus(), 60);
  }

  // starter quick-prompts shown under the first greeting; tap to ask.
  const SUGGESTIONS = [
    'What do you do?',
    'How safe is AEDi?',
    'Can Ionity build my idea?',
    'Need a quote?',
    'Book a one-on-one?',
  ];
  function renderSuggestions() {
    const wrap = document.createElement('div');
    wrap.className = 'aedi-suggest';
    SUGGESTIONS.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'aedi-chip'; b.textContent = s;
      b.addEventListener('click', () => ask(s));
      wrap.appendChild(b);
    });
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  // random AEDi greeting, never the same twice in a row
  let _lastGreet = -1;
  function pickGreeting() {
    const g = CFG.greetings; if (!g || !g.length) return 'AEDi online.';
    let i; do { i = Math.floor(Math.random() * g.length); } while (g.length > 1 && i === _lastGreet);
    _lastGreet = i; return g[i];
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
