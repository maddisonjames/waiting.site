window.initMinesweeper = function () {
    const canvas = document.getElementById('_mine_canvas') || document.getElementById('_minesweeper_canvas');
    if (!canvas) return;
    if (window.__minesweeperRunning) return;           // never start two game loops
    window.__minesweeperRunning = true;

    // ==========================================
    // 1. CANVAS, PALETTE, FONT
    // ==========================================
    const SIZE = 360;                                  // logical size; the backing store is a multiple of it so everything stays sharp
    let SCALE = 0;
    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.style.touchAction = 'none';
    canvas.style.imageRendering = 'auto';
    if (!canvas.hasAttribute('aria-label')) {
        canvas.setAttribute('aria-label', 'Minesweeper. Arrow keys or WASD move, Space opens, F flags, C chords, P pings.');
    }
    const winEl = canvas.closest('.win');

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function fitCanvas() {
        let w = 0;
        try { w = canvas.getBoundingClientRect().width || 0; } catch (e) { /* not laid out yet */ }
        const m = clamp(Math.ceil((w * (window.devicePixelRatio || 1)) / SIZE) || 2, 2, 4);
        if (m !== SCALE) { SCALE = m; canvas.width = SIZE * m; canvas.height = SIZE * m; }
    }

    // the game has its own look (always dark); only the font follows the site's style preset
    const COL = {
        bg: '#10141b', rule: '#262e3b', muted: '#7a8698', text: '#e6e2d3', accent: '#e8452c', amber: '#f2c14e', good: '#7bd88f',
        fog: '#18202c', fogHi: '#2b3b55', hatch: '#243044', hatchHi: '#3b4d6a', paper: '#0a0e14', ink: '#171b22', flag: '#c9cfdb',
        cyan: '#3ad7ff', magenta: '#ff3b5c', bone: '#ebe4d0', frame: '#566478', line: '#3a4658', off: '#46505f',
        tileEdge: '#1a2433', tileTick: '#3a4a64', dust: '#1c2636', reg: '#2f3a4a', spark: '#fff3b0',
    };
    const NUM_COL = [null, '#5aa9ff', '#5ee08a', '#ff5b45', '#c08cff', '#ffb23e', '#3fe0d0', '#f0ead8', '#9aa6b8'];
    const FX_DUST = ['#ffffff', '#6f7fb0', '#cfd8ff'];
    const FX_GEM = [COL.amber, '#ffffff', '#ffe08a'];
    const FX_BOOM = [COL.accent, COL.amber, COL.bone, '#ffffff'];
    const FX_CHAIN = [COL.accent, COL.amber, COL.bone];
    const FX_TREMOR = ['#6f7fb0', '#9fb0e0', '#cfd8ff'];

    let FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    function readFont() {
        try {
            const f = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
            if (f) FONT = f;
        } catch (e) { /* keep the default font */ }
    }

    const rint = (n) => (Math.random() * n) | 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    function txt(s, x, y, o) {
        o = o || {};
        ctx.font = (o.weight || 'bold') + ' ' + (o.size || 12) + 'px ' + FONT;
        ctx.textAlign = o.align || 'left';
        ctx.textBaseline = 'middle';
        try { ctx.letterSpacing = o.ls || '0px'; } catch (e) { /* unsupported */ }
        if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, x, y + (o.sy === undefined ? 1 : o.sy)); }
        ctx.fillStyle = o.color || COL.text;
        ctx.fillText(s, x, y);
    }
    function textWidth(t, size) {
        try { ctx.font = 'bold ' + size + 'px ' + FONT; const w = ctx.measureText(t).width; if (w > 0) return w; } catch (e) { /* fall through */ }
        return t.length * size * 0.62;
    }

    // ==========================================
    // 2. LEVELS ("sectors")
    //   Every sector is bigger and denser than the last. Special rules come in on a cycle:
    //     TREMOR  (sectors 3, 6, 9 ...)  a hidden mine hops to a neighbouring tile every few safe moves
    //     WRAP    (sectors 4, 8, 12 ...) the edges connect like a donut
    //     TIMED   (sectors 5, 10, 15 ...) beat the clock or the sector collapses
    //   Some sectors (12, 15 ...) stack two rules. A mine ends the run and sends you back to sector 1.
    // ==========================================
    const START_PINGS = 2, MAX_PINGS = 5, MAX_LEVEL = 99;
    const COMBO = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'x', 'arrowleft'];   // same code as the other games
    const COMBO_GAP = 2000;
    const STEP = 1000 / 60;
    const LONG_PRESS_MS = 450, GIVE_UP_CONFIRM_MS = 1500;
    const SCORE_KEY = '_ms_scores', MAX_SCORES = 8;

    // layout (fixed canvas; the board always fills the play area)
    const MG = 10, BOARD_TOP = 70, AXIS = 14, FOOT_H = 22, FOOT_Y = SIZE - MG - FOOT_H;
    const AVAIL_H = FOOT_Y - 12 - (BOARD_TOP + AXIS), AVAIL_W = SIZE - MG * 2 - AXIS - 6;
    function params(l) {
        // sector 1 starts with big friendly tiles; every sector adds a row of smaller ones until the board is full
        const rowsN = Math.min(16, 6 + l);
        const cs = Math.floor(AVAIL_H / rowsN);
        const colsN = Math.floor(AVAIL_W / cs);
        const cells = rowsN * colsN;
        const dens = Math.min(0.27, 0.125 + (l - 1) * 0.011);
        const timed = l >= 5 && l % 5 === 0;
        return {
            rowsN, colsN, cs,
            mines: Math.min(Math.round(cells * dens), Math.floor(cells * 0.3)),
            gems: Math.min(5, 1 + Math.floor(l / 3)),
            torus: l % 4 === 0,
            tremor: l >= 3 && l % 3 === 0 ? Math.max(3, 9 - Math.floor(l / 3)) : 0,
            timed,
            limit: timed ? Math.round((cells * 0.55 + 25) * (1 - Math.min(0.3, (l - 5) * 0.012))) : 0,
            par: Math.round(cells * 0.45 + 20),
        };
    }

    // ==========================================
    // 3. GAME STATE
    // ==========================================
    // tile states
    const HIDDEN = 0, OPEN = 1, FLAG = 2, QUESTION = 3, HIT = 4;

    let level = 1, score = 0, streak = 0, pings = START_PINGS, usedPings = 0, P = params(1);
    let cols = 10, rows = 7, N = 70, nMines = 9, cs = 34, ox = 0, oy = 0, bw = 0, bh = 0;
    let mine, st, gem, adj, flashN, nb, appear, dist, boomAt;
    let started = false, revealed = 0, actions = 0;
    let state = 'ready';                               // ready | play | won | lost
    let glitch = 0, dScore = 0, scorePop = 0, lastScore = 0;
    let secs = 0, startAt = 0, tick = 0, shake = 0, endT = 0, lostMax = 0, reason = '', hudFlash = null;
    let hover = -1, downIdx = -1, downBtn = 0, downAt = 0, longFired = false, downTouch = false, giveUpAt = 0, hoverBtn = null;
    let pingMode = false, flagMode = false, pingFx = null, showScores = false, kc = -1, kbActive = false;
    let breakdown = [], recorded = false, myEntry = null;
    const cheats = { peek: false, noTremor: false, noTimer: false };
    let cheatPanel = null, cheatInfo = null, cheatStatus = null;
    const parts = [], rings = [];

    function loadScores() {
        try {
            const raw = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
            if (!Array.isArray(raw)) return [];
            return raw.filter((e) => e && Number.isFinite(e.s) && Number.isFinite(e.l))
                .sort((a, b) => b.s - a.s).slice(0, MAX_SCORES);
        } catch (e) { return []; }
    }
    let scores = loadScores();
    const saveScores = () => { try { localStorage.setItem(SCORE_KEY, JSON.stringify(scores)); } catch (e) { /* storage blocked */ } };

    const BTN_PING = { id: 'ping', x: MG + 4, y: FOOT_Y, w: 104, h: FOOT_H };
    const BTN_FLAG = { id: 'flag', x: MG + 118, y: FOOT_Y, w: 72, h: FOOT_H };
    const BTN_SCORE = { id: 'scores', x: MG + 200, y: FOOT_Y, w: 72, h: FOOT_H };
    const BTN_GIVE = { id: 'give', x: SIZE - MG - 80, y: FOOT_Y, w: 76, h: FOOT_H };   // x/w follow the label, see drawFooter
    const BTNS = [BTN_PING, BTN_FLAG, BTN_SCORE, BTN_GIVE];

    const rowOf = (i) => (i / cols) | 0;
    const colOf = (i) => i % cols;
    const centre = () => (rows >> 1) * cols + (cols >> 1);

    // calls fn(index) for every tile in the square of radius rad around i (wrapping on torus sectors, each tile once)
    function forArea(i, rad, fn) {
        const r0 = rowOf(i), c0 = colOf(i), seen = new Set();
        for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
            let r = r0 + dr, c = c0 + dc;
            if (P.torus) { r = (r + rows) % rows; c = (c + cols) % cols; }
            else if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
            const j = r * cols + c;
            if (!seen.has(j)) { seen.add(j); fn(j); }
        }
    }

    function buildNeighbours() {
        nb = [];
        for (let i = 0; i < N; i++) {
            const out = [];
            forArea(i, 1, (j) => { if (j !== i) out.push(j); });
            nb.push(out);
        }
    }

    function newBoard() {
        P = params(level);
        cols = P.colsN; rows = P.rowsN; N = cols * rows; nMines = P.mines; cs = P.cs;
        bw = cols * cs; bh = rows * cs;
        ox = Math.round(MG + AXIS + 3 + (AVAIL_W - bw) / 2);
        oy = Math.round(BOARD_TOP + AXIS + (AVAIL_H - bh) / 2);
        mine = new Uint8Array(N); st = new Uint8Array(N); gem = new Uint8Array(N); adj = new Uint8Array(N);
        flashN = new Int16Array(N); appear = new Int32Array(N); dist = new Uint16Array(N); boomAt = new Int32Array(N).fill(-1);
        buildNeighbours();
        started = false; revealed = 0; actions = 0; usedPings = 0;
        state = 'ready'; secs = 0; endT = 0; lostMax = 0; shake = 0; reason = ''; breakdown = [];
        pingFx = null; pingMode = false; showScores = false; recorded = false; myEntry = null; giveUpAt = 0;
        hover = -1; downIdx = -1; kc = -1;
        parts.length = 0; rings.length = 0;
        updateCheatInfo();
    }
    function newRun() {
        level = 1; score = 0; streak = 0; pings = START_PINGS;
        newBoard();
    }
    function nextLevel() {
        level = Math.min(MAX_LEVEL, level + 1);
        pings = Math.min(MAX_PINGS, pings + 1);
        newBoard();
    }

    // k distinct random items from arr (partial Fisher-Yates; shuffles arr in place)
    function pickRandom(arr, k) {
        const n = Math.min(k, arr.length);
        for (let a = 0; a < n; a++) {
            const b = a + rint(arr.length - a);
            const t = arr[a]; arr[a] = arr[b]; arr[b] = t;
        }
        return arr.slice(0, n);
    }

    // Mines are placed on the first click, never on or next to it, so the first move always opens something
    function placeMines(first) {
        const safe = new Set([first, ...nb[first]]);
        const pool = [];
        for (let i = 0; i < N; i++) if (!safe.has(i)) pool.push(i);
        const placed = pickRandom(pool, nMines);
        for (const i of placed) mine[i] = 1;
        nMines = placed.length;                        // keeps the win check honest if the board was too small
        computeAdj();
        // gems sit on safe tiles: a glint is always a free open, and it earns a ping and points
        const cand = [];
        for (let i = 0; i < N; i++) if (!mine[i] && i !== first) cand.push(i);
        for (const i of pickRandom(cand, P.gems)) gem[i] = 1;
    }
    function computeAdj() {
        for (let i = 0; i < N; i++) { let n = 0; for (const j of nb[i]) n += mine[j]; adj[i] = n; }
    }

    // ==========================================
    // 4. EFFECTS
    // ==========================================
    const cx = (i) => ox + colOf(i) * cs + cs / 2, cy = (i) => oy + rowOf(i) * cs + cs / 2;
    function burst(x, y, n, colors, speed, life, grav, size, wait) {
        if (parts.length > 500) return;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, v = speed * (0.25 + Math.random() * 0.75);
            parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * rnd(0.6, 1), max: life, g: grav, c: colors[i % colors.length], s: size || 1.5, wait: wait || 0 });
        }
    }
    function ringFx(x, y, r1, life, col, wait) { rings.push({ x, y, r: 1, r1, life, max: life, c: col, wait: wait || 0 }); }
    function floatText(x, y, t, col, wait) { parts.push({ x, y, vx: 0, vy: -0.45, life: 56, max: 56, g: 0, c: col, s: 1, wait: wait || 0, t }); }

    // ==========================================
    // 5. RULES
    // ==========================================
    const isClosed = (i) => st[i] === HIDDEN || st[i] === QUESTION;
    const flagsUsed = () => { let f = 0; for (let i = 0; i < N; i++) if (st[i] === FLAG) f++; return f; };
    const minesLeft = () => nMines - flagsUsed();
    const mult = () => 1 + Math.min(4, Math.floor(streak / 5));
    const timeLeft = () => Math.max(0, P.limit - secs);
    const elapsed = () => Math.min(9999, Math.floor((performance.now() - startAt) / 1000));
    function startClock() { state = 'play'; startAt = performance.now(); secs = 0; }

    // opens a tile and everything it cascades into; the cascade ripples outwards (appear = when each tile shows)
    function flood(start) {
        const q = [start];
        st[start] = OPEN; dist[start] = 0;
        for (let h = 0; h < q.length; h++) {
            const k = q[h], d = dist[k];
            appear[k] = tick + d * 2;
            if (d < 16) burst(cx(k), cy(k), 2, FX_DUST, 1.0, 24, 0.05, 1.5, d * 2);
            if (gem[k]) {
                gem[k] = 0; pings = Math.min(MAX_PINGS, pings + 1);
                score += 100;
                burst(cx(k), cy(k), 20, FX_GEM, 2.2, 34, 0.03, 2, d * 2);
                ringFx(cx(k), cy(k), cs * 2.2, 26, COL.amber, d * 2);
                floatText(cx(k), cy(k) - 6, '+PING +100', COL.amber, d * 2);
            }
            if (adj[k] === 0) for (const j of nb[k]) if (isClosed(j) && !mine[j]) { st[j] = OPEN; dist[j] = d + 1; q.push(j); }
        }
        const n = q.length;
        revealed += n;
        const pts = 10 * n * mult();
        score += pts;
        floatText(cx(start), cy(start), '+' + pts, '#ffffff');
        return n;
    }

    function openCell(i) {
        if (!isClosed(i)) return false;
        if (!started) { started = true; placeMines(i); startClock(); }
        if (mine[i]) { explode(i); return true; }
        flood(i);
        streak++;
        afterMove();
        return true;
    }

    // picks where a time-out or give-up blast starts: a random unflagged mine, or the middle of the board
    function blastOrigin() {
        const c = [];
        for (let i = 0; i < N; i++) if (mine[i] && st[i] !== FLAG) c.push(i);
        return c.length ? c[rint(c.length)] : centre();
    }

    // hitIdx is the mine the player stepped on, or -1 when the run ends some other way (why = 'TIME UP' / 'GAVE UP')
    function explode(hitIdx, why) {
        const hit = hitIdx >= 0;
        const i = hit ? hitIdx : blastOrigin();
        if (hit) st[i] = HIT;
        state = 'lost'; endT = 0; reason = why || '';
        secs = elapsed();
        shake = 14; hudFlash = { c: COL.accent, t: 40 };
        const x = cx(i), y = cy(i);
        burst(x, y, 44, FX_BOOM, 3.0, 36, 0.06, 2.5);
        ringFx(x, y, cs * 5, 28, COL.accent); ringFx(x, y, cs * 7, 36, COL.amber, 4);
        const r0 = rowOf(i), c0 = colOf(i);
        lostMax = tick;
        for (let k = 0; k < N; k++) {
            if (!mine[k] || st[k] === FLAG || (hit && k === i)) continue;
            const d = Math.hypot(rowOf(k) - r0, colOf(k) - c0);
            boomAt[k] = tick + 10 + Math.floor(d * 2.2);
            lostMax = Math.max(lostMax, boomAt[k]);
        }
    }

    function chord(i) {
        if (st[i] !== OPEN || adj[i] === 0) return;
        let f = 0;
        for (const j of nb[i]) if (st[j] === FLAG) f++;
        if (f !== adj[i]) return;
        let moved = false;
        for (const j of nb[i]) if (isClosed(j)) {
            if (mine[j]) { explode(j); return; }
            flood(j); moved = true;
        }
        if (moved) { streak++; afterMove(); }
    }

    // right click cycles: hidden -> flag -> question mark -> hidden
    function cycleMark(i) {
        if (state === 'won' || state === 'lost') return;
        if (st[i] === HIDDEN) { st[i] = FLAG; burst(cx(i), cy(i), 6, [COL.accent, COL.bone], 1.4, 18, 0.03, 1.5); }
        else if (st[i] === FLAG) st[i] = QUESTION;
        else if (st[i] === QUESTION) st[i] = HIDDEN;
    }

    function afterMove() {
        if (state === 'lost') return;
        if (revealed >= N - nMines) { win(); return; }
        actions++;
        if (P.tremor && !cheats.noTremor && actions % P.tremor === 0) tremor();
    }

    function win() {
        state = 'won'; endT = 0; hudFlash = { c: COL.good, t: 40 };
        secs = elapsed();
        for (let i = 0; i < N; i++) if (mine[i]) st[i] = FLAG;
        const clearB = 100 * level;
        const timeB = Math.max(0, (P.timed ? P.limit : P.par) - secs) * 3;
        const noPing = usedPings === 0 ? 150 : 0;
        breakdown = [['LEVEL CLEAR', clearB], ['TIME BONUS', timeB]];
        if (noPing) breakdown.push(['NO PINGS', noPing]);
        score += clearB + timeB + noPing;
    }

    // run over: back to sector 1 after this. The score goes on the best-runs list.
    function recordScore() {
        recorded = true;
        if (score <= 0) return;
        myEntry = { s: score, l: level, d: Date.now() };
        scores.push(myEntry);
        scores.sort((a, b) => b.s - a.s);
        scores = scores.slice(0, MAX_SCORES);
        if (!scores.includes(myEntry)) myEntry = null;
        saveScores();
    }

    // sonar: counts the mines in the 5x5 area around a tile (limited uses, gems recharge it)
    function ping(i) {
        pingMode = false;
        if (!started || state !== 'play' || pings <= 0) return;
        pings--; usedPings++; streak = 0;
        const cells = [];
        let n = 0;
        forArea(i, 2, (j) => { cells.push(j); n += mine[j]; });
        pingFx = { i, n, cells, t: 180 };
        ringFx(cx(i), cy(i), cs * 3.2, 34, COL.amber); ringFx(cx(i), cy(i), cs * 3.2, 34, COL.bone, 8);
    }

    // A tremor moves one hidden, unmarked mine to a neighbouring hidden tile. Marked tiles never move.
    function tremor() {
        shake = Math.max(shake, 9);
        for (let k = 0; k < 26; k++) {
            const i = rint(N);
            if (st[i] === HIDDEN) burst(cx(i), cy(i) + cs / 3, 1, FX_TREMOR, 0.7, 36, -0.012, 1.5, rint(12));
        }
        const cand = [];
        for (let m = 0; m < N; m++) {
            if (!mine[m] || st[m] !== HIDDEN) continue;
            const targets = nb[m].filter((t) => st[t] === HIDDEN && !mine[t]);
            if (targets.length) cand.push([m, targets]);
        }
        if (!cand.length) return;
        const [m, targets] = cand[rint(cand.length)];
        const t = targets[rint(targets.length)];
        mine[m] = 0; mine[t] = 1;
        if (gem[t]) { gem[m] = 1; gem[t] = 0; }          // a gem never ends up under a mine
        for (const j of nb[m]) adj[j]--;
        for (const j of nb[t]) adj[j]++;
        const inM = new Set(nb[m]), inT = new Set(nb[t]);
        for (const j of new Set([...inM, ...inT])) {
            if (inM.has(j) !== inT.has(j) && st[j] === OPEN) flashN[j] = 150;   // numbers that changed pulse
        }
    }

    // ==========================================
    // 6. INPUT
    // ==========================================
    let activeCache = true;                            // false while the game's window is hidden/faded out
    function refreshActive() {
        if (!winEl) { activeCache = true; return; }
        let o = 1;
        try { o = parseFloat(getComputedStyle(winEl).opacity); } catch (e) { /* assume visible */ }
        activeCache = !(o < 0.05);
    }
    const isTyping = (e) => {
        const t = e.target;
        return !!t && (t.isContentEditable || (typeof t.matches === 'function' && t.matches('input, textarea, select')));
    };
    const inBtn = (p, b) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
    function posOf(e) {
        const b = canvas.getBoundingClientRect();
        return { x: ((e.clientX - b.left) / b.width) * SIZE, y: ((e.clientY - b.top) / b.height) * SIZE };
    }
    function cellAtXY(p) {
        const c = Math.floor((p.x - ox) / cs), r = Math.floor((p.y - oy) / cs);
        if (c < 0 || c >= cols || r < 0 || r >= rows) return -1;
        return r * cols + c;
    }
    const playing = () => state === 'ready' || state === 'play';
    const giveUpArmed = () => giveUpAt > 0 && state === 'play' && performance.now() - giveUpAt < GIVE_UP_CONFIRM_MS;

    // one "continue" action for every end screen
    function proceed() {
        if (state === 'won' && endT > 25) nextLevel();
        else if (state === 'lost' && recorded && endT > 70) newRun();
    }
    function giveUp() {
        if (state === 'ready') { newBoard(); return; }
        if (state !== 'play') return;
        if (giveUpArmed()) { giveUpAt = 0; explode(-1, 'GAVE UP'); }
        else giveUpAt = performance.now();             // first press only arms it
    }
    function togglePing() {
        if (!playing() || !started || pings <= 0) return;
        pingMode = !pingMode;
        if (pingMode) flagMode = false;
    }
    function toggleFlagMode() {
        flagMode = !flagMode;
        if (flagMode) pingMode = false;
    }
    function leftAction(i) {
        if (i < 0 || !playing()) return;
        if (pingMode) ping(i);
        else if (flagMode) cycleMark(i);
        else if (st[i] === OPEN) chord(i);
        else openCell(i);
    }

    const TIPS = {
        ping: 'Ping: count the mines in a 5x5 area (P)',
        flag: 'Flag mode (for touch)',
        scores: 'High scores',
    };

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerdown', (e) => {
        if (!activeCache) return;
        e.preventDefault();
        kbActive = false;
        const p = posOf(e);
        if (state === 'won' || state === 'lost') { proceed(); return; }
        if (showScores) { showScores = false; return; }
        if (inBtn(p, BTN_GIVE)) { giveUp(); return; }
        if (inBtn(p, BTN_SCORE)) { if (state !== 'play') showScores = true; return; }
        if (inBtn(p, BTN_PING)) { togglePing(); return; }
        if (inBtn(p, BTN_FLAG)) { toggleFlagMode(); return; }
        if (!playing()) return;
        const i = cellAtXY(p);
        if (i < 0) return;
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        if (e.button === 2) { cycleMark(i); return; }
        downIdx = i; downBtn = e.button; downAt = performance.now(); downTouch = e.pointerType !== 'mouse'; longFired = false;
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!activeCache) return;
        const p = posOf(e);
        hover = cellAtXY(p);
        kbActive = false;
        hoverBtn = null;
        for (const b of BTNS) if (inBtn(p, b)) hoverBtn = b.id;
        let tip = '';
        if (hoverBtn === 'give') tip = state === 'ready' ? 'New board' : 'Give up (click twice)';
        else if (hoverBtn) tip = TIPS[hoverBtn];
        if (canvas.title !== tip) canvas.title = tip;
    });
    canvas.addEventListener('pointerleave', () => { hover = -1; hoverBtn = null; });
    canvas.addEventListener('pointerup', (e) => {
        if (downIdx < 0) return;
        const idx = downIdx;
        downIdx = -1;
        if (longFired) { longFired = false; return; }   // the long press already placed a flag
        if (!playing() || cellAtXY(posOf(e)) !== idx) return;
        if (downBtn === 1) chord(idx);
        else if (downBtn === 0) leftAction(idx);
    });
    canvas.addEventListener('pointercancel', () => { downIdx = -1; });

    let comboHist = [], comboT = 0;
    function comboCheck(e, k) {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
        const now = performance.now();
        if (now - comboT > COMBO_GAP) comboHist = [];
        comboT = now;
        comboHist.push(k);
        if (comboHist.length > COMBO.length) comboHist.shift();
        if (comboHist.length === COMBO.length && comboHist.every((v, i) => v === COMBO[i])) {
            comboHist = [];
            toggleCheats();
        }
    }

    const MOVES = {
        arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0],
        arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1],
    };
    window.addEventListener('keydown', (e) => {
        if (isTyping(e)) return;
        const k = e.key.toLowerCase();
        const confirm = k === 'enter' || k === ' ';
        if (k === 'escape' && cheatPanel && cheatPanel.classList.contains('on')) { toggleCheats(false); return; }
        if (!activeCache) return;
        comboCheck(e, k);
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (showScores && (k === 'escape' || confirm)) { showScores = false; return; }
        if (state === 'won' || state === 'lost') { if (confirm) { e.preventDefault(); proceed(); } return; }
        if (!playing()) return;
        const mv = MOVES[k];
        if (mv) {
            if (kc < 0) kc = centre();                 // first press just shows the cursor
            else {
                let r = rowOf(kc) + mv[1], c = colOf(kc) + mv[0];
                if (P.torus) { r = (r + rows) % rows; c = (c + cols) % cols; }
                kc = clamp(r, 0, rows - 1) * cols + clamp(c, 0, cols - 1);
            }
            kbActive = true;
        } else if (confirm) { if (kc >= 0) { e.preventDefault(); kbActive = true; leftAction(kc); } }
        else if (k === 'f') { if (kc >= 0) cycleMark(kc); }
        else if (k === 'c') { if (kc >= 0) chord(kc); }
        else if (k === 'p') togglePing();
        else if (k === 'r' && state === 'ready') newBoard();
    });

    // ==========================================
    // 7. UPDATE  (fixed 60 Hz step; all animation state lives here so it runs at the same speed on every display)
    // ==========================================
    function update() {
        tick++;
        if (state === 'play') {
            secs = elapsed();
            if (P.timed && !cheats.noTimer && timeLeft() <= 0) explode(-1, 'TIME UP');
        }
        if (state === 'won' || state === 'lost') endT++;
        if (state === 'lost' && !recorded && tick > lostMax + 25) recordScore();
        if (state === 'won' && endT > 330) nextLevel();
        if (shake > 0) shake--;
        if (hudFlash && --hudFlash.t <= 0) hudFlash = null;
        if (pingFx && --pingFx.t <= 0) pingFx = null;
        for (let i = 0; i < N; i++) if (flashN[i] > 0) flashN[i]--;

        // the score readout rolls up towards the real score and pops when it grows
        if (score < dScore) dScore = score;
        if (score > lastScore) scorePop = 10;
        lastScore = score;
        dScore += (score - dScore) * 0.22;
        if (score - dScore < 1) dScore = score;
        if (scorePop > 0) scorePop--;

        // picture glitches: rare at rest, frequent while the screen shakes
        if (glitch > 0) glitch--;
        else if (Math.random() < (shake > 6 ? 0.3 : 0.004)) glitch = 3 + rint(4);

        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            if (p.wait > 0) { p.wait--; continue; }
            p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.99;
            if (--p.life <= 0) parts.splice(i, 1);
        }
        for (let i = rings.length - 1; i >= 0; i--) {
            const r = rings[i];
            if (r.wait > 0) { r.wait--; continue; }
            r.r += (r.r1 - r.r) * 0.16 + 0.4;
            if (--r.life <= 0) rings.splice(i, 1);
        }
        if (state === 'lost') {                        // chain reaction
            for (let k = 0; k < N; k++) if (boomAt[k] === tick) {
                burst(cx(k), cy(k), 14, FX_CHAIN, 2.0, 26, 0.05, 2);
                if (k % 3 === 0) ringFx(cx(k), cy(k), cs * 1.8, 14, COL.accent);
                shake = Math.max(shake, 4);
            }
        }
        if (downIdx >= 0 && downTouch && !longFired && playing() && performance.now() - downAt > LONG_PRESS_MS) {
            longFired = true;                          // long press on touch = flag
            cycleMark(downIdx);
        }
    }

    // ==========================================
    // 8. DRAW
    //   A survey sheet: monospaced readouts, a labelled grid, hatched unexplored ground, cleared ground in paper.
    // ==========================================
    function ringStroke(x, y, r, col, a, w) {
        ctx.globalAlpha = clamp(a, 0, 1); ctx.strokeStyle = col; ctx.lineWidth = w || 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    function outline(x, y, w, h, col, a) {
        ctx.globalAlpha = a === undefined ? 1 : a; ctx.fillStyle = col;
        ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
        ctx.globalAlpha = 1;
    }
    const cellOutline = (j, col, a) => outline(ox + colOf(j) * cs, oy + rowOf(j) * cs, cs - 1, cs - 1, col, a);
    const pad = (n, w) => String(Math.max(0, n | 0)).padStart(w, '0');
    const label = (t, x, y, al, col) => txt(t, x, y, { size: 8, color: col || COL.muted, align: al || 'left', ls: '1.5px', weight: 'normal' });
    const value = (t, x, y, al, col) => txt(t, x, y, { size: 18, color: col || COL.text, align: al || 'left', weight: 'bold' });

    // target mark: ring, ticks and a centre dot (used for mines)
    function mineArt(mx, my, r, col) {
        mx = Math.round(mx); my = Math.round(my);
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5, r / 3);
        r = r * (1 + 0.12 * Math.sin(tick * 0.2 + mx));
        ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.stroke();
        const t = Math.max(1, Math.round(r / 5));
        ctx.fillRect(mx - r - 4, my - t / 2, 6, t); ctx.fillRect(mx + r - 2, my - t / 2, 6, t);
        ctx.fillRect(mx - t / 2, my - r - 4, t, 6); ctx.fillRect(mx - t / 2, my + r - 2, t, 6);
        const d = Math.max(2, Math.round(r / 2)); ctx.fillRect(mx - d / 2, my - d / 2, d, d);
    }
    // a pole with a cloth that ripples
    function flagArt(x, y, a) {
        const u = Math.max(1, Math.round(a / 16)), px = Math.round(x + a * 0.38), top = Math.round(y + a * 0.2);
        rect(px, top, u, Math.round(a * 0.6), COL.flag);
        for (let k = 0; k < 5; k++) {
            const wave = Math.round(Math.sin(tick * 0.14 + k * 0.9 + px) * u * 0.8);
            const len = Math.max(1, (k < 3 ? k + 1 : 5 - k) * 2 * u);
            rect(px + u + wave, top + k * u, len, u, COL.accent);
        }
        rect(px - u * 2, Math.round(y + a * 0.8), u * 5, u, COL.flag);
    }

    // unexplored tiles are hatched; all lines are batched into one stroke per colour
    const hatch = [];
    function fogTile(x, y, a, lit) {
        rect(x, y, a, a, lit ? COL.fogHi : COL.fog);
        hatch.push(x, y, a, lit ? 1 : 0);
    }
    function strokeHatch() {
        for (let pass = 0; pass < 2; pass++) {
            ctx.strokeStyle = pass ? COL.hatchHi : COL.hatch; ctx.lineWidth = 1; ctx.beginPath();
            for (let k = 0; k < hatch.length; k += 4) {
                if (hatch[k + 3] !== pass) continue;
                const x = hatch[k], y = hatch[k + 1], a = hatch[k + 2];
                for (let d = 1 + ((tick >> 3) & 3); d < a * 2; d += 4) {
                    const u0 = Math.max(0, d - a), u1 = Math.min(d, a);
                    ctx.moveTo(x + u0, y + d - u0); ctx.lineTo(x + u1, y + d - u1);
                }
            }
            ctx.stroke();
        }
        hatch.length = 0;
    }
    // numbers glow on the dark ground; they pop when revealed and now and then slip out of register
    function number(n, x, y, a, i, age) {
        const pop = age < 14 ? 1 + 0.35 * Math.sin((1 - age / 14) * Math.PI / 2) : 1;
        const sz = Math.round(a * 0.6 * pop), cx0 = x + a / 2, cy0 = y + a / 2 + 1;
        if ((tick + i * 11) % 260 < 3 || age < 5) {
            txt(String(n), cx0 - 1, cy0, { size: sz, color: COL.cyan });
            txt(String(n), cx0 + 1, cy0, { size: sz, color: COL.accent });
        }
        const jx = (tick + i * 5) % 400 < 2 ? (rint(3) - 1) : 0;
        txt(String(n), cx0 + jx, cy0, { size: sz, color: NUM_COL[n] });
    }
    function clearTile(x, y, a) {
        rect(x, y, a, a, COL.paper);
        outline(x, y, a, a, COL.tileEdge);
        rect(x, y, 3, 1, COL.tileTick); rect(x, y, 1, 3, COL.tileTick);              // tiny corner ticks
        rect(x + a - 3, y + a - 1, 3, 1, COL.tileTick); rect(x + a - 1, y + a - 3, 1, 3, COL.tileTick);
    }

    // marks on unexplored tiles are drawn after the hatching so the lines never cross them
    const tops = [];
    function drawCell(i) {
        const r = rowOf(i), c = colOf(i), x = ox + c * cs, y = oy + r * cs, a = cs - 1;
        const s = st[i], over = state === 'lost', age = tick - appear[i];
        const hot = (hover === i || (kbActive && kc === i)) && playing() && !pingMode;
        if (s === OPEN && age >= 0) {
            if (age < 8) {                             // cleared ground grows out of the fog
                fogTile(x, y, a, false);
                const q = Math.max(2, Math.round(a * (age + 1) / 8)), o = Math.round((a - q) / 2);
                rect(x + o, y + o, q, q, COL.accent);
                return;
            }
            clearTile(x, y, a);
            if (adj[i]) number(adj[i], x, y, a, i, age - 8);
            if (flashN[i] > 0 && ((flashN[i] >> 3) & 1)) outline(x + 1, y + 1, a - 2, a - 2, COL.amber, 1);   // a tremor changed this number
            return;
        }
        if (s === HIT) {                               // the mine you hit
            rect(x, y, a, a, COL.accent);
            mineArt(x + a / 2, y + a / 2, a * 0.2, COL.ink);
            return;
        }
        if (over && mine[i] && boomAt[i] >= 0 && tick >= boomAt[i] && s !== FLAG) {   // chain explosion
            const k = tick - boomAt[i];
            clearTile(x, y, a);
            mineArt(x + a / 2, y + a / 2, a * 0.2, COL.text);
            if (k < 8) { ctx.globalAlpha = (1 - k / 8) * 0.8; rect(x, y, a, a, COL.accent); ctx.globalAlpha = 1; }
            return;
        }
        // a slow diagonal sweep and random twinkles light up the fog
        const sw = ((tick * 0.07) % (cols + rows + 14)) - 6, near = Math.abs((c + r) - sw) < 1.1;
        fogTile(x, y, a, hot || near || (tick * 7 + i * 13) % 523 < 3);
        tops.push(i);
    }
    function drawTop(i) {
        const x = ox + colOf(i) * cs, y = oy + rowOf(i) * cs, a = cs - 1;
        const s = st[i], over = state === 'lost';
        if (s === FLAG) {
            flagArt(x, y, a);
            if (over && !mine[i] && tick > lostMax) {  // wrong flag
                ctx.fillStyle = COL.accent;
                for (let k = 3; k < a - 3; k++) { ctx.fillRect(x + k, y + k, 1.5, 1.5); ctx.fillRect(x + a - 1 - k, y + k, 1.5, 1.5); }
            }
        } else if (s === QUESTION) {
            txt('?', x + a / 2, y + a / 2 + 1, { size: Math.round(a * 0.6), color: COL.amber });
        } else if (gem[i] && !over) {                  // gem glint
            const ph = ((tick >> 2) + i * 3) % 20;
            if (ph < 6) {
                const gx = x + a - 6, gy = y + 6, L = 3 - Math.abs(2 - ph) * 0.8;
                ctx.fillStyle = COL.amber; ctx.fillRect(gx - L, gy, L * 2 + 1, 1); ctx.fillRect(gx, gy - L, 1, L * 2 + 1);
            }
        }
        if (cheats.peek && s === HIDDEN && mine[i]) rect(x + a / 2 - 1.5, y + a / 2 - 1.5, 3, 3, COL.accent);
    }

    function drawParticles() {
        for (const p of parts) {
            if (p.wait > 0) continue;
            ctx.globalAlpha = clamp(p.life / (p.max * 0.5), 0, 1);
            if (p.t) { txt(p.t, p.x, p.y, { size: 10, align: 'center', color: p.c, shadow: '#000' }); continue; }
            const s = Math.max(1, Math.round(p.s));
            rect(Math.round(p.x - p.s / 2), Math.round(p.y - p.s / 2), s, s, p.c);
        }
        ctx.globalAlpha = 1;
        for (const r of rings) if (r.wait <= 0) ringStroke(r.x, r.y, r.r, r.c, (r.life / r.max) * 0.8, 1.2);
    }

    function drawPingFx() {
        if (!pingFx) return;
        const fade = Math.min(1, pingFx.t / 30);
        for (const j of pingFx.cells) cellOutline(j, COL.amber, fade * 0.9);
        const x = Math.round(cx(pingFx.i) - 13), y = Math.round(cy(pingFx.i) - 11), w = 26, h = 22;
        ctx.globalAlpha = fade;
        rect(x, y, w, h, COL.ink);
        outline(x, y, w, h, COL.amber, fade);
        ctx.globalAlpha = fade;                        // outline() resets alpha when it's done
        txt(String(pingFx.n), x + w / 2, y + h / 2 + 1, { size: 14, align: 'center', color: COL.amber });
        ctx.globalAlpha = 1;
    }

    // what the cursor is over: the 5x5 ping area, or the hidden neighbours of a number
    function drawCursor() {
        const hv = kbActive ? kc : hover;
        if (hv < 0 || !playing()) return;
        if (pingMode) { forArea(hv, 2, (j) => cellOutline(j, COL.amber, 0.8)); return; }
        if (st[hv] === OPEN && adj[hv] > 0) for (const j of nb[hv]) if (st[j] === HIDDEN) cellOutline(j, COL.amber, 0.9);
        if (kbActive) cellOutline(hv, COL.amber, 1);
    }

    // frame: corner brackets, labelled axes, optional dashed wrap edge
    function drawFrame() {
        const k = 8, o = 5;
        ctx.fillStyle = COL.frame;
        const corners = [[ox - o, oy - o, 1, 1], [ox + bw + o - 1, oy - o, -1, 1], [ox - o, oy + bh + o - 1, 1, -1], [ox + bw + o - 1, oy + bh + o - 1, -1, -1]];
        for (const [fx, fy, sx, sy] of corners) {
            ctx.fillRect(sx > 0 ? fx : fx - k + 1, fy, k, 1); ctx.fillRect(fx, sy > 0 ? fy : fy - k + 1, 1, k);
        }
        const hv = kbActive ? kc : hover, hr = hv >= 0 ? rowOf(hv) : -1, hc = hv >= 0 ? colOf(hv) : -1;
        for (let c = 0; c < cols; c++) label(String.fromCharCode(65 + c), ox + c * cs + cs / 2, oy - 11, 'center', c === hc ? COL.amber : COL.frame);
        for (let r = 0; r < rows; r++) label(String(r + 1), ox - 9, oy + r * cs + cs / 2, 'right', r === hr ? COL.amber : COL.frame);
        if (P.torus) {
            const d = (tick >> 3) % 6;
            ctx.fillStyle = COL.amber;
            for (let x = ox - 4 - d; x < ox + bw + 4; x += 6) if (x >= ox - 4) { ctx.fillRect(x, oy - 4, 3, 1); ctx.fillRect(x, oy + bh + 3, 3, 1); }
            for (let y = oy - 4 - d; y < oy + bh + 4; y += 6) if (y >= oy - 4) { ctx.fillRect(ox - 4, y, 1, 3); ctx.fillRect(ox + bw + 3, y, 1, 3); }
        }
    }

    // chromatic-split text for titles
    function gtxt(t, x, y, o) {
        const hit = (tick >> 2) % 19 < 2 || glitch > 0;
        if (hit) {
            const d = 2 + rint(2);
            txt(t, x - d, y + (rint(3) - 1), Object.assign({}, o, { color: COL.cyan }));
            txt(t, x + d, y + (rint(3) - 1), Object.assign({}, o, { color: COL.magenta }));
        }
        txt(t, x + (hit ? rint(3) - 1 : 0), y + Math.round(Math.sin(tick * 0.08)), o);
    }

    // ---- HUD: instrument readouts ----
    function fmtTime(t) { t = Math.max(0, t | 0); return pad(Math.floor(t / 60), 2) + ':' + pad(t % 60, 2); }
    function drawHud() {
        const L = MG + 4, R = SIZE - MG - 4, m = mult();
        const timed = P.timed && !cheats.noTimer, left = timeLeft();
        const warn = timed && started && state === 'play' && left <= 10;
        const ml = minesLeft();

        label('SECTOR', L, 19); value(pad(level, 2), L, 37);
        label('MINES', L + 62, 19);
        value(ml < 0 ? '-' + pad(-ml, 2) : pad(ml, 3), L + 62, 37, 'left', ml < 0 ? COL.accent : COL.text);

        const sj = glitch > 0 ? rint(3) - 1 : 0, lift = scorePop > 6 ? 2 : scorePop > 2 ? 1 : 0;
        label('SCORE', L + 128, 19);
        value(pad(Math.round(dScore), 6), L + 128 + sj, 37 - lift, 'left', scorePop > 0 ? COL.amber : COL.text);
        if (m > 1) txt('x' + m, L + 128 + 6 * 11 + 8, 38, { size: 11, color: COL.amber });

        label(timed ? 'REMAINING' : 'ELAPSED', R, 19, 'right');
        const timeCol = warn && ((tick >> 4) & 1) ? COL.accent : (timed ? COL.amber : COL.text);
        value(fmtTime(timed ? (started ? left : P.limit) : secs), R, 37, 'right', timeCol);

        // ruler: the amber part is the streak towards the next multiplier
        const W = R - L;
        rect(L, 52, W, 1, COL.line);
        for (let k = 0; k <= 10; k++) rect(L + Math.round(W * k / 10), k % 5 === 0 ? 49 : 50, 1, k % 5 === 0 ? 5 : 3, COL.line);
        const prog = m >= 5 ? 1 : (streak % 5) / 5;
        const fw = Math.round(W * prog);
        rect(L, 51, fw, 3, hudFlash ? hudFlash.c : COL.amber);
        if (prog > 0) {                                // a spark runs along the filled part
            const sx = L + ((tick * 2) % (fw + 24)) - 12;
            rect(Math.max(L, Math.min(L + fw - 6, sx)), 51, 6, 3, COL.spark);
        }
        if (hudFlash) { ctx.globalAlpha = hudFlash.t / 40 * 0.6; rect(L, 51, W, 3, hudFlash.c); ctx.globalAlpha = 1; }

        // rules + field size
        const rules = [];
        if (P.timed) rules.push('TIMED');
        if (P.torus) rules.push('WRAP');
        if (P.tremor) rules.push(cheats.noTremor ? 'TREMOR OFF' : 'TREMOR ' + (P.tremor - (actions % P.tremor)));
        const tremorNext = P.tremor && !cheats.noTremor && P.tremor - (actions % P.tremor) === 1;
        const rulesCol = !rules.length ? COL.muted : tremorNext && ((tick >> 3) & 1) ? COL.accent : COL.amber;
        label('RULES  ' + (rules.length ? rules.join(' / ') : 'NONE'), L, 63, 'left', rulesCol);
        label('FIELD ' + cols + 'X' + rows + '  ' + nMines + ' MINES', R, 63, 'right');
    }

    // ---- footer ----
    function drawFooter() {
        const yy = FOOT_Y + FOOT_H / 2;
        const item = (b, t, on, hot, dimmed) => {
            const col = dimmed ? COL.off : on ? COL.amber : hot ? COL.text : COL.muted;
            txt(t, b.x, yy, { size: 10, color: col, ls: '1px', weight: 'normal' });
            if (on) rect(b.x, yy + 8, Math.ceil(textWidth(t, 10)) + t.length, 1, COL.amber);
        };
        const canPing = started && pings > 0 && state === 'play';
        item(BTN_PING, '[P] PING', pingMode, hoverBtn === 'ping' && canPing, !canPing && !pingMode);
        for (let k = 0; k < MAX_PINGS; k++) {
            const px = BTN_PING.x + 60 + k * 8;
            if (k < pings) rect(px, yy - 3, 5, 6, COL.amber); else outline(px, yy - 3, 5, 6, COL.off);
        }
        item(BTN_FLAG, 'FLAG MODE', flagMode, hoverBtn === 'flag');
        item(BTN_SCORE, 'BEST RUNS', showScores, hoverBtn === 'scores' && state !== 'play', state === 'play');

        const armed = giveUpArmed();
        const gt = state === 'ready' ? 'NEW BOARD' : armed ? 'CONFIRM?' : 'GIVE UP';
        const gw = Math.ceil(textWidth(gt, 10)) + gt.length;
        txt(gt, SIZE - MG - 4, yy, { size: 10, align: 'right', color: armed ? COL.accent : hoverBtn === 'give' ? COL.text : COL.muted, ls: '1px', weight: 'normal' });
        BTN_GIVE.x = SIZE - MG - 4 - gw - 4; BTN_GIVE.w = gw + 8;       // hit box follows the label
        rect(MG + 4, FOOT_Y - 6, SIZE - MG * 2 - 8, 1, COL.rule);
    }

    // ---- end screens: a printed report with dot leaders ----
    function dim(a) { ctx.globalAlpha = a; rect(ox - 7, oy - 14, bw + 18, bh + 22, COL.bg); ctx.globalAlpha = 1; }
    function leader(l, v, cxm, y, col, hw) {
        hw = hw || 100;
        const x1 = cxm - hw, x2 = cxm + hw;
        txt(l, x1, y, { size: 10, color: COL.muted, ls: '1px', weight: 'normal' });
        txt(v, x2, y, { size: 12, color: col || COL.text, align: 'right' });
        const lw = Math.ceil(textWidth(l, 10)) + l.length + 6, vw = Math.ceil(textWidth(v, 12)) + 6;
        ctx.fillStyle = COL.line;
        for (let x = x1 + lw; x < x2 - vw; x += 4) ctx.fillRect(x, y + 4, 1, 1);
    }
    function rule(cxm, y, hw) { hw = hw || 100; rect(cxm - hw, y, hw * 2, 1, COL.line); }
    function runList(cxm, y, rowsN) {
        for (let k = 0; k < rowsN; k++) {
            const e = scores[k], own = e && e === myEntry;
            leader(pad(k + 1, 2), e ? pad(e.s, 6) + '  S' + pad(e.l, 2) : '------', cxm, y + k * 17, own ? COL.amber : (e ? COL.text : COL.off));
        }
    }
    const blinkOn = () => ((tick >> 5) & 1) === 0;
    const LOSS_TITLE = { 'GAVE UP': 'SURVEY ENDED', 'TIME UP': 'TIME LIMIT REACHED' };
    function drawOverlays() {
        const mx = ox + bw / 2, my = oy + bh / 2;
        if (state === 'won' && endT > 20) {
            dim(Math.min(0.95, (endT - 20) / 30));
            const n = breakdown.length, top = my - (n * 20 + 110) / 2;
            label('SECTOR ' + pad(level, 2), mx, top, 'center');
            gtxt('SURVEY COMPLETE', mx, top + 24, { size: 16, align: 'center', color: COL.good, ls: '2px' });
            rule(mx, top + 44);
            const shown = Math.min(n, Math.floor((endT - 20) / 12) + 1);   // lines print one after another
            for (let k = 0; k < shown; k++) leader(breakdown[k][0], '+' + breakdown[k][1], mx, top + 64 + k * 20);
            rule(mx, top + 54 + n * 20);
            leader('TOTAL', pad(score, 6), mx, top + 74 + n * 20, COL.amber);
            if (endT > 60 && blinkOn()) label('CLICK TO CONTINUE', mx, top + 104 + n * 20, 'center');
        } else if (state === 'lost' && recorded && endT > 40) {
            dim(Math.min(0.96, (endT - 40) / 30));
            const rowsN = 5, top = my - 102;
            label('SECTOR ' + pad(level, 2), mx, top, 'center');
            gtxt(LOSS_TITLE[reason] || 'SURVEY ABORTED', mx, top + 24, { size: 16, align: 'center', color: COL.accent, ls: '2px' });
            rule(mx, top + 44);
            leader('FINAL SCORE', pad(score, 6), mx, top + 62, COL.text);
            leader('SECTOR REACHED', pad(level, 2), mx, top + 80);
            rule(mx, top + 94);
            const best = !!myEntry && myEntry === scores[0];
            label(best ? 'NEW BEST RUN' : 'BEST RUNS', mx, top + 108, 'center', best ? COL.amber : COL.muted);
            runList(mx, top + 126, rowsN);
            if (endT > 70 && blinkOn()) label('CLICK TO RESTART', mx, top + 126 + rowsN * 17 + 8, 'center');
        } else if (showScores) {
            dim(0.96);
            const rowsN = MAX_SCORES, top = my - (rowsN * 17 + 60) / 2;
            label('BEST RUNS', mx, top, 'center');
            rule(mx, top + 14);
            runList(mx, top + 32, rowsN);
            label('CLICK TO CLOSE', mx, top + 32 + rowsN * 17 + 6, 'center');
        }
    }

    const REG_MARKS = [[5, 5], [SIZE - 6, 5], [5, SIZE - 6], [SIZE - 6, SIZE - 6]];
    function drawBackground() {
        rect(0, 0, SIZE, SIZE, COL.bg);
        ctx.fillStyle = COL.dust;                      // drifting dust
        for (let k = 0; k < 22; k++) {
            const x = Math.round((k * 83 + tick * 0.1 * (1 + k % 3)) % SIZE);
            const y = Math.round(SIZE - ((k * 47 + tick * 0.18 * (1 + k % 2)) % SIZE));
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.fillStyle = COL.reg;                       // registration marks in the corners of the sheet
        for (const [px, py] of REG_MARKS) { ctx.fillRect(px - 3, py, 7, 1); ctx.fillRect(px, py - 3, 1, 7); }
    }

    function draw() {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        ctx.imageSmoothingEnabled = false;
        drawBackground();
        drawHud();
        ctx.save();
        if (shake > 0) {
            const s = Math.min(shake, 5);
            ctx.translate(Math.round(rnd(-1, 1) * s), Math.round(rnd(-1, 1) * s));
        }
        rect(ox - 1, oy - 1, bw + 1, bh + 1, COL.bg);
        for (let i = 0; i < N; i++) drawCell(i);
        strokeHatch();
        for (const i of tops) drawTop(i);
        tops.length = 0;
        drawFrame();
        drawCursor();
        drawPingFx();
        drawParticles();
        ctx.restore();
        drawFooter();
        drawOverlays();
        ctx.globalAlpha = 0.32;
        txt('PRODUCED BY AI', SIZE - 14, SIZE - 5, { size: 6, align: 'right', color: COL.muted, ls: '1px', weight: 'normal' });
        ctx.globalAlpha = 1;
        postFx();
    }
    // scanlines, a slow roll bar and now and then a torn band of the picture
    function postFx() {
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        for (let y = 1; y < SIZE; y += 3) ctx.fillRect(0, y, SIZE, 1);
        const ry = ((tick * 0.6) % (SIZE + 60)) - 30;
        ctx.fillStyle = 'rgba(160,200,255,0.035)'; ctx.fillRect(0, ry, SIZE, 22);
        if (glitch <= 0) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const W = canvas.width, H = canvas.height, n = 2 + rint(3);
        for (let b = 0; b < n; b++) {
            const by = rint(H - 24), bandH = 4 + rint(Math.max(5, H * 0.07)), dx = (rint(13) - 6) * SCALE;
            try { ctx.drawImage(canvas, 0, by, W, bandH, dx, by, W, bandH); } catch (e) { /* ignore */ }
        }
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    }

    // ==========================================
    // 9. CHEAT MENU   (Up, Up, Down, Down, X, Left)
    // ==========================================
    function injectCheatCSS() {
        if (document.getElementById('_ms_cheat_style')) return;
        const s = document.createElement('style');
        s.id = '_ms_cheat_style';
        s.textContent = `
.ms-panel{
--c-surface:var(--color-surface,#c0c0c0);--c-hi:var(--color-hi,#fff);--c-lo:var(--color-lo,#808080);--c-dark:var(--color-dark,#0a0a0a);
--c-title:var(--color-titlebar,#000080);--c-titletext:var(--color-title-text,#fff);--c-ink:var(--color-ink,#020202);
--c-field:var(--color-clock-face,#f8f8f8);--c-font:var(--font-ui,sans-serif);
position:fixed;top:8px;right:8px;width:min(268px,calc(100vw - 16px));max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px);
z-index:99999;display:none;flex-direction:column;box-sizing:border-box;padding:3px;user-select:none;
background:var(--c-surface);color:var(--c-ink);font:bold 12px/1.3 var(--c-font);
border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark)}
.ms-panel *{box-sizing:border-box}
.ms-panel.on{display:flex;animation:ms-pop var(--motion-pop-time,.5s) var(--motion-pop,cubic-bezier(.175,.885,.32,1.275))}
.ms-panel.min .ms-body{display:none}
.ms-title{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:3px 5px;background:var(--c-title);color:var(--c-titletext);font-size:var(--size-bar,12px);font-weight:bold;touch-action:none;cursor:move}
.ms-tbtns{display:flex;gap:2px}
.ms-tb{display:grid;place-items:center;width:18px;height:16px;padding:0;background:var(--c-surface);color:var(--c-ink);font:bold 12px/1 var(--c-font);cursor:pointer;border-radius:0;
border:1px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi)}
.ms-tb:active{border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo)}
.ms-body{display:flex;flex-direction:column;gap:8px;margin-top:4px;padding:6px;background:var(--c-surface);overflow:auto;flex:1;min-height:0}
.ms-body::-webkit-scrollbar{width:16px}
.ms-body::-webkit-scrollbar-track{background:repeating-conic-gradient(var(--c-surface) 0 25%,var(--c-hi) 0 50%) 0 0/2px 2px}
.ms-body::-webkit-scrollbar-thumb{background:var(--c-surface);border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset -1px -1px var(--c-dark)}
.ms-grp{border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);padding:6px;display:flex;flex-direction:column;gap:5px}
.ms-row{display:flex;flex-wrap:wrap;gap:4px}
.ms-btn{flex:1 1 auto;font:inherit;color:var(--c-ink);background:var(--c-surface);min-height:24px;padding:2px 8px;cursor:pointer;border-radius:0;
border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark)}
.ms-btn:active,.ms-btn.sel{border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);box-shadow:inset 1px 1px var(--c-dark),inset -1px -1px var(--c-surface)}
.ms-btn.sel{background:repeating-conic-gradient(var(--c-surface) 0 25%,var(--c-hi) 0 50%) 0 0/2px 2px}
.ms-btn:focus-visible,.ms-tb:focus-visible{outline:1px dotted var(--c-ink);outline-offset:2px}
.ms-field{background:var(--c-field);border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);padding:2px 5px}
.ms-status{min-height:3.6em}
@keyframes ms-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.ms-panel.on{animation:none}}
@media (max-width:820px){.ms-panel{top:auto!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;max-height:46vh}.ms-title{cursor:default}}
`;
        document.head.appendChild(s);
    }

    function buildCheatUI() {
        if (cheatPanel) return;
        injectCheatCSS();
        cheatPanel = document.createElement('div');
        cheatPanel.className = 'ms-panel';
        cheatPanel.setAttribute('role', 'region');
        cheatPanel.setAttribute('aria-label', 'Cheat menu');
        cheatPanel.innerHTML = `
<div class="ms-title"><span>cheats.exe</span>
  <span class="ms-tbtns">
    <button type="button" class="ms-tb" data-act="min" aria-label="Minimize">_</button>
    <button type="button" class="ms-tb" data-act="close" aria-label="Close cheat menu">&times;</button>
  </span>
</div>
<div class="ms-body">
  <div class="ms-field ms-info"></div>
  <div class="ms-grp"><span>Level</span>
    <div class="ms-row">
      <button type="button" class="ms-btn" data-act="prev">Previous</button>
      <button type="button" class="ms-btn" data-act="next">Next</button>
      <button type="button" class="ms-btn" data-act="regen">New board</button>
      <button type="button" class="ms-btn" data-act="win">Clear board</button>
    </div>
  </div>
  <div class="ms-grp"><span>Help</span>
    <div class="ms-row">
      <button type="button" class="ms-btn" data-act="hint">Open a safe cell</button>
      <button type="button" class="ms-btn" data-act="pings">+3 pings</button>
      <button type="button" class="ms-btn" data-act="points">+1000 points</button>
    </div>
  </div>
  <div class="ms-grp"><span>Options</span>
    <div class="ms-row">
      <button type="button" class="ms-btn" data-act="peek" data-t="peek" aria-pressed="false">Show mines</button>
      <button type="button" class="ms-btn" data-act="tremor" data-t="noTremor" aria-pressed="false">Stop tremors</button>
      <button type="button" class="ms-btn" data-act="timer" data-t="noTimer" aria-pressed="false">Stop timer</button>
      <button type="button" class="ms-btn" data-act="best">Reset scores</button>
    </div>
  </div>
  <div class="ms-field ms-status" aria-live="polite"></div>
</div>`;
        document.body.appendChild(cheatPanel);
        cheatInfo = cheatPanel.querySelector('.ms-info');
        cheatStatus = cheatPanel.querySelector('.ms-status');

        cheatPanel.addEventListener('click', (e) => {
            const b = e.target.closest('[data-act]');
            if (!b) return;
            cheatAct(b.dataset.act);
            if (document.activeElement === b) b.blur();  // so Space/Enter go back to the game
        });

        // drag by the title bar (desktop only; on narrow screens the panel docks to the bottom)
        const bar = cheatPanel.querySelector('.ms-title');
        let off = null;
        bar.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button') || window.matchMedia('(max-width:820px)').matches) return;
            const r = cheatPanel.getBoundingClientRect();
            off = { x: e.clientX - r.left, y: e.clientY - r.top };
            cheatPanel.style.left = r.left + 'px'; cheatPanel.style.top = r.top + 'px'; cheatPanel.style.right = 'auto';
            try { bar.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        });
        bar.addEventListener('pointermove', (e) => {
            if (!off) return;
            cheatPanel.style.left = clamp(e.clientX - off.x, 0, window.innerWidth - 80) + 'px';
            cheatPanel.style.top = clamp(e.clientY - off.y, 0, window.innerHeight - 24) + 'px';
        });
        const stop = () => { off = null; };
        bar.addEventListener('pointerup', stop);
        bar.addEventListener('pointercancel', stop);
    }

    function toggleCheats(force) {
        buildCheatUI();
        const on = force === undefined ? !cheatPanel.classList.contains('on') : !!force;
        cheatPanel.classList.toggle('on', on);
        if (on) { renderCheats(); say('Cheat menu on. Same code closes it, or press Esc.'); }
    }
    function say(msg) { if (cheatStatus) cheatStatus.textContent = msg; }
    function updateCheatInfo() {
        if (!cheatInfo) return;
        const mods = [P.torus ? 'wraps' : '', P.tremor ? 'tremor every ' + P.tremor : '', P.timed ? 'timed ' + P.limit + 's' : ''].filter(Boolean).join(', ');
        cheatInfo.textContent = 'Level ' + level + '  -  ' + cols + 'x' + rows + '  -  ' + nMines + ' mines' + (mods ? '  -  ' + mods : '');
    }
    function renderCheats() {
        if (!cheatPanel) return;
        cheatPanel.querySelectorAll('[data-t]').forEach((b) => {
            const on = !!cheats[b.dataset.t];
            b.classList.toggle('sel', on);
            b.setAttribute('aria-pressed', String(on));
        });
        updateCheatInfo();
    }
    function gotoLevel(n) {
        level = clamp(n, 1, MAX_LEVEL);
        newBoard();
        say('Level ' + level + '.');
    }
    function cheatAct(a) {
        switch (a) {
            case 'close': toggleCheats(false); return;
            case 'min': cheatPanel.classList.toggle('min'); return;
            case 'prev': gotoLevel(level - 1); break;
            case 'next': gotoLevel(level + 1); break;
            case 'regen': gotoLevel(level); break;
            case 'win':
                if (!playing()) { say('Start a new board first.'); break; }
                if (!started) { started = true; placeMines(centre()); startClock(); }
                for (let i = 0; i < N; i++) if (!mine[i] && st[i] !== OPEN) { st[i] = OPEN; revealed++; }
                win();
                say('Board cleared.');
                break;
            case 'hint': {
                if (!playing()) { say('Start a new board first.'); break; }
                if (!started) { openCell(centre()); say('Opened the middle.'); break; }
                const safe = [];
                for (let i = 0; i < N; i++) if (!mine[i] && isClosed(i)) safe.push(i);
                if (!safe.length) { say('Nothing left to open (check your flags).'); break; }
                openCell(safe[rint(safe.length)]);
                say('Opened a safe cell.');
                break;
            }
            case 'pings': pings = Math.min(MAX_PINGS, pings + 3); say('Pings: ' + pings + '.'); break;
            case 'points': score += 1000; say('Score: ' + score + '.'); break;
            case 'peek': cheats.peek = !cheats.peek; say('Mines ' + (cheats.peek ? 'marked with a red dot.' : 'hidden again.')); break;
            case 'tremor': cheats.noTremor = !cheats.noTremor; say('Tremors ' + (cheats.noTremor ? 'stopped.' : 'back on.')); break;
            case 'timer': cheats.noTimer = !cheats.noTimer; say('Timer ' + (cheats.noTimer ? 'stopped.' : 'back on.')); break;
            case 'best': scores = []; myEntry = null; saveScores(); say('High scores cleared.'); break;
        }
        renderCheats();
    }
    window.openMinesweeperCheats = toggleCheats;        // handy for debugging from the console

    // ==========================================
    // 10. LOOP
    // ==========================================
    readFont();
    refreshActive();
    let wasActive = activeCache;
    newRun();

    let last = performance.now(), acc = 0, frameNo = 0;
    function frame(now) {
        requestAnimationFrame(frame);
        if (frameNo % 8 === 0) refreshActive();
        if (frameNo % 30 === 0) { readFont(); fitCanvas(); }
        frameNo++;
        if (!activeCache && wasActive) { downIdx = -1; hover = -1; hoverBtn = null; }   // hidden: drop any half-finished press
        wasActive = activeCache;
        if (!activeCache) { last = now; acc = 0; return; }
        acc += Math.min(now - last, 100);              // cap catch-up after a stall
        last = now;
        while (acc >= STEP) { update(); acc -= STEP; }
        draw();
    }
    fitCanvas();
    requestAnimationFrame(frame);
};

// start by itself once the page is ready (safe to also call window.initMinesweeper() from manager.js)
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.initMinesweeper());
else window.initMinesweeper();