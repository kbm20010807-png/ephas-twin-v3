/* VoiceCheck v3 — fast conversational check-in.
   Speed design:
   - ONE reusable <audio> element, unlocked by the user's initial tap (iOS keeps it trusted
     for the whole session — fixes "turn 2 is silent" autoplay blocking).
   - The NEXT question's audio is prefetched WHILE the user is still talking, so after the
     AI parse the reply plays instantly (turn latency ≈ parse time only).
   - Acks show as text on screen instead of being spoken — tighter loop, ChatGPT pacing.
   Free speech: answers go to /api/axon/parse-checkin; one rambling answer can fill many fields. */
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var ov, qEl, subEl, trEl, valEl, micEl, progEl;
  var cfg = null, active = false, recog = null;
  var filled = {};
  var audioEl = null;                 // single trusted audio element (created on the start tap)
  var ttsCache = {};                  // text -> objectURL (pre-fetched speech)
  var _preGreet = '';

  /* ---------- audio ---------- */
  function ensureAudio() {
    if (!audioEl) { audioEl = new Audio(); audioEl.setAttribute('playsinline', ''); }
    return audioEl;
  }
  function warm(text) {               // prefetch speech for `text` into the cache
    if (!text || ttsCache[text]) return;
    ttsCache[text] = 'pending';
    fetch('/api/axon/tts', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ text: text }) })
      .then(function (r) { return r.status === 200 ? r.blob() : null; })
      .then(function (b) { ttsCache[text] = b ? URL.createObjectURL(b) : ''; })
      .catch(function () { ttsCache[text] = ''; });
  }
  function deviceSpeak(text, then) {
    try {
      if (!window.speechSynthesis) return then();
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      var fired = false, go = function () { if (!fired) { fired = true; then(); } };
      u.onend = go; u.onerror = go;
      setTimeout(go, Math.min(9000, 2500 + text.length * 75));
      speechSynthesis.speak(u);
    } catch (e) { then(); }
  }
  function playUrl(url, text, then) {
    var a = ensureAudio();
    a.onended = function () { then(); };
    a.onerror = function () { deviceSpeak(text, then); };
    a.src = url;
    a.play().catch(function () { deviceSpeak(text, then); });
  }
  function speak(text, then) {
    var hit = ttsCache[text];
    if (hit && hit !== 'pending') return playUrl(hit, text, then);
    if (hit === 'pending') {          // fetch already in flight — wait briefly for it
      var waited = 0, iv = setInterval(function () {
        waited += 120;
        var h = ttsCache[text];
        if (h && h !== 'pending') { clearInterval(iv); playUrl(h, text, then); }
        else if (waited > 4000) { clearInterval(iv); deviceSpeak(text, then); }
      }, 120);
      return;
    }
    fetch('/api/axon/tts', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ text: text }) })
      .then(function (r) { return r.status === 200 ? r.blob() : null; })
      .then(function (b) {
        if (!b) return deviceSpeak(text, then);
        var url = URL.createObjectURL(b);
        ttsCache[text] = url;
        playUrl(url, text, then);
      })
      .catch(function () { deviceSpeak(text, then); });
  }

  /* ---------- UI ---------- */
  function build() {
    if (ov) return;
    ov = document.createElement('div');
    ov.className = 'vc-ov';
    ov.innerHTML =
      '<div class="vc-top"><div class="vc-prog" id="vcProg"></div>' +
      '<button class="vc-x" aria-label="Switch to typing">⌨ Type instead</button></div>' +
      '<div class="vc-q" id="vcQ"></div>' +
      '<div class="vc-sub" id="vcSub"></div>' +
      '<div class="vc-val" id="vcVal"></div>' +
      '<div class="vc-mic" id="vcMic"><span></span><span></span><span></span></div>' +
      '<div class="vc-tr" id="vcTr"></div>' +
      '<div class="vc-acts">' +
      '<button class="vc-b" data-a="repeat">↻ Repeat</button>' +
      '<button class="vc-b" data-a="retry">🎙 Answer again</button>' +
      '<button class="vc-b" data-a="skip">Skip →</button></div>';
    document.body.appendChild(ov);
    qEl = ov.querySelector('#vcQ'); subEl = ov.querySelector('#vcSub');
    trEl = ov.querySelector('#vcTr'); valEl = ov.querySelector('#vcVal');
    micEl = ov.querySelector('#vcMic'); progEl = ov.querySelector('#vcProg');
    ov.querySelector('.vc-x').onclick = function () { stop(); };
    ov.querySelector('[data-a="repeat"]').onclick = function () { ask(); };
    ov.querySelector('[data-a="retry"]').onclick = function () { listen(); };
    ov.querySelector('[data-a="skip"]').onclick = function () { var s = current(); if (s) filled[s.key] = true; advance(); };
  }

  /* ---------- speech in ---------- */
  function listen() {
    if (!SR || !active) return;
    try { if (recog) recog.stop(); } catch (e) {}
    recog = new SR();
    recog.lang = 'en-US'; recog.interimResults = true; recog.continuous = false;
    micEl.classList.add('live'); trEl.textContent = '';
    subEl.textContent = 'Just talk — say as much as you want';
    warmNext();                        // fetch the NEXT question's audio while they speak
    var finalT = '';
    recog.onresult = function (e) {
      var t = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
        if (e.results[i].isFinal) finalT = t;
      }
      trEl.textContent = t;
    };
    recog.onend = function () {
      micEl.classList.remove('live');
      if (!active) return;
      var said = (finalT || trEl.textContent || '').trim();
      if (!said) { subEl.textContent = "Didn't catch that — tap Answer again"; return; }
      understand(said);
    };
    recog.onerror = function () { micEl.classList.remove('live'); subEl.textContent = 'Mic hiccup — tap Answer again'; };
    try { recog.start(); } catch (e) {}
  }

  /* ---------- understanding ---------- */
  function speakRetry(msg) { subEl.textContent = ''; speak(msg, listen); }
  function understand(said) {
    if (/(what are you talking about|what do you mean|makes no sense|that's wrong|huh\b|who is that|i never said)/i.test(said)) {
      var s = current();
      var q = s ? ((document.querySelector('[data-q="' + s.key + '"]') || {}).textContent || '') : '';
      speakRetry("My bad — scratch that. " + q);
      return;
    }
    subEl.textContent = 'AXON is thinking…';
    var unfilled = cfg.steps.filter(function (s) { return !filled[s.key]; }).map(function (s) { return s.key; }).join(',');
    fetch('/api/axon/parse-checkin', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ kind: cfg.kind, transcript: said, unfilled: unfilled }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok || !d.data) return localFallback(said);
        var got = [];
        cfg.steps.forEach(function (s) {
          if (d.data[s.key] === undefined || d.data[s.key] === null) return;
          if (applyValue(s, d.data[s.key])) { filled[s.key] = true; got.push(s.key); }
        });
        if (!got.length) return localFallback(said);
        var ack = (typeof d.data.ack === 'string' && d.data.ack) ? d.data.ack : '✓ Got it';
        valEl.textContent = ack;
        if (navigator.vibrate) navigator.vibrate(12);
        subEl.textContent = '';
        // fully-AI turn: if AXON wrote the next question for the step we're actually on, speak
        // ack + its question as one utterance. Otherwise use the (pre-fetched, instant) static one.
        var nxt = current();
        if (nxt && d.data.next_key === nxt.key && typeof d.data.next_q === 'string' && d.data.next_q) {
          ask('', ack + ' ' + d.data.next_q);
        } else {
          advance();
        }
      })
      .catch(function () { localFallback(said); });
  }

  function parseNum(t) {
    t = t.toLowerCase();
    var words = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
    var n = null, m = t.match(/(\d+(?:[\.,]\d+)?)/);
    if (m) n = parseFloat(m[1].replace(',', '.'));
    else for (var w in words) { if (new RegExp('\\b' + w + '\\b').test(t)) { n = words[w]; break; } }
    if (n != null && /half/.test(t) && n === Math.floor(n)) n += 0.5;
    return n;
  }

  function localFallback(said) {
    var s = current(); if (!s) return advance();
    var low = said.toLowerCase(), ok = false;
    if (s.type === 'number' || s.type === 'scale') { var n = parseNum(low); if (n != null) ok = applyValue(s, n); }
    else if (s.type === 'yesno') {
      if (/\b(yes|yeah|yep|yup|i did|did it|done)\b/.test(low)) ok = applyValue(s, 'yes');
      else if (/\b(no|nope|nah|didn'?t|missed)\b/.test(low)) ok = applyValue(s, 'no');
    }
    else if (s.type === 'match') ok = applyValue(s, low.split(/[^a-z]+/));
    else if (s.type === 'grats') ok = applyValue(s, said.split(/(?:,| and |;)+/i));
    else ok = applyValue(s, said);
    if (!ok) {
      var hint = (s.type === 'number' || s.type === 'scale') ? 'Just give me a number — like seven.'
               : (s.type === 'yesno') ? 'Simple one — yes or no?'
               : "Didn't catch that — one more time?";
      speakRetry(hint);
      return;
    }
    filled[s.key] = true;
    valEl.textContent = '✓ Got it';
    if (navigator.vibrate) navigator.vibrate(12);
    advance();
  }

  function applyValue(s, val) {
    try {
      if (s.type === 'match') {
        var items = s.items(), names = Array.isArray(val) ? val : [String(val)];
        var hit = false;
        names.forEach(function (n) {
          n = String(n).toLowerCase().trim(); if (n.length < 3) return;
          items.forEach(function (it) {
            var inm = it.name.toLowerCase();
            if (inm.indexOf(n) !== -1 || n.indexOf(inm) !== -1) { it.el.classList.add('on'); hit = true; }
          });
        });
        return hit || names.length === 0;
      }
      if (s.type === 'number' || s.type === 'scale') {
        var n = parseFloat(val); if (isNaN(n)) return false;
        var mn = s.min != null ? s.min : 1, mx = s.max != null ? s.max : 10;
        s.apply(Math.max(mn, Math.min(mx, n))); return true;
      }
      if (s.type === 'yesno') {
        var v = String(val).toLowerCase();
        if (v !== 'yes' && v !== 'no') return false;
        s.apply(v); return true;
      }
      if (s.type === 'grats') {
        var parts = (Array.isArray(val) ? val : [String(val)]).map(function (p) { return String(p).trim(); }).filter(Boolean).slice(0, 3);
        if (!parts.length) return false;
        s.apply(parts); return true;
      }
      var t = String(val).trim(); if (!t) return false;
      s.apply(t); return true;
    } catch (e) { return false; }
  }

  /* ---------- flow ---------- */
  function current() {
    for (var i = 0; i < cfg.steps.length; i++) if (!filled[cfg.steps[i].key]) return cfg.steps[i];
    return null;
  }
  function nextAfterCurrent() {       // the most likely next step (assumes current gets answered)
    var seen = false;
    for (var i = 0; i < cfg.steps.length; i++) {
      var s = cfg.steps[i];
      if (filled[s.key]) continue;
      if (!seen) { seen = true; continue; }   // skip the current one
      return s;
    }
    return null;
  }
  function qText(s) { return s ? ((document.querySelector('[data-q="' + s.key + '"]') || {}).textContent || s.key) : ''; }
  function warmNext() {
    var n = nextAfterCurrent();
    if (n) warm(qText(n));
    if (!n) warm(cfg.doneLine || 'Done. Locked in.');
  }
  function pickGreeting(kind, name) {
    if (typeof window.AXON_OPENER === 'string' && window.AXON_OPENER) return window.AXON_OPENER;
    var pools = kind === 'morning'
      ? ['Hey ' + name + '. Good to hear you — let’s take a minute on your morning.',
         'Morning, ' + name + '. Quick check-in, then you’re off.',
         'Hey ' + name + '. Let’s see where you’re at today.']
      : ['Hey ' + name + '. Let’s close the day properly.',
         'Evening, ' + name + '. Talk to me — how did today go?',
         'Hey ' + name + '. Day’s done — let’s take stock.'];
    return pools[Math.floor(Math.random() * pools.length)];
  }
  function greeting() { return _preGreet || pickGreeting(cfg.kind, cfg.name || ''); }
  function ask(prefix, aiUtterance) {
    var s = current(); if (!s) return finish();
    var done = cfg.steps.filter(function (x) { return filled[x.key]; }).length;
    progEl.textContent = done + ' / ' + cfg.steps.length;
    var q = qText(s);
    qEl.textContent = aiUtterance ? aiUtterance : q;   // show what's actually being said
    trEl.textContent = '';
    subEl.textContent = 'AXON is asking…';
    var idx = cfg.steps.indexOf(s);
    if (typeof window.show === 'function') { try { window.show(idx + 1); } catch (e) {} }
    speak(aiUtterance ? aiUtterance : ((prefix ? prefix + ' ' : '') + q), listen);
  }
  function advance() { if (!active) return; current() ? ask() : finish(); }
  function finish() {
    qEl.textContent = 'All done.'; subEl.textContent = 'Saving…'; trEl.textContent = '';
    speak(cfg.doneLine || 'Done. Locked in.', function () {});
    setTimeout(function () { stop(true); cfg.onDone(); }, 500);
  }
  function stop(silent) {
    active = false;
    try { if (recog) recog.stop(); } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
    try { if (audioEl) audioEl.pause(); } catch (e) {}
    for (var k in ttsCache) { if (ttsCache[k] && ttsCache[k] !== 'pending') { try { URL.revokeObjectURL(ttsCache[k]); } catch (e) {} } }
    ttsCache = {}; _preGreet = '';
    if (ov) ov.classList.remove('on');
  }

  window.VoiceCheck = {
    supported: function () { return !!SR; },
    // preload the opener's audio while the chooser is open → tap = instant speech
    preload: function (o) {
      if (!SR || !o || !o.firstQ) return;
      var g = pickGreeting(o.kind, o.name || '');
      _preGreet = g;
      warm(g + ' ' + o.firstQ);
    },
    start: function (c) {
      if (!SR) { alert('Voice needs a supported browser (Safari/Chrome). Type it this time.'); return; }
      cfg = c; filled = {}; active = true;
      build(); ov.classList.add('on');
      ensureAudio();                   // created inside the tap = trusted for the whole session
      try { audioEl.play().catch(function () {}); } catch (e) {}   // unlock even before src is set
      ask(greeting());
    }
  };
})();
