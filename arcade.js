/* ============================================================
   CYBER ARCADE — shared engine
   Handles: player gate, HUD, timers, sound, scoring, Google Form
   submission, completion codes, leaderboard, results screen.
   Games only need to render into #stage and call Arcade.finish().
   ============================================================ */
(function () {
  'use strict';

  var C = window.CYBER_CONFIG || {};
  var LS = 'coupaCyberArcade.v1';

  /* ---------------- storage ---------------- */
  function store(patch) {
    var d = read();
    if (patch) { for (var k in patch) d[k] = patch[k]; try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} }
    return d;
  }
  function read() {
    try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; }
  }

  /* ---------------- sound (WebAudio, no assets) ---------------- */
  var actx = null, soundOn = (read().sound !== undefined) ? read().sound : (C.soundDefaultOn !== false);
  function tone(freq, dur, type, vol, delay) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + (delay || 0);
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol || .09, t + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + .02);
    } catch (e) {}
  }
  var SFX = {
    select: function () { tone(520, .06, 'triangle', .05); },
    good:   function () { tone(660, .1, 'triangle', .08); tone(990, .16, 'triangle', .07, .07); },
    great:  function () { tone(660, .09, 'triangle', .08); tone(880, .09, 'triangle', .08, .07); tone(1320, .2, 'triangle', .07, .14); },
    bad:    function () { tone(200, .18, 'sawtooth', .06); tone(150, .24, 'sawtooth', .05, .08); },
    tick:   function () { tone(1200, .03, 'square', .03); },
    win:    function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, .3, 'triangle', .08, i * .12); }); },
    lose:   function () { [392, 330, 262].forEach(function (f, i) { tone(f, .34, 'sawtooth', .06, i * .16); }); }
  };

  /* ---------------- helpers ---------------- */
  function el(id) { return document.getElementById(id); }
  function h(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function hashCode(str) {
    var hh = 5381;
    for (var i = 0; i < str.length; i++) { hh = ((hh << 5) + hh) ^ str.charCodeAt(i); }
    return (hh >>> 0).toString(36).toUpperCase();
  }
  function completionCode(email, week, score) {
    return 'CYB-W' + week + '-' + hashCode((email || 'anon').toLowerCase() + '|' + week).slice(0, 5) + '-' + score;
  }
  function maskEmail(e) {
    var p = String(e).split('@'); if (p.length < 2) return e;
    var n = p[0];
    return (n.length <= 3 ? n[0] + '**' : n.slice(0, 3) + '*'.repeat(Math.min(5, n.length - 3))) + '@' + p[1];
  }

  /* ---------------- rank ---------------- */
  function rank(pct) {
    if (pct >= 95) return { name: 'Threat Hunter', blurb: 'Elite. You could run the awareness program.' };
    if (pct >= 85) return { name: 'Security Analyst', blurb: 'Sharp instincts and a steady hand.' };
    if (pct >= 70) return { name: 'First Responder', blurb: 'Solid. A couple of lures slipped past.' };
    if (pct >= 50) return { name: 'Vigilant Rookie', blurb: 'Good foundation — review the misses below.' };
    return { name: 'Recruit', blurb: 'Worth a second run. The debrief below is the good part.' };
  }

  /* ---------------- chrome ---------------- */
  function renderTopbar(cfg) {
    var t = el('topbar'); if (!t) return;
    t.innerHTML =
      '<div class="topbar">' +
        '<a class="brandmark" href="index.html"><span class="dot">&#9670;</span>' +
        '<span><b>Coupa Cyber Arcade</b><span>' + esc(C.programName || '') + ' ' + esc(C.programYear || '') + '</span></span></a>' +
        '<div class="topbar-tools">' +
          (cfg.week ? '<span class="chip flat">Week ' + cfg.week + '</span>' : '') +
          '<button class="icon-btn" id="sndBtn" title="Sound on/off"></button>' +
          '<a class="btn ghost sm" href="index.html">All Games</a>' +
        '</div>' +
      '</div>';
    var b = el('sndBtn');
    function paint() { b.textContent = soundOn ? '🔈' : '🔇'; }
    paint();
    b.onclick = function () { soundOn = !soundOn; store({ sound: soundOn }); paint(); if (soundOn) SFX.select(); };
  }

  function renderFoot() {
    var f = el('foot'); if (!f) return;
    f.className = 'foot';
    f.innerHTML = '<span>Coupa &mdash; ' + esc(C.programName || '') + ' ' + esc(C.programYear || '') + '</span>' +
      '<span>' + (C.securityContact ? 'Questions? <a href="mailto:' + esc(C.securityContact) + '">' + esc(C.securityContact) + '</a>' : 'Every scenario here is fictional and built for training.') + '</span>';
  }

  /* ---------------- player gate / start screen ---------------- */
  var PLAYER = null, GAME = null, T0 = 0;

  function renderStart(cfg) {
    var saved = read().player || {};
    var needEmail = C.requireEmail !== false;
    var depts = (C.departments || []).map(function (d) { return '<option' + (saved.department === d ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('');

    el('start').innerHTML =
      '<div class="panel fadein" style="padding:34px">' +
        '<div class="eyebrow">Week ' + cfg.week + ' &middot; ' + esc(cfg.topic) + '</div>' +
        '<h1 style="margin:8px 0 6px">' + esc(cfg.title) + '</h1>' +
        '<p class="lead" style="max-width:66ch">' + cfg.tagline + '</p>' +

        '<div class="row" style="margin-top:22px;gap:10px">' +
          '<span class="chip">' + cfg.rounds + ' rounds</span>' +
          '<span class="chip">~' + cfg.minutes + ' min</span>' +
          '<span class="chip">' + cfg.maxScore + ' points max</span>' +
        '</div>' +

        '<div style="margin-top:26px;padding:20px;background:rgba(255,255,255,.05);border-radius:12px">' +
          '<h6 style="margin-bottom:10px;color:var(--robin)">How to play</h6>' +
          '<ul style="margin-left:18px;color:rgba(255,255,255,.86);font-size:15px;line-height:26px">' +
            cfg.brief.map(function (b) { return '<li>' + b + '</li>'; }).join('') +
          '</ul>' +
        '</div>' +

        (needEmail ?
        '<div style="margin-top:26px;display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
          '<div><label class="fl">Work email (for the leaderboard)</label>' +
            '<input type="email" id="pEmail" placeholder="you@' + esc((C.allowedEmailDomains || ['company.com'])[0]) + '" value="' + esc(saved.email || '') + '" autocomplete="email"></div>' +
          '<div><label class="fl">Display name</label>' +
            '<input type="text" id="pName" placeholder="How you appear on the board" value="' + esc(saved.name || '') + '" autocomplete="name"></div>' +
          '<div><label class="fl">Department</label><select id="pDept"><option value="">Select&hellip;</option>' + depts + '</select></div>' +
          '<div style="display:flex;align-items:flex-end"><span style="font-size:13px;line-height:19px;color:var(--dimmer)">' +
            'Your email is used only to credit your score on the program leaderboard.</span></div>' +
        '</div>' : '') +

        '<div id="startErr"></div>' +
        '<div class="row" style="margin-top:26px"><button class="btn primary lg" id="goBtn">Start &nbsp;&rarr;</button></div>' +
      '</div>';

    el('goBtn').onclick = function () {
      var email = '', name = '', dept = '';
      if (needEmail) {
        email = (el('pEmail').value || '').trim().toLowerCase();
        name = (el('pName').value || '').trim();
        dept = el('pDept').value || '';
        var doms = C.allowedEmailDomains || [];
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
                 (!doms.length || doms.some(function (d) { return email.endsWith('@' + d.toLowerCase()); }));
        if (!ok) {
          el('startErr').innerHTML = '<div class="err">Please enter a valid ' +
            (doms.length ? esc(doms.join(' or ')) : 'work') + ' email address.</div>';
          el('pEmail').focus(); SFX.bad(); return;
        }
        if (!name) name = email.split('@')[0];
      }
      PLAYER = { email: email, name: name, department: dept };
      store({ player: PLAYER });
      SFX.select();
      el('start').classList.add('hidden');
      el('stage').classList.remove('hidden');
      T0 = Date.now();
      cfg.onStart(PLAYER);
    };
  }

  /* ---------------- HUD ---------------- */
  function hud(cells) {
    return '<div class="hud">' + cells.map(function (c) {
      return '<div class="cell"><div class="k">' + esc(c[0]) + '</div><div class="v ' + (c[2] || '') + '" id="' + (c[3] || '') + '">' + c[1] + '</div></div>';
    }).join('') + '</div>';
  }

  /* ---------------- countdown timer ---------------- */
  function Timer(barEl, seconds, onEnd, onTick) {
    var total = seconds * 1000, left = total, raf, last = performance.now(), dead = false, warned = 0;
    var fill = barEl.querySelector('i');
    function step(now) {
      if (dead) return;
      left -= (now - last); last = now;
      var p = clamp(left / total, 0, 1);
      fill.style.width = (p * 100) + '%';
      barEl.className = 'timerbar' + (p < .2 ? ' crit' : p < .45 ? ' warn' : '');
      var secs = Math.ceil(left / 1000);
      if (onTick) onTick(Math.max(0, secs));
      if (p < .32 && secs !== warned) { warned = secs; SFX.tick(); }
      if (left <= 0) { dead = true; onEnd(); return; }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return {
      stop: function () { dead = true; cancelAnimationFrame(raf); },
      remaining: function () { return Math.max(0, left / 1000); }
    };
  }

  /* ---------------- floating score ---------------- */
  function float(anchor, text, color) {
    var r = anchor.getBoundingClientRect();
    var f = document.createElement('div');
    f.className = 'float'; f.textContent = text;
    f.style.color = color || 'var(--pistachio)';
    f.style.left = (r.left + r.width / 2 - 22 + window.scrollX) + 'px';
    f.style.top = (r.top + 6 + window.scrollY) + 'px';
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 950);
  }
  function toast(msg, ms) {
    var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 2200);
  }

  /* ---------------- Google Form submission ---------------- */
  function submitScore(rec) {
    var g = C.googleForm || {};
    if (!g.enabled || !g.formId || g.formId.indexOf('PASTE') === 0) return Promise.resolve(false);
    var body = new URLSearchParams();
    var f = g.fields || {};
    var map = {
      email: rec.email, name: rec.name, department: rec.department, week: rec.week,
      gameTitle: rec.gameTitle, score: rec.score, maxScore: rec.maxScore,
      accuracy: rec.accuracy + '%', timeSeconds: rec.timeSeconds, completionCode: rec.completionCode
    };
    Object.keys(map).forEach(function (k) {
      if (f[k] && String(f[k]).indexOf('entry.0000') !== 0) body.append(f[k], map[k]);
    });
    var url = 'https://docs.google.com/forms/d/e/' + g.formId + '/formResponse';
    return fetch(url, { method: 'POST', mode: 'no-cors', body: body })
      .then(function () { return true; })
      .catch(function () {
        // Fallback: hidden iframe form post
        try {
          var ifr = document.createElement('iframe'); ifr.name = 'gfTarget'; ifr.style.display = 'none';
          document.body.appendChild(ifr);
          var form = document.createElement('form');
          form.action = url; form.method = 'POST'; form.target = 'gfTarget'; form.style.display = 'none';
          body.forEach(function (v, k) {
            var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i);
          });
          document.body.appendChild(form); form.submit();
          return true;
        } catch (e) { return false; }
      });
  }

  /* ---------------- Leaderboard ---------------- */
  function parseCSV(text) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else {
        if (ch === '"') q = true;
        else if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (ch !== '\r') cur += ch;
      }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
  }

  function loadLeaderboard(mountId, myEmail) {
    var lb = C.leaderboard || {}, mount = el(mountId);
    if (!mount) return;
    if (!lb.enabled || !lb.publishedCsvUrl || lb.publishedCsvUrl.indexOf('PASTE') === 0) {
      mount.innerHTML = '<p style="color:var(--dimmer);font-size:14px">' +
        'The live leaderboard turns on once the program owner links the responses sheet.</p>';
      return;
    }
    mount.innerHTML = '<p class="pulse" style="color:var(--dimmer);font-size:14px">Loading leaderboard&hellip;</p>';
    var url = lb.publishedCsvUrl + (lb.publishedCsvUrl.indexOf('?') > -1 ? '&' : '?') + 'cachebust=' + Date.now();
    fetch(url).then(function (r) { return r.text(); }).then(function (txt) {
      var rows = parseCSV(txt);
      if (rows.length < 2) throw new Error('empty');
      var head = rows[0].map(function (s) { return s.trim().toLowerCase(); });
      var col = lb.columns || {};
      function idx(want, alts) {
        var i = head.indexOf(String(want || '').toLowerCase());
        if (i > -1) return i;
        for (var a = 0; a < (alts || []).length; a++) {
          for (var j = 0; j < head.length; j++) if (head[j].indexOf(alts[a]) > -1) return j;
        }
        return -1;
      }
      var iE = idx(col.email, ['email']), iN = idx(col.name, ['name']),
          iW = idx(col.week, ['week']), iS = idx(col.score, ['score']);
      if (iS < 0 || (iE < 0 && iN < 0)) throw new Error('columns');

      var byPlayer = {};
      rows.slice(1).forEach(function (r) {
        // email is preferred as the key, but a sheet published without it
        // (recommended, for privacy) falls back to the display name
        var email = (iE > -1 ? (r[iE] || '') : '').trim().toLowerCase();
        if (!email) email = '~' + (iN > -1 ? (r[iN] || '') : '').trim().toLowerCase();
        if (email === '~') return;
        var wk = (r[iW] || '').replace(/\D/g, '') || '?';
        var sc = parseInt((r[iS] || '0').replace(/[^\d-]/g, ''), 10) || 0;
        var nm = iN > -1 ? (r[iN] || '').trim() : '';
        var p = byPlayer[email] || (byPlayer[email] = { email: email, name: nm, weeks: {}, total: 0 });
        if (!p.name && nm) p.name = nm;
        if (sc > (p.weeks[wk] || 0)) p.weeks[wk] = sc;   // keep each player's best per week
      });
      var list = Object.keys(byPlayer).map(function (k) {
        var p = byPlayer[k];
        p.total = Object.keys(p.weeks).reduce(function (s, w) { return s + p.weeks[w]; }, 0);
        p.count = Object.keys(p.weeks).length;
        return p;
      }).sort(function (a, b) { return b.total - a.total || b.count - a.count; });

      var mine = list.findIndex(function (p) { return p.email === String(myEmail || '').toLowerCase(); });
      var top = list.slice(0, lb.topN || 15);
      if (mine >= (lb.topN || 15)) top.push(list[mine]);

      var html = '<table class="lb"><thead><tr><th>#</th><th>Player</th><th>Weeks</th><th>Total</th></tr></thead><tbody>';
      top.forEach(function (p) {
        var pos = list.indexOf(p) + 1;
        var isMe = p.email === String(myEmail || '').toLowerCase();
        var label = p.name || (p.email.charAt(0) === '~' ? p.email.slice(1)
          : (C.maskLeaderboardEmails !== false ? maskEmail(p.email) : p.email));
        html += '<tr class="' + (isMe ? 'me' : (pos % 2 ? 'odd' : '')) + '">' +
          '<td class="pos">' + pos + '</td><td>' + esc(label) + (isMe ? ' &larr; you' : '') + '</td>' +
          '<td>' + p.count + '/4</td><td>' + p.total.toLocaleString() + '</td></tr>';
      });
      html += '</tbody></table>';
      mount.innerHTML = html;
    }).catch(function () {
      mount.innerHTML = '<p style="color:var(--dimmer);font-size:14px">' +
        'Couldn\'t reach the leaderboard right now. Your score was still recorded.</p>';
    });
  }

  /* ---------------- results ---------------- */
  function finish(res) {
    var cfg = GAME;
    var secs = Math.round((Date.now() - T0) / 1000);
    var score = Math.max(0, Math.round(res.score));
    var maxS = res.maxScore || cfg.maxScore;
    var pct = Math.round((score / maxS) * 100);
    var acc = res.accuracy != null ? Math.round(res.accuracy) : pct;
    var rk = rank(acc);
    var code = completionCode(PLAYER && PLAYER.email, cfg.week, score);

    var played = read().played || {};
    played[cfg.week] = { score: score, max: maxS, code: code, at: Date.now() };
    store({ played: played });

    (score > 0 ? SFX.win : SFX.lose)();

    el('stage').classList.add('hidden');
    var r = el('results'); r.classList.remove('hidden');
    r.innerHTML =
      '<div class="panel scoreboard fadein">' +
        '<div class="eyebrow">Week ' + cfg.week + ' complete</div>' +
        '<div class="bigscore">' + score.toLocaleString() + '</div>' +
        '<div style="color:var(--dimmer);font-size:14px">of ' + maxS.toLocaleString() + ' points</div>' +
        '<div class="rankname">' + esc(rk.name) + '</div>' +
        '<p style="color:var(--dim);margin-top:4px">' + esc(rk.blurb) + '</p>' +
        '<div class="breakdown">' +
          '<div class="b"><div class="k">Accuracy</div><div class="v">' + acc + '%</div></div>' +
          '<div class="b"><div class="k">Time</div><div class="v">' + Math.floor(secs / 60) + 'm ' + (secs % 60) + 's</div></div>' +
          '<div class="b"><div class="k">' + esc(res.statLabel || 'Best streak') + '</div><div class="v">' + esc(String(res.statValue != null ? res.statValue : '—')) + '</div></div>' +
        '</div>' +
        '<div class="codebox"><div class="k" style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dimmer);font-weight:600">Your completion code</div>' +
          '<div class="c mono" id="ccode">' + esc(code) + '</div>' +
          '<div class="row" style="justify-content:center;margin-top:12px">' +
            '<button class="btn ghost sm" id="copyBtn">Copy result</button>' +
            '<button class="btn ghost sm" id="againBtn">Play again</button>' +
            '<a class="btn primary sm" href="index.html">Next game &rarr;</a>' +
          '</div>' +
        '</div>' +
        '<div id="sendState" style="font-size:13px;color:var(--dimmer);margin-top:12px"></div>' +
      '</div>' +

      (res.review && res.review.length ?
      '<div class="panel fadein" style="margin-top:16px">' +
        '<div class="eyebrow">Debrief</div><h3 style="margin:6px 0 18px">What to carry into Monday</h3>' +
        res.review.map(function (x) {
          return '<div class="reviewitem ' + (x.ok ? 'ok' : '') + '"><div class="q">' +
            (x.ok ? '✓ ' : '✕ ') + esc(x.q) + '</div><div class="a">' + x.a + '</div></div>';
        }).join('') +
      '</div>' : '') +

      '<div class="panel fadein" style="margin-top:16px">' +
        '<div class="eyebrow">Program leaderboard</div>' +
        '<h3 style="margin:6px 0 14px">Standings across all four weeks</h3>' +
        '<div id="lbMount"></div>' +
      '</div>';

    el('againBtn').onclick = function () { location.reload(); };
    el('copyBtn').onclick = function () {
      var txt = 'Coupa Cyber Arcade — Week ' + cfg.week + ': ' + cfg.title +
        '\nScore: ' + score + '/' + maxS + ' (' + acc + '% accuracy) — ' + rk.name +
        '\nCompletion code: ' + code;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
        .then(function () { toast('Result copied to clipboard'); })
        .catch(function () { toast('Copy failed — select the code manually'); });
    };

    if (PLAYER && PLAYER.email) {
      submitScore({
        email: PLAYER.email, name: PLAYER.name, department: PLAYER.department,
        week: cfg.week, gameTitle: cfg.title, score: score, maxScore: maxS,
        accuracy: acc, timeSeconds: secs, completionCode: code
      }).then(function (sent) {
        el('sendState').textContent = sent
          ? 'Score recorded for ' + PLAYER.email + '.'
          : 'Score tracking is not switched on yet — keep your completion code.';
        loadLeaderboard('lbMount', PLAYER.email);
      });
    } else {
      loadLeaderboard('lbMount', '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- boot ---------------- */
  function boot(cfg) {
    GAME = cfg;
    document.title = 'Week ' + cfg.week + ': ' + cfg.title + ' — Coupa Cyber Arcade';
    renderTopbar(cfg); renderFoot(); renderStart(cfg);
  }

  window.Arcade = {
    boot: boot, finish: finish, hud: hud, Timer: Timer, SFX: SFX,
    float: float, toast: toast, el: el, h: h, esc: esc, shuffle: shuffle, clamp: clamp,
    loadLeaderboard: loadLeaderboard, maskEmail: maskEmail, read: read, store: store,
    player: function () { return PLAYER; },
    config: C
  };
})();
