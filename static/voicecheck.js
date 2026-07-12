/* VoiceCheck v2 — free-speech conversational check-in.
   AXON speaks with the real TTS pipeline (/api/axon/tts: OpenAI/ElevenLabs when configured,
   device voice as fallback), you answer NATURALLY — ramble, add context, whatever — and
   AXON's AI (/api/axon/parse-checkin) extracts every field it heard. One rambling answer
   can fill several questions at once; only what's still missing gets asked. */
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var ov, qEl, subEl, trEl, valEl, micEl, progEl;
  var cfg = null, active = false, recog = null, curAudio = null;
  var filled = {};   // step.key -> true once answered

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

  /* ---------- speech out: real TTS first, device voice fallback ---------- */
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
  function speak(text, then) {
    try { if (curAudio) { curAudio.pause(); curAudio = null; } } catch (e) {}
    fetch('/api/axon/tts', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ text: text }) })
      .then(function (r) { return r.status === 200 ? r.blob() : null; })
      .then(function (blob) {
        if (!blob) return deviceSpeak(text, then);
        var url = URL.createObjectURL(blob);
        curAudio = new Audio(url);
        curAudio.onended = function () { URL.revokeObjectURL(url); then(); };
        curAudio.onerror = function () { deviceSpeak(text, then); };
        curAudio.play().catch(function () { deviceSpeak(text, then); });
      })
      .catch(function () { deviceSpeak(text, then); });
  }

  /* ---------- speech in ---------- */
  function listen() {
    if (!SR || !active) return;
    try { if (recog) recog.stop(); } catch (e) {}
    recog = new SR();
    recog.lang = 'en-US'; recog.interimResults = true; recog.continuous = false;
    micEl.classList.add('live'); trEl.textContent = '';
    subEl.textContent = 'Just talk — say as much as you want';
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

  /* ---------- understanding: AXON AI first, local parse fallback ---------- */
  function understand(said) {
    subEl.textContent = 'AXON is thinking…';
    fetch('/api/axon/parse-checkin', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ kind: cfg.kind, transcript: said }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok || !d.data) return localFallback(said);
        var got = [];
        cfg.steps.forEach(function (s) {
          if (d.data[s.key] === undefined || d.data[s.key] === null) return;
          if (applyValue(s, d.data[s.key])) { filled[s.key] = true; got.push(s.key); }
        });
        if (!got.length) return localFallback(said);
        valEl.textContent = '✓ Got it';
        if (navigator.vibrate) navigator.vibrate(12);
        var ack = (typeof d.data.ack === 'string' && d.data.ack) ? d.data.ack : 'Got it.';
        subEl.textContent = '';
        advance(ack);   // ack + next question spoken as ONE utterance (one fetch, no gap)
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
    if (!ok) { subEl.textContent = 'Say that another way?'; return; }
    filled[s.key] = true;
    valEl.textContent = '✓ Got it';
    if (navigator.vibrate) navigator.vibrate(12);
    advance('Got it.');
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
  function greeting() {
    // Prefer AXON's personalized opener ("Heard you had an issue with Melina — let's talk.")
    if (typeof window.AXON_OPENER === 'string' && window.AXON_OPENER) return window.AXON_OPENER;
    var name = cfg.name || '';
    var pools = cfg.kind === 'morning'
      ? ['Hey ' + name + '. Good to hear you — let’s take a minute on your morning.',
         'Morning, ' + name + '. Quick check-in, then you’re off.',
         'Hey ' + name + '. Let’s see where you’re at today.']
      : ['Hey ' + name + '. Let’s close the day properly.',
         'Evening, ' + name + '. Talk to me — how did today go?',
         'Hey ' + name + '. Day’s done — let’s take stock.'];
    return pools[Math.floor(Math.random() * pools.length)];
  }
  // ask(prefix): speaks prefix (greeting or ack) + the next question as ONE utterance — one fetch, zero gap
  function ask(prefix) {
    var s = current(); if (!s) return finish(prefix);
    var done = cfg.steps.filter(function (x) { return filled[x.key]; }).length;
    progEl.textContent = done + ' / ' + cfg.steps.length;
    var q = (document.querySelector('[data-q="' + s.key + '"]') || {}).textContent || s.key;
    qEl.textContent = q; valEl.textContent = ''; trEl.textContent = '';
    subEl.textContent = 'AXON is asking…';
    var idx = cfg.steps.indexOf(s);
    if (typeof window.show === 'function') { try { window.show(idx + 1); } catch (e) {} }
    speak((prefix ? prefix + ' ' : '') + q, listen);
  }
  function advance(prefix) { if (!active) return; current() ? ask(prefix) : finish(prefix); }
  function finish(prefix) {
    qEl.textContent = 'All done.'; subEl.textContent = 'Saving…'; trEl.textContent = '';
    speak((prefix ? prefix + ' ' : '') + (cfg.doneLine || 'Done. Locked in.'), function () {});
    setTimeout(function () { stop(true); cfg.onDone(); }, 500);
  }
  function stop(silent) {
    active = false;
    try { if (recog) recog.stop(); } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
    try { if (curAudio) curAudio.pause(); } catch (e) {}
    if (ov) ov.classList.remove('on');
  }

  window.VoiceCheck = {
    supported: function () { return !!SR; },
    start: function (c) {
      if (!SR) { alert('Voice needs a supported browser (Safari/Chrome). Type it this time.'); return; }
      cfg = c; filled = {}; active = true;
      build(); ov.classList.add('on');
      ask(greeting());   // opens like a person: "Hey Khalid. Good to hear you..." + first question
    }
  };
})();
