/**
 * GHA Game SDK — v1.0
 *
 * Drop-in SDK for external game developers. Replaces custom StartGame /
 * GameOver / score UI with GHA-native overlays and wires up the full
 * postMessage protocol so the platform can manage sessions, scoring, and
 * leaderboards.
 *
 * Usage (in your game's HTML):
 *   <script src="https://gamehub-arena.com/js/gha-game-sdk.js"></script>
 *   <script>
 *     GHA.ready();                    // signal "game loaded"
 *     GHA.onStart(function(config) {  // platform says "go"
 *       startMyGame(config);
 *     });
 *
 *     // when the player loses / wins:
 *     GHA.endGame({ score: 4200, won: true, message: 'Level 5 cleared!' });
 *   </script>
 *
 * Works in standalone mode too — the SDK falls back gracefully when the page
 * is not embedded inside a GHA iframe (useful for local development).
 */
(function (global) {
  'use strict';

  /* ─────────────────────────── guard ──────────────────────────────────── */
  if (global.GHA && global.GHA._sdk) return; // already loaded

  /* ─────────────────────────── constants ──────────────────────────────── */
  var IN_IFRAME = global.self !== global.top;
  var PLATFORM_ORIGIN = '*'; // postMessage target — '*' safe for cross-origin iframes
  var STANDALONE_START_DELAY = 800; // ms before auto-firing onStart in standalone mode

  /* ─────────────────────────── state ──────────────────────────────────── */
  var _startCb = null;
  var _moveCb = null;
  var _pauseCb = null;
  var _resumeCb = null;
  var _sessionStarted = false;
  var _gameEnded = false;
  var _splashEl = null;
  var _gameOverEl = null;
  var _config = { mode: 'solo', isHost: false, playerIndex: 0, playerCount: 1 };
  var _standaloneTimer = null;

  /* ─────────────────────────── postMessage helpers ─────────────────────── */
  function _post(type, payload) {
    if (!IN_IFRAME) return;
    try {
      global.parent.postMessage(Object.assign({ type: type }, payload || {}), PLATFORM_ORIGIN);
    } catch (e) {
      console.warn('[GHA SDK] postMessage failed:', e.message);
    }
  }

  /* ─────────────────────────── CSS theme tokens ───────────────────────── */
  // Inline fallback values mirroring GHA CSS variables — used when the host
  // page doesn't inject the platform stylesheet.
  var T = {
    bg:           'var(--bg,           #0a0c12)',
    bgCard:       'var(--bg-card,      #10131c)',
    bgElevated:   'var(--bg-elevated,  #1a1e2e)',
    bgSurface:    'var(--bg-surface,   #141824)',
    accent:       'var(--accent,       #f0a830)',
    accentDim:    'var(--accent-dim,   rgba(240,168,48,0.15))',
    success:      'var(--success,      #4ade80)',
    danger:       'var(--danger,       #f87171)',
    text:         'var(--text,         #e8eaf0)',
    textDim:      'var(--text-dim,     #8892aa)',
    textMuted:    'var(--text-muted,   #4a5268)',
    border:       'var(--border,       rgba(255,255,255,0.08))',
    radius:       'var(--radius,       12px)',
    radiusSm:     'var(--radius-sm,    8px)'
  };

  /* ─────────────────────────── overlay factory ────────────────────────── */
  function _overlay(zIndex) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:' + zIndex,
      'background:rgba(0,0,0,0.72)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'animation:gha-fadein .25s ease'
    ].join(';');
    // inject animation keyframes once
    if (!document.getElementById('gha-sdk-style')) {
      var s = document.createElement('style');
      s.id = 'gha-sdk-style';
      s.textContent = [
        '@keyframes gha-fadein{from{opacity:0}to{opacity:1}}',
        '@keyframes gha-slideup{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}',
        '@keyframes gha-spin{to{transform:rotate(360deg)}}'
      ].join('');
      document.head.appendChild(s);
    }
    return el;
  }

  function _card(extraStyle) {
    var el = document.createElement('div');
    el.style.cssText = [
      'background:' + T.bgCard,
      'border:1px solid ' + T.border,
      'border-radius:' + T.radius,
      'padding:32px 28px',
      'max-width:380px', 'width:88%',
      'text-align:center',
      'animation:gha-slideup .3s ease',
      'position:relative',
      extraStyle || ''
    ].join(';');
    return el;
  }

  function _btn(label, primary, onClick) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = [
      'display:inline-flex', 'align-items:center', 'justify-content:center',
      'padding:10px 22px', 'border-radius:' + T.radiusSm,
      'font-size:0.88rem', 'font-weight:600', 'cursor:pointer',
      'border:none', 'outline:none', 'transition:opacity .15s',
      primary
        ? 'background:' + T.accent + ';color:#0a0c12;'
        : 'background:' + T.bgElevated + ';color:' + T.text + ';border:1px solid ' + T.border + ';'
    ].join(';');
    b.addEventListener('mouseover', function () { b.style.opacity = '0.85'; });
    b.addEventListener('mouseout',  function () { b.style.opacity = '1'; });
    b.addEventListener('click', onClick);
    return b;
  }

  function _label(text, size, color) {
    var el = document.createElement('p');
    el.textContent = text;
    el.style.cssText = 'margin:0;font-size:' + (size || '0.9rem') + ';color:' + (color || T.textDim) + ';line-height:1.5';
    return el;
  }

  /* ─────────────────────────── splash screen ─────────────────────────── */
  function _showSplash() {
    if (_splashEl) return;
    var overlay = _overlay(9000);
    var card = _card('max-width:320px');

    // GHA logo mark (SVG trophy / gamepad icon)
    var logo = document.createElement('div');
    logo.style.cssText = 'width:56px;height:56px;margin:0 auto 16px;background:' + T.accentDim + ';border-radius:50%;display:flex;align-items:center;justify-content:center;';
    logo.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' + T.accent.replace(/var\(.*?,\s*/, '').replace(')', '') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M6 11h4m-2-2v4"/><circle cx="16" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="11" r="1" fill="currentColor" stroke="none"/></svg>';

    var title = document.createElement('div');
    title.style.cssText = 'font-size:1.2rem;font-weight:700;color:' + T.text + ';margin-bottom:6px;letter-spacing:0.02em';
    title.textContent = 'GameHub Arena';

    var sub = _label('Game loading\u2026', '0.82rem');

    // spinner
    var ring = document.createElement('div');
    ring.style.cssText = 'width:28px;height:28px;border:3px solid ' + T.border + ';border-top-color:' + T.accent.replace(/var\(.*?,\s*/, '').replace(')', '') + ';border-radius:50%;margin:18px auto 0;animation:gha-spin .7s linear infinite';

    card.appendChild(logo);
    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(ring);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    _splashEl = overlay;
  }

  function _hideSplash() {
    if (!_splashEl) return;
    _splashEl.style.opacity = '0';
    _splashEl.style.transition = 'opacity .2s';
    var el = _splashEl;
    _splashEl = null;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
  }

  /* ─────────────────────────── game-over overlay ──────────────────────── */
  function _showGameOver(opts) {
    if (_gameOverEl) return;
    opts = opts || {};
    var score = opts.score != null ? opts.score : null;
    var won   = opts.won != null ? opts.won : null;
    var msg   = opts.message || (won === true ? 'You won!' : won === false ? 'Game over' : 'Game over');

    var overlay = _overlay(9100);
    var card = _card();

    // icon
    var icon = document.createElement('div');
    icon.style.cssText = 'font-size:2.4rem;margin-bottom:12px;line-height:1';
    icon.textContent = won === true ? '\uD83C\uDFC6' : won === false ? '\uD83D\uDCA5' : '\uD83C\uDFAE';

    // result title
    var titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:1.4rem;font-weight:700;color:' + T.text + ';margin-bottom:8px';
    titleEl.textContent = msg;

    // score display
    var scoreEl = null;
    if (score !== null && score !== undefined) {
      scoreEl = document.createElement('div');
      scoreEl.style.cssText = [
        'margin:16px auto', 'padding:14px 24px',
        'background:' + T.accentDim,
        'border:1px solid ' + T.accent.replace(/var\(.*?,\s*/, '').replace(')', ''),
        'border-radius:' + T.radiusSm,
        'display:inline-block'
      ].join(';');
      var scoreNum = document.createElement('div');
      scoreNum.style.cssText = 'font-size:2rem;font-weight:800;color:' + T.accent.replace(/var\(.*?,\s*/, '').replace(')', '') + ';line-height:1';
      scoreNum.textContent = _formatScore(score);
      var scoreLbl = _label('SCORE', '0.68rem', T.textMuted.replace(/var\(.*?,\s*/, '').replace(')', ''));
      scoreLbl.style.marginTop = '4px';
      scoreEl.appendChild(scoreNum);
      scoreEl.appendChild(scoreLbl);
    }

    // buttons
    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap';

    var playAgainBtn = _btn('Play Again', true, function () {
      _removeGameOver();
      _gameEnded = false;
      _sessionStarted = false;
      // re-fire onStart so developer can reset state
      if (_startCb) {
        try { _startCb(_config); } catch (e) {}
      }
      _post('GHA_SESSION_START');
      _sessionStarted = true;
    });

    var lbBtn = _btn('Leaderboard', false, function () {
      GHA.openLeaderboard();
    });

    btnRow.appendChild(playAgainBtn);
    btnRow.appendChild(lbBtn);

    card.appendChild(icon);
    card.appendChild(titleEl);
    if (scoreEl) card.appendChild(scoreEl);
    card.appendChild(btnRow);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    _gameOverEl = overlay;
  }

  function _removeGameOver() {
    if (!_gameOverEl) return;
    _gameOverEl.style.opacity = '0';
    _gameOverEl.style.transition = 'opacity .2s';
    var el = _gameOverEl;
    _gameOverEl = null;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
  }

  /* ─────────────────────────── score formatter ────────────────────────── */
  function _formatScore(score) {
    if (typeof score !== 'number') return String(score);
    return score.toLocaleString();
  }

  /* ─────────────────────────── message listener ───────────────────────── */
  function _onMessage(e) {
    var msg = e.data;
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'GHA_START':
        _hideSplash();
        if (_standaloneTimer) { clearTimeout(_standaloneTimer); _standaloneTimer = null; }
        _config = (msg.config && typeof msg.config === 'object') ? msg.config : _config;
        _removeGameOver();
        _gameEnded = false;
        if (_startCb) {
          try { _startCb(_config); } catch (e) {}
        }
        break;
      case 'GHA_MOVE_IN':
        if (_moveCb && msg.data !== undefined) {
          try { _moveCb(msg.data); } catch (e) {}
        }
        break;
      case 'GHA_PAUSE':
        if (_pauseCb) { try { _pauseCb(); } catch (e) {} }
        break;
      case 'GHA_RESUME':
        if (_resumeCb) { try { _resumeCb(); } catch (e) {} }
        break;
    }
  }

  global.addEventListener('message', _onMessage);

  /* ─────────────────────────── standalone helpers ────────────────────── */
  function _autoStartStandalone() {
    if (IN_IFRAME) return;
    _standaloneTimer = setTimeout(function () {
      _hideSplash();
      if (_startCb) {
        try { _startCb(_config); } catch (e) {}
      }
    }, STANDALONE_START_DELAY);
  }

  /* ─────────────────────────── public API ─────────────────────────────── */
  var GHA = {
    _sdk: true,
    _version: '1.0.0',

    /**
     * Signal that the game page has loaded and is ready to receive GHA_START.
     * Call this as early as possible — ideally right after the SDK script tag.
     * Shows a branded splash screen while the platform prepares the session.
     */
    ready: function () {
      _showSplash();
      _post('GHA_READY');
      _post('GHA_BRIDGE_READY');
      // In standalone mode, auto-start after a short delay
      _autoStartStandalone();
    },

    /**
     * Register a callback to be called when the platform starts the game.
     * @param {function(config)} cb  Receives { mode, isHost, playerIndex, playerCount }
     */
    onStart: function (cb) {
      _startCb = cb;
    },

    /**
     * Hide the splash screen and signal session start to the platform.
     * Call this when your game is fully initialised and the first frame renders.
     * Not required if you rely on onStart() alone.
     */
    startGame: function () {
      _hideSplash();
      if (!_sessionStarted) {
        _post('GHA_SESSION_START');
        _sessionStarted = true;
      }
    },

    /**
     * End the current game session. Shows the GHA game-over overlay and
     * reports the result to the platform.
     * @param {object} opts
     * @param {number}  [opts.score]    Final score (numeric, optional)
     * @param {boolean} [opts.won]      true = win, false = loss, undefined = neutral
     * @param {string}  [opts.message]  Custom result message shown in the overlay
     */
    endGame: function (opts) {
      if (_gameEnded) return;
      _gameEnded = true;
      opts = opts || {};
      var score = opts.score != null ? opts.score : null;
      // submit score to platform first
      if (score !== null) {
        _post('GHA_SCORE', { score: score });
      }
      // notify platform session ended
      _post('GHA_END', { score: score, won: opts.won });
      _post('GHA_SESSION_END', { score: score });
      // show overlay
      _showGameOver(opts);
    },

    /**
     * Send a mid-game score checkpoint (does NOT end the game).
     * @param {number} score
     */
    submitScore: function (score) {
      _post('GHA_SCORE', { score: score });
    },

    /**
     * Send a multiplayer move to the platform / other players.
     * @param {*} data  Any JSON-serialisable value
     */
    sendMove: function (data) {
      _post('GHA_MOVE_OUT', { data: data });
    },

    /**
     * Register a callback to receive opponent moves.
     * @param {function(data)} cb
     */
    onMove: function (cb) {
      _moveCb = cb;
    },

    /**
     * Register a callback for when the platform pauses the game
     * (e.g. user minimises the app or switches tab).
     * @param {function} cb
     */
    onPause: function (cb) {
      _pauseCb = cb;
    },

    /**
     * Register a callback for when the platform resumes the game.
     * @param {function} cb
     */
    onResume: function (cb) {
      _resumeCb = cb;
    },

    /**
     * Ask the platform to open the leaderboard overlay for this game.
     */
    openLeaderboard: function () {
      _post('GHA_OPEN_LEADERBOARD');
    },

    /**
     * Check whether the SDK is running inside a GHA iframe.
     * @returns {boolean}
     */
    isEmbedded: function () {
      return IN_IFRAME;
    },

    /**
     * The config object received from the platform on GHA_START.
     * Available after onStart fires.
     * @returns {{ mode: string, isHost: boolean, playerIndex: number, playerCount: number }}
     */
    getConfig: function () {
      return _config;
    }
  };

  global.GHA = GHA;

}(window));
