/*
 * 60秒教材アニメーション　表示プログラム
 * ------------------------------------------------------------
 * 教材の中身（文章・色・秒数）は assets/lessons/*.js に書きます。
 * このファイルは「教材データを受け取って、決まった型の場面を表示・再生する」だけです。
 *
 * 場面の型（scene.type）
 *   title    : タイトル（封筒と大きな見出し）
 *   overview : 項目の一覧（カード）
 *   step     : 項目1つずつの説明（便箋に例文が書かれる）
 *   flow     : 順番の確認（縦に並べて順番に光る）
 *   ending   : まとめ（封筒が閉じる）
 *
 * 別の教材を作るとき：assets/lessons/ に新しいデータを作り、
 * index.html の読み込み先を変えるか、URL に ?lesson=ファイル名 を付けて開きます。
 */
(function () {
  'use strict';

  var CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
  var FADE_OUT = 0.45; // 場面の終わりのフェードアウト（秒）

  /* ================================================================
   * 小さな道具
   * ================================================================ */

  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'style') Object.keys(v).forEach(function (s) { el.style.setProperty(s, v[s]); });
        else el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(el, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }

  function svg(name) {
    var body = (window.ICONS && window.ICONS[name]) || '';
    return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" focusable="false">' + body + '</svg>';
  }

  function icon(name, cls) {
    var span = h('span', { class: 'ic' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' });
    span.innerHTML = svg(name);
    return span;
  }

  // アニメーションを付ける：fx(要素, 種類, 開始秒, 長さ秒)
  function fx(el, name, delay, dur) {
    el.classList.add('fx', 'fx-' + name);
    el.style.setProperty('--d', (delay || 0).toFixed(2) + 's');
    if (dur) el.style.setProperty('--dur', dur.toFixed(2) + 's');
    return el;
  }

  function mark(i) { return CIRCLED.charAt(i) || String(i + 1); }

  /* ================================================================
   * 文字の書式： {漢字|かんじ} → ふりがな、*ことば* → 強調、\n → 改行
   * ================================================================ */

  function parseLine(str) {
    var tokens = [];
    var em = false;
    var re = /\{([^|{}]+)\|([^{}]+)\}|(\*)|([^{*]+|\{)/g;
    var m;
    while ((m = re.exec(str))) {
      if (m[1] !== undefined) tokens.push({ t: m[1], rt: m[2], em: em });
      else if (m[3]) em = !em;
      else tokens.push({ t: m[4], em: em });
    }
    return tokens;
  }

  function tokenNode(tok) {
    if (!tok.rt) return document.createTextNode(tok.t);
    return h('ruby', null, tok.t, h('rt', null, tok.rt));
  }

  // 1行分をDOMにする（強調部分は <mark> でまとめる）
  function lineNodes(str) {
    var frag = document.createDocumentFragment();
    var current = null;
    parseLine(str).forEach(function (tok) {
      if (tok.em) {
        if (!current) { current = h('mark', { class: 'em' }); frag.append(current); }
        current.append(tokenNode(tok));
      } else {
        current = null;
        frag.append(tokenNode(tok));
      }
    });
    return frag;
  }

  function rich(text) {
    var frag = document.createDocumentFragment();
    String(text || '').split('\n').forEach(function (line, i) {
      if (i) frag.append(h('br'));
      frag.append(lineNodes(line));
    });
    return frag;
  }

  function lines(text) { return String(text || '').split('\n'); }

  // 1文字ずつ（ふりがな付きの語は1まとまり）に分ける
  function units(str) {
    var out = [];
    parseLine(str).forEach(function (tok) {
      var cls = 'u' + (tok.em ? ' em-u' : '');
      if (tok.rt) out.push(h('span', { class: cls }, tokenNode(tok)));
      else Array.from(tok.t).forEach(function (ch) { out.push(h('span', { class: cls }, ch)); });
    });
    return out;
  }

  /* ================================================================
   * 部品
   * ================================================================ */

  function badge(i, color, cls) {
    return h('span', { class: 'badge' + (cls ? ' ' + cls : ''), style: { '--c': color } }, String(i + 1));
  }

  // 封筒（open: 手紙が少し出ている / closing: 手紙が入って閉じる）
  function envelope(mode, t0) {
    var paper = h('div', { class: 'env-paper' });
    var flap = h('div', { class: 'env-flap' });
    var env = h('div', { class: 'env env-' + mode, 'aria-hidden': 'true' },
      h('div', { class: 'env-back' }), flap, paper, h('div', { class: 'env-front' }));
    if (mode === 'closing') {
      fx(paper, 'slide-in', t0, 1.0);
      fx(flap, 'flap', t0 + 1.0, 0.8);
      env.append(fx(h('div', { class: 'env-seal' }, icon('heart')), 'pop', t0 + 1.8, 0.6));
    }
    return env;
  }

  function stepBar(lesson, current) {
    return h('div', { class: 'stepbar', 'aria-hidden': 'true' }, lesson.items.map(function (it, i) {
      var state = i < current ? 'is-done' : i === current ? 'is-current' : 'is-todo';
      return h('div', { class: 'chip ' + state, style: { '--c': it.color } },
        h('span', { class: 'chip-num' }, String(i + 1)), h('span', null, it.short));
    }));
  }

  /* ================================================================
   * 例文の見せ方（step の effect）
   * それぞれ { lines: 便箋に入る行, deco: 便箋のまわりの飾り } を返す
   * ================================================================ */

  var Effects = {
    // 上から落ちてきて便箋にのる
    drop: function (ls, t) {
      return { lines: ls.map(function (l, i) { return fx(h('div', { class: 'ex-line' }, lineNodes(l)), 'drop', t + i * 0.45, 0.8); }) };
    },

    // 1行ずつふわっと出る
    fade: function (ls, t) {
      return { lines: ls.map(function (l, i) { return fx(h('div', { class: 'ex-line' }, lineNodes(l)), 'fade-up', t + i * 0.5, 0.8); }) };
    },

    // 1文字ずつ書き込まれる（ペンが動く）
    write: function (ls, t) {
      var all = ls.map(units);
      var total = all.reduce(function (n, u) { return n + u.length; }, 0);
      var per = Math.min(0.55, Math.max(0.18, 1.4 / total));
      var k = 0;
      return {
        lines: all.map(function (us) {
          var start = t + k * per;
          var wrap = h('span', { class: 'ink-wrap' });
          us.forEach(function (u) { wrap.append(fx(u, 'ink', t + k * per, per * 1.05)); k++; });
          var dur = us.length * per;
          var pen = icon('pen', 'loop-wiggle');
          pen.style.animationDelay = start.toFixed(2) + 's';
          pen.style.animationIterationCount = String(Math.max(2, Math.round(dur / 0.25)));
          wrap.append(fx(h('span', { class: 'pen-track' }, pen), 'pen-move', start, dur));
          return h('div', { class: 'ex-line' }, wrap);
        })
      };
    },

    // やわらかく出る＋ハートがゆっくり浮かぶ＋大事な言葉にマーカー
    soft: function (ls, t) {
      var out = ls.map(function (l, i) {
        var d = t + i * 0.55;
        var row = fx(h('div', { class: 'ex-line' }, lineNodes(l)), 'soft', d, 1.0);
        row.querySelectorAll('.em').forEach(function (m) { fx(m, 'marker', d + 0.6, 0.9); });
        return row;
      });
      var hearts = [0, 1, 2].map(function (i) {
        var ic = icon('heart', 'loop-rise');
        ic.style.animationDelay = (i * 1.1).toFixed(1) + 's';
        return h('span', { class: 'heart-float hf-' + i }, ic);
      });
      return { lines: out, deco: [fx(h('div', { class: 'deco-hearts' }, hearts), 'fade', t + 0.8, 0.6)] };
    },

    // 行が出たあと、大きなチェックが描かれる
    check: function (ls, t) {
      var out = ls.map(function (l, i) { return fx(h('div', { class: 'ex-line' }, lineNodes(l)), 'fade-up', t + i * 0.5, 0.8); });
      var check = fx(h('div', { class: 'deco-check' }, icon('check')), 'draw', t + ls.length * 0.5 + 0.2, 0.7);
      return { lines: out, deco: [check] };
    },

    // 行が出て、まわりで星がやさしく光る
    glow: function (ls, t) {
      var out = ls.map(function (l, i) { return fx(h('div', { class: 'ex-line' }, lineNodes(l)), 'fade-up', t + i * 0.5, 0.8); });
      var stars = [0, 1, 2].map(function (i) {
        var ic = icon('star', 'loop-twinkle');
        ic.style.animationDelay = (i * 0.6).toFixed(1) + 's';
        return fx(h('span', { class: 'sparkle sp-' + i }, ic), 'pop', t + 0.9 + i * 0.3, 0.6);
      });
      return { lines: out, deco: stars };
    },

    // 広がった文字が、まん中にまとまっていく
    gather: function (ls, t) {
      return { lines: ls.map(function (l, i) { return fx(h('div', { class: 'ex-line' }, lineNodes(l)), 'gather', t + i * 0.4, 1.4); }) };
    }
  };

  /* ================================================================
   * 補足（step の extra）
   * ================================================================ */

  var Extras = {
    // 季節の移り変わり（春→夏→秋 …と光って pick で止まる）
    seasons: function (ex, t) {
      var chips = ex.list.map(function (s, i) {
        var chip = h('div', { class: 'season', style: { '--sc': s.color } }, icon(s.icon), h('span', { class: 'season-label' }, s.label));
        if (i < ex.pick) fx(chip, 'season-pass', t + 0.4 + i * 0.5, 0.9);
        if (i === ex.pick) fx(chip, 'season-pick', t + 0.4 + i * 0.5, 0.7);
        return chip;
      });
      return fx(h('div', { class: 'extra seasons' }, chips), 'fade-up', t, 0.6);
    },

    // 小さな補足メモ
    note: function (ex, t) {
      return fx(h('div', { class: 'extra note' }, ex.icon ? icon(ex.icon) : null, h('span', null, rich(ex.text))), 'fade-up', t + 1.2, 0.7);
    },

    // セットになる言葉（例：拝啓 → 敬具）
    pair: function (ex, t) {
      return fx(h('div', { class: 'extra pair' },
        h('span', { class: 'pair-word' }, rich(ex.from)),
        icon('arrowRight', 'pair-arrow'),
        h('span', { class: 'pair-word is-to' }, rich(ex.to)),
        ex.label ? h('span', { class: 'pair-label' }, rich(ex.label)) : null
      ), 'fade-up', t + 1.3, 0.7);
    }
  };

  /* ================================================================
   * 場面の型
   * ================================================================ */

  var Scenes = {
    title: function (s) {
      var pen = h('div', { class: 'title-pen' }, icon('pen', 'loop-float'));
      return h('section', { class: 'scene scene-title' },
        fx(h('div', { class: 'title-visual' }, envelope('open')), 'float-in', 0.1, 1.2),
        fx(pen, 'pop', 1.0, 0.6),
        h('h1', { class: 'title-text' }, lines(s.lines.join('\n')).map(function (l, i) {
          return fx(h('span', { class: 'title-line' }, lineNodes(l)), 'fade-up', 0.5 + i * 0.4, 0.8);
        })),
        s.sub ? fx(h('p', { class: 'title-sub' }, rich(s.sub)), 'pop', s.subAt != null ? s.subAt : 2.6, 0.7) : null
      );
    },

    overview: function (s, lesson) {
      var n = lesson.items.length;
      var cols = Math.min(4, Math.ceil(n / 2));
      return h('section', { class: 'scene scene-overview' },
        h('div', { class: 'ov-grid', style: { '--cols': String(cols) } }, lesson.items.map(function (it, i) {
          var last = (i + 1) % cols === 0 || i === n - 1;
          return fx(h('div', { class: 'ov-card' + (last ? ' is-row-end' : ''), style: { '--c': it.color } },
            badge(i, it.color),
            icon(it.icon, 'ov-icon'),
            h('span', { class: 'ov-label' }, rich(it.label))
          ), 'pop', 0.3 + i * 0.2, 0.6);
        })),
        fx(h('p', { class: 'ov-heading' }, rich(s.heading)), 'fade-up', s.headingAt != null ? s.headingAt : 2.2, 0.7)
      );
    },

    step: function (s, lesson) {
      var it = lesson.items[s.item];
      var effect = Effects[s.effect] || Effects.fade;
      var t = 1.3; // 例文が出はじめる時刻
      var exLines = lines(s.example);
      var ex = effect(exLines, t);
      var extra = s.extra && Extras[s.extra.kind] ? Extras[s.extra.kind](s.extra, 1.1) : null;
      // 罫線5行のうち、例文が上下まん中あたりに来るように開始行をずらす
      var rows = exLines.length * (s.size === 'xl' ? 2 : 1);
      var paper = h('div', { class: 'paper' + (s.size ? ' size-' + s.size : '') + (s.align ? ' align-' + s.align : '') },
        h('div', { class: 'paper-body', style: { '--offset': String(Math.max(0, Math.round((5 - rows) / 2))) } }, ex.lines));
      var icons = h('div', { class: 'step-icons' }, (s.icons || []).map(function (name, i) {
        return fx(h('span', { class: 'step-icon' }, icon(name, 'loop-float')), 'pop', 0.9 + i * 0.25, 0.6);
      }));
      return h('section', { class: 'scene scene-step', style: { '--c': it.color } },
        stepBar(lesson, s.item),
        h('div', { class: 'step-main' },
          h('div', { class: 'step-left' },
            h('h2', { class: 'step-head' },
              fx(badge(s.item, it.color, 'badge-lg'), 'pop', 0.1, 0.6),
              fx(h('span', { class: 'step-label' }, rich(it.label)), 'fade-left', 0.25, 0.7)
            ),
            fx(h('p', { class: 'step-desc' }, rich(s.desc)), 'fade-up', 0.6, 0.7),
            extra
          ),
          h('div', { class: 'step-right' }, fx(paper, 'paper', 0.9, 0.8), icons, ex.deco || [])
        )
      );
    },

    flow: function (s, lesson) {
      var start = s.start != null ? s.start : 0.8;
      var gap = s.interval != null ? s.interval : 0.6;
      var rows = [];
      lesson.items.forEach(function (it, i) {
        if (i) rows.push(fx(h('div', { class: 'flow-arrow' }, icon('arrowDown')), 'fade', 0.1 + i * 0.05, 0.4));
        rows.push(fx(h('div', { class: 'flow-row', style: { '--c': it.color } },
          fx(h('span', { class: 'flow-glow' }), 'lit', start + i * gap, 0.5),
          badge(i, it.color),
          h('span', { class: 'flow-label' }, rich(it.label)),
          fx(h('span', { class: 'flow-check' }, icon('check')), 'pop', start + i * gap + 0.15, 0.5)
        ), 'fade', 0.1 + i * 0.05, 0.4));
      });
      return h('section', { class: 'scene scene-flow' },
        h('div', { class: 'flow-left' },
          fx(h('h2', { class: 'flow-heading' }, rich(s.heading)), 'fade-up', 0.2, 0.7),
          fx(h('div', { class: 'flow-visual' }, icon('letter', 'loop-float')), 'pop', 0.5, 0.7)
        ),
        h('div', { class: 'flow-list' }, rows)
      );
    },

    ending: function (s, lesson) {
      var br = s.chainBreak || 0;
      var chain = h('p', { class: 'end-chain' });
      lesson.items.forEach(function (it, i) {
        if (i && br && i % br === 0) chain.append(h('br'));
        if (i) chain.append(h('span', { class: 'end-arrow' }, ' → '));
        chain.append(h('span', { class: 'end-item', style: { '--c': it.color } }, mark(i) + it.short));
      });
      return h('section', { class: 'scene scene-ending' },
        h('div', { class: 'end-text' },
          h('h2', { class: 'end-title' }, s.lines.map(function (l, i) {
            return fx(h('span', { class: 'end-line' }, lineNodes(l)), 'fade-up', 0.2 + i * 0.35, 0.8);
          })),
          fx(chain, 'fade-up', 0.9, 0.8)
        ),
        fx(h('div', { class: 'end-visual' }, envelope('closing', 0.9)), 'float-in', 0.1, 0.9)
      );
    }
  };

  /* ================================================================
   * 再生のしくみ
   * ================================================================ */

  var $ = function (id) { return document.getElementById(id); };
  var app = $('app');
  var stage = $('stage');
  var layer = $('sceneLayer');
  var bar = $('progressBar');
  var timeEl = $('time');
  var btnPlay = $('btnPlay');
  var btnRestart = $('btnRestart');
  var btnRuby = $('btnRuby');
  var btnFull = $('btnFull');
  var pausedBadge = $('pausedBadge');

  var P = {
    lesson: null, scenes: [], starts: [], total: 0,
    index: -1, elapsed: 0, playing: false, ended: false, last: 0, autoPaused: false
  };

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec + 0.001));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  function sceneAt(t) {
    for (var i = P.scenes.length - 1; i >= 0; i--) if (t >= P.starts[i]) return i;
    return 0;
  }

  function showScene(i) {
    var s = P.scenes[i];
    var render = Scenes[s.type];
    var el;
    try {
      el = render ? render(s, P.lesson) : h('section', { class: 'scene' }, '（未対応の場面: ' + s.type + '）');
    } catch (err) {
      console.error('場面の表示でエラー', s, err);
      el = h('section', { class: 'scene' });
    }
    if (i < P.scenes.length - 1) {
      el.classList.add('has-out');
      el.style.setProperty('--out', Math.max(0, s.duration - FADE_OUT).toFixed(2) + 's');
    }
    layer.replaceChildren(el);
    P.index = i;
  }

  function updateUI() {
    var ratio = P.total ? P.elapsed / P.total : 0;
    bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    timeEl.textContent = fmt(P.elapsed) + ' / ' + fmt(P.total);
  }

  function setPlayButton() {
    var playing = P.playing;
    btnPlay.querySelector('.ctrl-icon').innerHTML = svg(playing ? 'pause' : 'play');
    btnPlay.querySelector('.ctrl-label').textContent = playing ? '一時停止' : '再生';
    btnPlay.setAttribute('aria-pressed', String(!playing));
    stage.classList.toggle('is-paused', !playing && !P.ended);
    pausedBadge.hidden = playing || P.ended;
    btnRestart.classList.toggle('attention', P.ended);
  }

  function play() {
    if (P.ended) { restart(); return; }
    P.playing = true;
    P.last = performance.now();
    setPlayButton();
  }

  function pause() {
    P.playing = false;
    setPlayButton();
  }

  function toggle() { if (P.playing) pause(); else play(); }

  function jump(i) {
    i = Math.max(0, Math.min(P.scenes.length - 1, i));
    P.elapsed = P.starts[i];
    P.ended = false;
    showScene(i);
    P.last = performance.now();
    setPlayButton();
    updateUI();
  }

  function restart() {
    jump(0);
    P.playing = true;
    P.last = performance.now();
    setPlayButton();
  }

  function finish() {
    P.elapsed = P.total;
    P.playing = false;
    P.ended = true;
    setPlayButton();
  }

  function frame(now) {
    if (P.playing) {
      var dt = Math.min((now - P.last) / 1000, 0.25);
      P.elapsed += dt;
      if (P.elapsed >= P.total) finish();
      else {
        var i = sceneAt(P.elapsed);
        if (i !== P.index) showScene(i);
      }
      updateUI();
    }
    P.last = now;
    requestAnimationFrame(frame);
  }

  function setRuby(on) {
    app.classList.toggle('no-ruby', !on);
    btnRuby.setAttribute('aria-pressed', String(on));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (app.requestFullscreen) app.requestFullscreen().catch(function () {});
  }

  function buildTicks() {
    var prog = bar.parentNode;
    P.starts.slice(1).forEach(function (t) {
      prog.append(h('span', { class: 'tick', style: { left: (t / P.total * 100).toFixed(2) + '%' } }));
    });
  }

  function bindControls() {
    document.querySelectorAll('[data-icon]').forEach(function (el) { el.innerHTML = svg(el.getAttribute('data-icon')); });

    btnPlay.addEventListener('click', toggle);
    btnRestart.addEventListener('click', restart);
    btnRuby.addEventListener('click', function () { setRuby(app.classList.contains('no-ruby')); });
    if (document.fullscreenEnabled) btnFull.addEventListener('click', toggleFullscreen);
    else btnFull.hidden = true;
    stage.addEventListener('click', toggle); // 映像をクリックしても一時停止／再生

    var isSpace = function (e) { return e.code === 'Space' || e.key === ' '; };
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isSpace(e)) { e.preventDefault(); if (!e.repeat) toggle(); return; }
      var k = e.key.toLowerCase();
      if (k === 'r') restart();
      else if (k === 'f') setRuby(app.classList.contains('no-ruby'));
      else if (e.key === 'ArrowRight') { jump(P.index + 1); }
      else if (e.key === 'ArrowLeft') { jump(P.index - 1); }
    });
    // ボタンにフォーカスがあるとき、スペースでボタンが押されないようにする
    document.addEventListener('keyup', function (e) { if (isSpace(e)) e.preventDefault(); });

    // 別のタブに切り替えたら自動で一時停止し、戻ったら再開
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && P.playing) { P.autoPaused = true; pause(); }
      else if (!document.hidden && P.autoPaused) { P.autoPaused = false; play(); }
    });
  }

  function start(lesson) {
    if (!lesson || !Array.isArray(lesson.scenes) || !lesson.scenes.length) {
      layer.replaceChildren(h('section', { class: 'scene' }, h('p', { class: 'error' }, '教材データが読み込めませんでした。')));
      return;
    }
    P.lesson = lesson;
    P.scenes = lesson.scenes;
    var t = 0;
    P.starts = P.scenes.map(function (s) { var st = t; t += Number(s.duration) || 0; return st; });
    P.total = t;
    if (lesson.title) document.title = lesson.title;
    setRuby(lesson.furigana !== false);
    buildTicks();
    bindControls();
    jump(0);
    play();
    requestAnimationFrame(frame);
  }

  // ?lesson=名前 で assets/lessons/名前.js を読み込む（なければ index.html で読み込んだ教材）
  function loadLesson(done) {
    var name = new URLSearchParams(location.search).get('lesson');
    if (!name || !/^[a-z0-9_-]+$/i.test(name) || (window.LESSON && window.LESSON.id === name)) { done(window.LESSON); return; }
    var fallback = window.LESSON;
    var el = document.createElement('script');
    el.src = 'assets/lessons/' + name + '.js';
    el.onload = function () { done(window.LESSON); };
    el.onerror = function () { console.warn('教材が見つかりません: ' + name); done(fallback); };
    document.head.append(el);
  }

  // フォントの読み込みを少しだけ待ってから開始（文字のガタつき防止）
  function whenFontsReady(cb) {
    var called = false;
    var go = function () { if (!called) { called = true; cb(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
    setTimeout(go, 1200);
  }

  loadLesson(function (lesson) { whenFontsReady(function () { start(lesson); }); });
})();
