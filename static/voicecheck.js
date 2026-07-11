/* VoiceCheck — full conversational check-in/out.
   AXON speaks each question (device TTS), listens (on-device speech recognition),
   parses the answer, fills the REAL form controls, auto-advances, then submits.
   Usage: VoiceCheck.start({steps:[...], onDone:fn}) — see checkin.html/checkout.html configs. */
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var ov, qEl, subEl, trEl, valEl, micEl, progEl;
  var cfg = null, idx = 0, recog = null, active = false;

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
    ov.querySelector('.vc-x').onclick = stop;
    ov.querySelector('[data-a="repeat"]').onclick = function () { ask(); };
    ov.querySelector('[data-a="retry"]').onclick = function () { listen(); };
    ov.querySelector('[data-a="skip"]').onclick = function () { advance(); };
  }

  function speak(text, then) {
    try {
      if (!window.speechSynthesis) return then();
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02; u.pitch = 1;
      var fired = false, go = function () { if (!fired) { fired = true; then(); } };
      u.onend = go; u.onerror = go;
      setTimeout(go, Math.min(9000, 2500 + text.length * 75)); // fallback if onend never fires
      speechSynthesis.speak(u);
    } catch (e) { then(); }
  }

  function listen() {
    if (!SR || !active) return;
    try { if (recog) recog.stop(); } catch (e) {}
    recog = new SR();
    recog.lang = 'en-US'; recog.interimResults = true; recog.continuous = false;
    micEl.classList.add('live'); trEl.textContent = ''; subEl.textContent = 'Listening… just talk';
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
      handle(said);
    };
    recog.onerror = function () { micEl.classList.remove('live'); subEl.textContent = 'Mic hiccup — tap Answer again'; };
    try { recog.start(); } catch (e) {}
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

  function handle(said) {
    var s = cfg.steps[idx], low = said.toLowerCase(), shown = '';
    if (s.type === 'number' || s.type === 'scale') {
      var n = parseNum(low);
      if (n == null) { subEl.textContent = 'Say a number — like "seven" or "7 and a half"'; return; }
      var mn = s.min != null ? s.min : 1, mx = s.max != null ? s.max : 10;
      n = Math.max(mn, Math.min(mx, n));
      s.apply(n); shown = String(n) + (s.unit || '');
    } else if (s.type === 'yesno') {
      if (/\b(yes|yeah|yep|yup|i did|did it|done|hit it)\b/.test(low)) { s.apply('yes'); shown = 'Yes'; }
      else if (/\b(no|nope|nah|not really|didn'?t|missed)\b/.test(low)) { s.apply('no'); shown = 'Not today'; }
      else { subEl.textContent = 'Yes or no?'; return; }
    } else if (s.type === 'match') {
      var items = s.items(), hits = [];
      if (!/\b(none|nothing|skip|no)\b/.test(low) || /\band\b/.test(low)) {
        items.forEach(function (it) {
          var ws = it.name.toLowerCase().split(/[^a-z]+/).filter(function (w) { return w.length > 2; });
          for (var i = 0; i < ws.length; i++) if (low.indexOf(ws[i]) !== -1) { hits.push(it); break; }
        });
      }
      hits.forEach(function (it) { if (!it.el.classList.contains('on')) it.el.classList.add('on'); });
      shown = hits.length ? hits.map(function (i) { return i.name; }).join(', ') : 'None today';
    } else if (s.type === 'grats') {
      var parts = said.split(/(?:,| and |;)+/i).map(function (p) { return p.trim(); }).filter(Boolean).slice(0, 3);
      s.apply(parts); shown = parts.join(' · ');
    } else { // text
      s.apply(said); shown = '“' + (said.length > 60 ? said.slice(0, 60) + '…' : said) + '”';
    }
    valEl.textContent = '✓ ' + shown;
    if (navigator.vibrate) navigator.vibrate(12);
    setTimeout(advance, 750);
  }

  function ask() {
    var s = cfg.steps[idx];
    var q = (document.querySelector('[data-q="' + s.key + '"]') || {}).textContent || s.key;
    progEl.textContent = (idx + 1) + ' / ' + cfg.steps.length;
    qEl.textContent = q; valEl.textContent = ''; trEl.textContent = '';
    subEl.textContent = 'AXON is asking…';
    if (typeof window.show === 'function') { try { window.show(idx + 1); } catch (e) {} } // keep manual UI in sync
    speak(q, listen);
  }

  function advance() {
    idx++;
    if (idx >= cfg.steps.length) {
      qEl.textContent = 'All done.'; subEl.textContent = 'Saving your check-in…'; trEl.textContent = '';
      speak(cfg.doneLine || 'Done. Locked in.', function () {});
      setTimeout(function () { stop(true); cfg.onDone(); }, 500);
      return;
    }
    ask();
  }

  function stop(silent) {
    active = false;
    try { if (recog) recog.stop(); } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
    if (ov) ov.classList.remove('on');
    if (!silent && typeof window.show === 'function') { try { window.show(Math.min(idx + 1, cfg.steps.length)); } catch (e) {} }
  }

  window.VoiceCheck = {
    supported: function () { return !!SR; },
    start: function (c) {
      if (!SR) { alert('Voice needs a supported browser (Safari/Chrome). Type it this time.'); return; }
      cfg = c; idx = 0; active = true;
      build(); ov.classList.add('on');
      ask();
    }
  };
})();
