/* TWIN celebration engine — premium, restrained. Gold/platinum particles, number
   count-ups, haptics. No emoji, no rainbow. Vanilla, no dependencies. */
(function (w) {
  'use strict';
  var GOLD = ['#EAD5A2', '#D8BA72', '#C9A24B', '#F4E7C6', '#D7DCE3', '#CFC9BE'];
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function haptic(p) { try { if (navigator.vibrate) navigator.vibrate(p || 12); } catch (e) {} }

  // Animate a number from -> to inside an element. Decelerating ease (premium, no bounce).
  function countUp(el, from, to, ms, prefix, suffix) {
    if (!el) return;
    prefix = prefix || ''; suffix = suffix || '';
    if (reduce) { el.textContent = prefix + to + suffix; return; }
    var start = null, dur = ms || 1100;
    function ease(t) { return 1 - Math.pow(1 - t, 3); } // easeOutCubic
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var v = Math.round(from + (to - from) * ease(t));
      el.textContent = prefix + v + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // A restrained burst of gold/platinum shards from a point (or screen center).
  function burst(opts) {
    opts = opts || {};
    if (reduce) return;
    var n = opts.count || 90;
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, w.devicePixelRatio || 1);
    function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    var ox = opts.x != null ? opts.x : innerWidth / 2;
    var oy = opts.y != null ? opts.y : innerHeight * 0.42;
    var parts = [];
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 3 + Math.random() * 7;
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - (3 + Math.random() * 3),
        g: 0.14 + Math.random() * 0.1,
        w: 2 + Math.random() * 4, h: 5 + Math.random() * 9,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        col: GOLD[(Math.random() * GOLD.length) | 0],
        life: 1, fade: 0.006 + Math.random() * 0.006
      });
    }
    var t0 = performance.now();
    function tick(now) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      var alive = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.life <= 0) continue;
        alive++;
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life -= p.fade;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0 && now - t0 < 4000) requestAnimationFrame(tick);
      else cv.remove();
    }
    requestAnimationFrame(tick);
  }

  // A soft expanding gold ring pulse centered on an element (the "ignite" accent).
  function pulse(el) {
    if (!el || reduce) return;
    var r = el.getBoundingClientRect();
    var ring = document.createElement('div');
    ring.style.cssText = 'position:fixed;left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) +
      'px;width:8px;height:8px;border-radius:50%;border:2px solid rgba(234,213,162,.7);transform:translate(-50%,-50%);pointer-events:none;z-index:9997;';
    document.body.appendChild(ring);
    var s = null;
    function f(ts) { if (s === null) s = ts; var t = Math.min(1, (ts - s) / 700);
      var sc = 1 + t * 18; ring.style.transform = 'translate(-50%,-50%) scale(' + sc + ')';
      ring.style.opacity = String(1 - t); if (t < 1) requestAnimationFrame(f); else ring.remove(); }
    requestAnimationFrame(f);
  }

  w.Celebrate = { burst: burst, countUp: countUp, haptic: haptic, pulse: pulse, reduced: reduce };
})(window);
