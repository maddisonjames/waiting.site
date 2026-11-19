window.initMaze = function () {
    const canvas = document.getElementById('_maze_canvas');
    if (!canvas) return;
    if (window.__mazeRunning) return;                  // never start two game loops
    window.__mazeRunning = true;

    // ==========================================
    // 1. CANVAS
    // ==========================================
    const W = 240;
    const H = Math.round((W * 475) / 575);             // matches .screen-maze's aspect-ratio, so pixels stay square
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    canvas.style.touchAction = 'none';
    const winEl = canvas.closest('.win');

    // ==========================================
    // 2. TUNING
    // ==========================================
    const FOV = Math.PI / 3;
    const MOVE_SPEED = 3.0;                            // cells per second
    const TURN_SPEED = 3.0;                            // radians per second
    const BODY_R = 0.18;
    const INTRO_SPEED = 1.2;                           // walls rise / fall, per second
    const START_SIZE = 9, SIZE_STEP = 4, MAX_LEVEL = 50;
    const FOG_END = 9, AMBIENT = 0.2, SHADE_LEVELS = 6;
    const ORB_LIGHT_R = 3.6;
    const MAX_PARTICLES = 320;
    const COMBO = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'x', 'arrowleft'];   // same code as the plateformer editor
    const COMBO_GAP = 2000;

    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const rand = (a, b) => a + Math.random() * (b - a);
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

    // ==========================================
    // 3. AUDIO (everything is played from here, nothing depends on <audio> tags)
    // ==========================================
    const SFX_SRC = {
        orb:   './assets/other/sfxs/CY_MENUC.wav',
        build: './assets/other/sfxs/AR_CRITI.WAV',
        key:   './assets/other/sfxs/PD_RINGO.WAV',
        door:  './assets/other/sfxs/hall_elev_door.wav',
    };
    const sfx = {};
    for (const k in SFX_SRC) {
        try { const a = new Audio(SFX_SRC[k]); a.preload = 'auto'; sfx[k] = a; } catch (e) { /* no audio support */ }
    }
    let muted = false;
    function playSfx(name, volume, rate) {
        const a = sfx[name];
        if (!a || muted) return;
        try {
            const n = a.cloneNode();                    // clones overlap instead of cutting each other off
            n.volume = clamp(volume === undefined ? 1 : volume, 0, 1);
            n.playbackRate = rate || 1;
            const p = n.play();
            if (p && p.catch) p.catch(() => { /* blocked until the first click / key press */ });
        } catch (e) { /* ignore */ }
    }

    // ==========================================
    // 4. TEXTURES
    // ==========================================
    const TEX_DIR = './assets/other/maze/';
    function grabImage(id, file) {
        const el = document.getElementById(id);
        if (el) return el;
        const img = new Image();
        img.src = TEX_DIR + file;
        return img;
    }
    const imgs = {
        ceiling: grabImage('tex_ceiling', 'stone_brick.png'),
        wall:    grabImage('tex_wall', 'brick.png'),
        floor:   grabImage('tex_floor', 'plank.png'),
        orb:     grabImage('tex_smile', 'smile.png'),
        key:     grabImage('tex_key', 'keys.png'),
        door:    grabImage('tex_door', 'door.png'),
        hand:    grabImage('tex_hand', 'hand.png'),
        equip:   grabImage('tex_equip_key', 'keys.png'),
    };
    const tex = {};

    function getImageData(img) {
        if (!img || !img.complete || img.naturalWidth === 0) return null;
        try {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const cx = c.getContext('2d');
            cx.drawImage(img, 0, 0);
            return cx.getImageData(0, 0, c.width, c.height);
        } catch (e) { return null; }                   // tainted canvas (file://) etc.
    }
    function loadTextures() {
        for (const k in imgs) if (!tex[k]) tex[k] = getImageData(imgs[k]);
    }

    // ==========================================
    // 5. GAME STATE
    // ==========================================
    let size = START_SIZE, level = 0;
    let map = [];
    const player = { x: 1.5, y: 1.5, angle: 0 };
    let orb = { x: 0, y: 0 };
    let keysList = [], doorsList = [];
    let playerHasKey = false;
    let tints = null, fogColor = [10, 10, 14];

    let gameState = 'RISING';                          // RISING | PLAYING | FALLING
    let introProgress = 0;
    let equipAnim = 0;
    let bobTimer = 0, bobAmp = 0, moving = false;
    let flash = 0, shake = 0, T = 0;
    let orbAngX = 0, orbAngY = 0, orbAngZ = 0;
    const particles = [];
    const motes = Array.from({ length: 22 }, () => ({ x: 0, y: 0, z: 0, ph: Math.random() * 6.28, on: false }));

    const cheats = { noclip: false, speed: 1, fullbright: false, map: false };

    // drag-and-drop for the key
    let isDragging = false, dragX = 0, dragY = 0;

    // camera values shared with the sprite projection
    const cam = { angle: 0, half: H / 2 };

    // ==========================================
    // 6. MAZE GENERATION
    // ==========================================
    function generateMaze(n) {
        const g = Array.from({ length: n }, () => Array(n).fill(1));
        const stack = [[1, 1]];
        g[1][1] = 0;
        while (stack.length) {
            const [r, c] = stack[stack.length - 1];
            const opts = [];
            for (const [dr, dc] of [[-2, 0], [0, 2], [2, 0], [0, -2]]) {
                const nr = r + dr, nc = c + dc;
                if (nr > 0 && nr < n - 1 && nc > 0 && nc < n - 1 && g[nr][nc] === 1) opts.push([dr, dc]);
            }
            if (!opts.length) { stack.pop(); continue; }
            const [dr, dc] = opts[(Math.random() * opts.length) | 0];
            g[r + dr / 2][c + dc / 2] = 0;
            g[r + dr][c + dc] = 0;
            stack.push([r + dr, c + dc]);
        }
        return g;
    }

    // Breadth-first search from the start: distances, parents and the furthest cell
    function solve(n) {
        const dist = new Int32Array(n * n).fill(-1);
        const par = new Int32Array(n * n).fill(-1);
        const start = 1 * n + 1;
        const q = [start];
        dist[start] = 0;
        let best = start;
        for (let h = 0; h < q.length; h++) {
            const cur = q[h], r = (cur / n) | 0, c = cur % n;
            if (dist[cur] > dist[best]) best = cur;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
                const ni = nr * n + nc;
                if (map[nr][nc] === 0 && dist[ni] < 0) { dist[ni] = dist[cur] + 1; par[ni] = cur; q.push(ni); }
            }
        }
        const path = [];
        for (let cur = best; cur !== -1; cur = par[cur]) path.push(cur);
        path.reverse();
        return { dist, path };
    }

    // Cells reachable from the start while the first `openDoors` doors are open and the rest are closed
    function reach(n, openDoors, doorOrder) {
        const seen = new Uint8Array(n * n);
        const q = [n + 1];
        seen[n + 1] = 1;
        for (let h = 0; h < q.length; h++) {
            const cur = q[h], r = (cur / n) | 0, c = cur % n;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
                const ni = nr * n + nc, v = map[nr][nc];
                if (seen[ni] || v === 1) continue;
                if (v === 3 && !(doorOrder.get(ni) < openDoors)) continue;
                seen[ni] = 1;
                q.push(ni);
            }
        }
        return seen;
    }

    function computeTints() {
        const l = level - 1, one = level === 1;
        const mk = (r, g, b) => (one ? [1, 1, 1] : [r, g, b]);
        tints = {
            wall:  mk(1 + Math.sin(l * 0.8) * 0.6, 1 + Math.cos(l * 0.5) * 0.5, 1 + Math.sin(l * 1.1 + 1.0) * 0.7),
            floor: mk(1 + Math.cos(l * 0.7 + 2.0) * 0.6, 1 + Math.sin(l * 0.9 + 1.5) * 0.5, 1 + Math.cos(l * 0.6) * 0.7),
            ceil:  mk(1 + Math.sin(l * 0.6 + 4.0) * 0.5, 1 + Math.cos(l * 1.2 + 0.5) * 0.6, 1 + Math.sin(l * 0.7 + 2.5) * 0.7),
            orb:   mk(1 + Math.cos(l * 1.0 + 1.0) * 0.7, 1 + Math.sin(l * 0.8 + 3.0) * 0.6, 1 + Math.cos(l * 0.9 + 4.0) * 0.5),
        };
        tints.door = tints.wall;
        fogColor = [9 * tints.ceil[0], 8 * tints.ceil[1], 13 * tints.ceil[2]];
    }

    function updateDetails() {
        const lvl = document.getElementById('_level_txt');
        if (lvl) { lvl.textContent = 'Level: ' + level; lvl.title = 'Level ' + level; }
        const sz = document.getElementById('_map_size_txt');
        if (sz) { sz.textContent = 'Map size: ' + size + 'x' + size; sz.title = 'Map size: ' + size + 'x' + size; }
        updateCheatInfo();
    }

    function initLevel(silent) {
        map = generateMaze(size);
        level += 1;
        playerHasKey = false;
        keysList = [];
        doorsList = [];
        particles.length = 0;
        computeTints();
        updateDetails();

        player.x = 1.5;
        player.y = 1.5;
        player.angle = map[1][2] !== 1 ? 0 : Math.PI / 2;     // face down the open corridor

        const n = size;
        const { dist, path } = solve(n);
        const pathSet = new Set(path);
        const end = path[path.length - 1];
        const endR = (end / n) | 0, endC = end % n;
        orb = { x: endC + 0.5, y: endR + 0.5 };
        map[endR][endC] = 2;

        if (level >= 3 && path.length > 15) {
            // doors sit on the solution path, evenly spaced
            const doorCount = Math.max(1, level - 2);
            const segment = path.length / (doorCount + 1);
            const used = new Set();
            for (let i = 1; i <= doorCount; i++) {
                const idx = Math.floor(segment * i);
                if (idx > 1 && idx < path.length - 1 && !used.has(idx)) {
                    used.add(idx);
                    const cell = path[idx], r = (cell / n) | 0, c = cell % n;
                    if (map[r][c] === 0) {
                        map[r][c] = 3;
                        doorsList.push({ x: c + 0.5, y: r + 0.5, r, c, cell, order: doorsList.length });
                    }
                }
            }
            const doorOrder = new Map(doorsList.map((d) => [d.cell, d.order]));

            // Every key goes in the stretch of maze between the previous door and its own door,
            // so the maze can always be finished (the old placement could hide a key behind its own door).
            const taken = new Set([n + 1]);
            const deadDoors = [];
            let prev = new Uint8Array(n * n);
            for (const d of doorsList) {
                const cur = reach(n, d.order, doorOrder);
                const seg = [];
                for (let i = 0; i < cur.length; i++) if (cur[i] && !prev[i]) seg.push(i);
                const free = seg.filter((i) => map[(i / n) | 0][i % n] === 0 && !taken.has(i));
                const open = (i) => {
                    let k = 0;
                    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                        const r = ((i / n) | 0) + dr, c = (i % n) + dc;
                        if (map[r] && map[r][c] !== undefined && map[r][c] !== 1) k++;
                    }
                    return k;
                };
                let pool = free.filter((i) => !pathSet.has(i));
                const deadEnds = pool.filter((i) => open(i) === 1);
                if (deadEnds.length) pool = deadEnds;
                if (!pool.length) pool = free;
                if (!pool.length) { deadDoors.push(d); prev = cur; continue; }
                pool.sort((a, b) => dist[b] - dist[a]);
                const pick = pool[(Math.random() * Math.max(1, Math.ceil(pool.length / 3))) | 0];
                const r = (pick / n) | 0, c = pick % n;
                taken.add(pick);
                map[r][c] = 4;
                keysList.push({ x: c + 0.5, y: r + 0.5, r, c, phase: Math.random() * 6.28 });
                prev = cur;
            }
            for (const d of deadDoors) map[d.r][d.c] = 0;     // no room for its key: leave it open rather than softlock
            doorsList = doorsList.filter((d) => !deadDoors.includes(d));
        }

        introProgress = 0;
        gameState = 'RISING';
        if (!silent) playSfx('build');
    }

    // ==========================================
    // 7. PARTICLES
    // ==========================================
    function emit(x, y, z, n, cols, speed, life, grav, sz) {
        for (let i = 0; i < n && particles.length < MAX_PARTICLES; i++) {
            const a = Math.random() * Math.PI * 2, s = speed * rand(0.3, 1);
            const c = cols[i % cols.length];
            particles.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(0.1, 1) * speed,
                life: life * rand(0.6, 1), max: life, grav, sz, r: c[0], g: c[1], b: c[2] });
        }
    }

    // ==========================================
    // 8. INPUT
    // ==========================================
    const keys = {};
    const isTyping = (e) => !!(e.target && e.target.matches && e.target.matches('input, textarea, select'));
    let activeCache = true;                             // is the maze window actually on screen?
    const isActive = () => activeCache;
    function refreshActive() {
        if (!winEl) { activeCache = true; return; }
        let o = 1;
        try { o = parseFloat(getComputedStyle(winEl).opacity); } catch (e) { /* ignore */ }
        activeCache = !(o < 0.05);
    }

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

    window.addEventListener('keydown', (e) => {
        if (isTyping(e)) return;
        const k = e.key.toLowerCase();
        if (k === 'escape' && cheatPanel && cheatPanel.classList.contains('on')) { toggleCheats(false); return; }
        if (!isActive()) return;
        keys[k] = true;
        comboCheck(e, k);
        if (k === 'e' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) tryUnlock();
    });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; isDragging = false; });

    const held = (...names) => names.some((n) => keys[n]);

    function canvasXY(e) {
        const r = canvas.getBoundingClientRect();
        return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    }
    const primaryScale = () => 0.9 - 0.2 * equipAnim;

    canvas.addEventListener('pointerdown', (e) => {
        if (!isActive() || !playerHasKey) return;
        const m = canvasXY(e);
        const s = primaryScale();
        const w = Math.floor(62 * s), h = Math.floor(62 * s);
        const x0 = W - w + 7.5, y0 = H - h + 10;
        if (m.x >= x0 && m.x <= x0 + w && m.y >= y0 && m.y <= y0 + h) {
            isDragging = true;
            dragX = m.x;
            dragY = m.y;
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            e.preventDefault();
        }
    });
    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const m = canvasXY(e);
        dragX = m.x;
        dragY = m.y;
    });
    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        tryUnlock();                                     // dropping the key anywhere uses it on a door next to you
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', () => { isDragging = false; });

    function tryUnlock() {
        if (!playerHasKey) return false;
        const pr = Math.floor(player.y), pc = Math.floor(player.x);
        let best = null, bestD = Infinity;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const r = pr + dr, c = pc + dc;
            if (map[r] && map[r][c] === 3) {
                const d = Math.hypot(c + 0.5 - player.x, r + 0.5 - player.y);
                if (d < bestD) { bestD = d; best = { r, c }; }
            }
        }
        if (!best) return false;
        openDoor(best.r, best.c);
        playerHasKey = false;
        return true;
    }

    function openDoor(r, c) {
        map[r][c] = 0;
        doorsList = doorsList.filter((d) => !(d.r === r && d.c === c));
        playSfx('door', 0.5);
        shake = Math.max(shake, 0.6);
        const col = tints ? tints.door : [1, 1, 1];
        emit(c + 0.5, r + 0.5, 0.5, 26, [[150 * col[0], 100 * col[1], 60 * col[2]], [210, 190, 160], [90, 60, 40]], 1.6, 0.9, 2.6, 0.035);
    }

    // ==========================================
    // 9. UPDATE
    // ==========================================
    function walkCell(x, y) {
        const row = map[Math.floor(y)];
        if (!row) return false;
        const v = row[Math.floor(x)];
        return v === 0 || v === 2 || v === 4;
    }
    function canStand(x, y) {
        return walkCell(x - BODY_R, y - BODY_R) && walkCell(x + BODY_R, y - BODY_R) &&
               walkCell(x - BODY_R, y + BODY_R) && walkCell(x + BODY_R, y + BODY_R);
    }
    function tryMove(nx, ny) {
        if (cheats.noclip) {
            const px = player.x, py = player.y;
            player.x = clamp(nx, 0.3, size - 0.3);
            player.y = clamp(ny, 0.3, size - 0.3);
            return px !== player.x || py !== player.y;
        }
        let moved = false;
        if (canStand(nx, player.y)) { player.x = nx; moved = true; }      // sliding: each axis on its own
        if (canStand(player.x, ny)) { player.y = ny; moved = true; }
        return moved;
    }

    function updatePlayer(dt) {
        const turn = TURN_SPEED * dt, step = MOVE_SPEED * cheats.speed * dt;
        if (held('arrowleft', 'a')) player.angle -= turn;
        if (held('arrowright', 'd')) player.angle += turn;

        moving = false;
        const dx = Math.cos(player.angle) * step, dy = Math.sin(player.angle) * step;
        if (held('arrowup', 'w')) { if (tryMove(player.x + dx, player.y + dy)) moving = true; }
        if (held('arrowdown', 's')) { if (tryMove(player.x - dx, player.y - dy)) moving = true; }

        const pc = Math.floor(player.x), pr = Math.floor(player.y);

        if (!playerHasKey && map[pr] && map[pr][pc] === 4) {
            map[pr][pc] = 0;
            playerHasKey = true;
            keysList = keysList.filter((k) => !(k.r === pr && k.c === pc));
            playSfx('key', 0.75);
            emit(pc + 0.5, pr + 0.5, 0.3, 18, [[255, 236, 39], [255, 241, 232], [255, 163, 0]], 1.3, 0.8, 1.2, 0.025);
        }

        if (map[pr] && map[pr][pc] === 2) {
            map[pr][pc] = 0;
            playSfx('orb');
            flash = 0.85;
            shake = Math.max(shake, 0.8);
            const o = tints.orb;
            emit(orb.x, orb.y, 0.5, 40, [[255 * Math.min(1, o[0]), 255 * Math.min(1, o[1]), 255 * Math.min(1, o[2])], [255, 255, 255]], 2.2, 1.1, 0.6, 0.03);
            gameState = 'FALLING';
        }
    }

    function update(dt) {
        T += dt;
        if (gameState === 'RISING') {
            introProgress += INTRO_SPEED * dt;
            if (introProgress >= 1) { introProgress = 1; gameState = 'PLAYING'; }
        } else if (gameState === 'FALLING') {
            introProgress -= INTRO_SPEED * dt;
            if (introProgress <= 0) { introProgress = 0; size += SIZE_STEP; initLevel(); }
        }

        equipAnim += ((playerHasKey ? 1 : 0) - equipAnim) * (1 - Math.pow(0.9, dt * 60));

        moving = false;
        if (gameState === 'PLAYING') updatePlayer(dt);
        bobAmp += ((moving ? 1 : 0) - bobAmp) * (1 - Math.pow(0.85, dt * 60));   // sway eases out instead of freezing mid-step
        if (moving) bobTimer += 9 * dt * Math.min(cheats.speed, 2);

        orbAngX += 1.5 * dt;
        orbAngY += 2.4 * dt;
        orbAngZ += 0.9 * dt;

        flash = Math.max(0, flash - dt * 1.8);
        shake = Math.max(0, shake - dt * 2.2);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            p.vz -= p.grav * dt;
            p.vx *= 0.985; p.vy *= 0.985;
            if (p.z < 0.02) { p.z = 0.02; p.vz *= -0.35; p.vx *= 0.7; p.vy *= 0.7; }
            if ((p.life -= dt) <= 0) particles.splice(i, 1);
        }
        for (const m of motes) {
            if (!m.on || Math.hypot(m.x - player.x, m.y - player.y) > 5.5) {
                const a = rand(0, Math.PI * 2), r = rand(0.8, 5);
                m.x = player.x + Math.cos(a) * r; m.y = player.y + Math.sin(a) * r; m.z = rand(0.1, 0.95); m.on = true;
            }
            m.x += Math.cos(T * 0.4 + m.ph) * 0.05 * dt;
            m.y += Math.sin(T * 0.5 + m.ph) * 0.05 * dt;
            m.z += Math.sin(T * 0.7 + m.ph) * 0.03 * dt;
        }
    }

    // ==========================================
    // 10. RENDER
    // ==========================================
    const screenBuffer = ctx.createImageData(W, H);
    const wallTops = new Int32Array(W), wallBottoms = new Int32Array(W), wallRawTop = new Float32Array(W);
    const wallHeights = new Float32Array(W), wallTexX = new Int32Array(W), wallTypes = new Uint8Array(W);
    const wallShade = new Float32Array(W), wallLight = new Float32Array(W);
    const zBuffer = new Float32Array(W);

    const VIG = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const nx = (x / W - 0.5) * 2, ny = (y / H - 0.5) * 2;
        VIG[y * W + x] = 1 - 0.42 * Math.pow(clamp((nx * nx + ny * ny) / 2, 0, 1), 1.25);
    }

    const fogShade = (d) => {
        if (cheats.fullbright) return 1;
        const t = clamp(1 - d / FOG_END, 0, 1);
        return AMBIENT + (1 - AMBIENT) * Math.pow(t, 1.15);
    };

    // icosahedron, unit size
    const ICO_T = (1 + Math.sqrt(5)) / 2;
    const ICO_V = [
        [-1, ICO_T, 0], [1, ICO_T, 0], [-1, -ICO_T, 0], [1, -ICO_T, 0], [0, -1, ICO_T], [0, 1, ICO_T],
        [0, -1, -ICO_T], [0, 1, -ICO_T], [ICO_T, 0, -1], [ICO_T, 0, 1], [-ICO_T, 0, -1], [-ICO_T, 0, 1],
    ].map((v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
    const ICO_F = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    const ICO_N = ICO_F.map((f) => {
        const x = ICO_V[f[0]][0] + ICO_V[f[1]][0] + ICO_V[f[2]][0];
        const y = ICO_V[f[0]][1] + ICO_V[f[1]][1] + ICO_V[f[2]][1];
        const z = ICO_V[f[0]][2] + ICO_V[f[1]][2] + ICO_V[f[2]][2];
        const l = Math.hypot(x, y, z);
        return [x / l, y / l, z / l];
    });
    const LIGHT = (() => { const v = [-0.45, 0.55, 0.7], l = Math.hypot(...v); return v.map((n) => n / l); })();
    const HALF = (() => { const v = [LIGHT[0], LIGHT[1], LIGHT[2] + 1], l = Math.hypot(...v); return v.map((n) => n / l); })();

    function rot3(v, ax, ay, az) {
        const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
        const y1 = v[1] * cx - v[2] * sx, z1 = v[1] * sx + v[2] * cx;
        const x2 = v[0] * cy + z1 * sy, z2 = -v[0] * sy + z1 * cy;
        return [x2 * cz - y1 * sz, x2 * sz + y1 * cz, z2];
    }

    // world point -> screen. Same angular mapping the wall rays use, so sprites stay glued to the walls.
    const PR = { sx: 0, sy: 0, S: 0, dist: 0 };
    function project(wx, wy, wz, margin) {
        const dx = wx - player.x, dy = wy - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.12) return false;
        let a = Math.atan2(dy, dx) - cam.angle;
        while (a < -Math.PI) a += Math.PI * 2;
        while (a > Math.PI) a -= Math.PI * 2;
        const sx = W * (0.5 + a / FOV);
        if (sx < -margin || sx > W + margin) return false;
        PR.sx = sx; PR.dist = dist; PR.S = H / dist;
        PR.sy = cam.half + (0.5 - wz) * PR.S;
        return true;
    }

    function render() {
        loadTextures();
        const buf = screenBuffer.data;
        const intro = introProgress;
        const fb = cheats.fullbright;

        // camera: walking sway + shake
        const camBobX = Math.sin(bobTimer * 0.35) * 8 * bobAmp + (shake > 0 ? (Math.random() - 0.5) * shake * 6 : 0);
        const camBobY = Math.abs(Math.sin(bobTimer * 0.7)) * 1.5 * bobAmp + (shake > 0 ? (Math.random() - 0.5) * shake * 3 : 0);
        const halfH = H / 2;
        const bobbedHalfH = halfH + camBobY;
        const angleOffset = (camBobX / W) * FOV;
        const camAngle = player.angle + angleOffset;
        cam.angle = camAngle;
        cam.half = bobbedHalfH;

        const baseAngle = camAngle - FOV / 2;
        const rayDirX0 = Math.cos(baseAngle), rayDirY0 = Math.sin(baseAngle);
        const rayDirX1 = Math.cos(camAngle + FOV / 2), rayDirY1 = Math.sin(camAngle + FOV / 2);

        const flick = 1 + 0.025 * Math.sin(T * 7.3) + 0.015 * Math.sin(T * 13.1);
        const orbAmt = intro * (0.85 + 0.15 * Math.sin(T * 3.1));
        const ot = tints.orb;
        const olr = Math.min(255, 190 * ot[0]), olg = Math.min(255, 190 * ot[1]), olb = Math.min(255, 190 * ot[2]);
        const LR2 = ORB_LIGHT_R * ORB_LIGHT_R;

        // ---- wall rays ----
        for (let i = 0; i < W; i++) {
            const rayAngle = baseAngle + (i / W) * FOV;
            let eyeX = Math.cos(rayAngle), eyeY = Math.sin(rayAngle);
            if (Math.abs(eyeX) < 1e-6) eyeX = 1e-6;
            if (Math.abs(eyeY) < 1e-6) eyeY = 1e-6;

            let mapX = Math.floor(player.x), mapY = Math.floor(player.y);
            const deltaDistX = Math.abs(1 / eyeX), deltaDistY = Math.abs(1 / eyeY);
            let stepX, stepY, sideDistX, sideDistY;
            if (eyeX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
            else { stepX = 1; sideDistX = (mapX + 1 - player.x) * deltaDistX; }
            if (eyeY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
            else { stepY = 1; sideDistY = (mapY + 1 - player.y) * deltaDistY; }

            let hit = 0, side = 0, hitType = 1;
            while (hit === 0) {
                if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
                else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
                if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) { hit = 1; hitType = 1; }
                else if (map[mapY][mapX] === 1 || map[mapY][mapX] === 3) { hit = 1; hitType = map[mapY][mapX]; }
            }
            wallTypes[i] = hitType;

            let dist = side === 0 ? (mapX - player.x + (1 - stepX) / 2) / eyeX : (mapY - player.y + (1 - stepY) / 2) / eyeY;
            if (dist < 0.1) dist = 0.1;
            zBuffer[i] = dist;

            const fullH = Math.min(H * 2, Math.floor(H / dist));
            const wallH = Math.floor(fullH * intro);
            const bottom = Math.floor(bobbedHalfH + fullH / 2);
            const topRaw = bottom - wallH;
            wallTops[i] = Math.max(0, topRaw);
            wallBottoms[i] = Math.min(H, bottom);
            wallRawTop[i] = topRaw;
            wallHeights[i] = wallH;

            let wallX = side === 0 ? player.y + dist * eyeY : player.x + dist * eyeX;
            wallX -= Math.floor(wallX);
            const td = hitType === 3 ? tex.door : tex.wall;
            wallTexX[i] = td ? clamp(Math.floor(wallX * td.width), 0, td.width - 1) : -1;

            let sh = fogShade(dist) * (side === 1 ? 0.82 : 1) * (fb ? 1 : flick);
            if (hitType === 3) sh = Math.max(sh, fb ? 1 : 0.5) * (1 + 0.08 * Math.sin(T * 3));   // doors always read as doors
            wallShade[i] = Math.min(1.1, sh);

            const hx = player.x + eyeX * dist - orb.x, hy = player.y + eyeY * dist - orb.y;
            const d2 = hx * hx + hy * hy;
            wallLight[i] = d2 < LR2 ? Math.pow(1 - Math.sqrt(d2) / ORB_LIGHT_R, 2) * orbAmt * 0.5 : 0;
        }

        // ---- walls, floor and ceiling ----
        const wt = tints.wall, dt3 = tints.door, ft = tints.floor, ct = tints.ceil;
        const fr = fogColor[0], fg = fogColor[1], fbl = fogColor[2];
        for (let y = 0; y < H; y++) {
            const isFloor = y > bobbedHalfH;
            const p = Math.max(0.5, Math.abs(y - bobbedHalfH));
            const rowDist = (H * 0.5) / p;
            const rowShade = fogShade(rowDist);
            const floorStepX = (rowDist * (rayDirX1 - rayDirX0)) / W;
            const floorStepY = (rowDist * (rayDirY1 - rayDirY0)) / W;
            let floorX = player.x + rowDist * rayDirX0;
            let floorY = player.y + rowDist * rayDirY0;
            const bayerRow = (y & 3) << 2;
            const texF = isFloor ? tex.floor : tex.ceiling;
            const tt = isFloor ? ft : ct;

            for (let x = 0; x < W; x++) {
                const idx = (y * W + x) * 4;
                const bayer = BAYER[bayerRow | (x & 3)];
                let r, g, b, light = 0;

                if (y >= wallTops[x] && y < wallBottoms[x]) {
                    const isDoor = wallTypes[x] === 3;
                    const td = isDoor ? tex.door : tex.wall;
                    const tn = isDoor ? dt3 : wt;
                    if (td && wallTexX[x] >= 0) {
                        const th = td.height;
                        const wtY = clamp(Math.floor(((y - wallRawTop[x]) / Math.max(1, wallHeights[x])) * th), 0, th - 1);
                        const wi = (wtY * td.width + wallTexX[x]) * 4;
                        r = td.data[wi] * tn[0]; g = td.data[wi + 1] * tn[1]; b = td.data[wi + 2] * tn[2];
                    } else { r = 200 * tn[0]; g = 200 * tn[1]; b = 200 * tn[2]; }
                    const s = wallShade[x];
                    const sh = fb ? s : Math.min(1.1, Math.floor(s * SHADE_LEVELS + bayer) / SHADE_LEVELS);
                    light = wallLight[x];
                    r = r * sh + (fb ? 0 : fr * (1 - sh)); g = g * sh + (fb ? 0 : fg * (1 - sh)); b = b * sh + (fb ? 0 : fbl * (1 - sh));
                } else {
                    if (texF) {
                        const tx = Math.abs(Math.floor((floorX - Math.floor(floorX)) * texF.width)) % texF.width;
                        const ty = Math.abs(Math.floor((floorY - Math.floor(floorY)) * texF.height)) % texF.height;
                        const ti = (ty * texF.width + tx) * 4;
                        r = texF.data[ti] * tt[0]; g = texF.data[ti + 1] * tt[1]; b = texF.data[ti + 2] * tt[2];
                    } else {
                        const base = isFloor ? 45 : 25;
                        r = base * tt[0]; g = base * tt[1]; b = base * tt[2];
                    }
                    const sh = fb ? 1 : Math.floor(rowShade * SHADE_LEVELS + bayer) / SHADE_LEVELS;
                    const odx = floorX - orb.x, ody = floorY - orb.y, d2 = odx * odx + ody * ody;
                    if (d2 < LR2) light = Math.pow(1 - Math.sqrt(d2) / ORB_LIGHT_R, 2) * orbAmt * (isFloor ? 0.6 : 0.3);
                    r = r * sh + (fb ? 0 : fr * (1 - sh)); g = g * sh + (fb ? 0 : fg * (1 - sh)); b = b * sh + (fb ? 0 : fbl * (1 - sh));
                }
                if (light > 0) { r += olr * light; g += olg * light; b += olb * light; }
                buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = 255;
                floorX += floorStepX;
                floorY += floorStepY;
            }
        }

        // ---- sprites: keys, orb (back to front), then particles and dust ----
        const list = [];
        for (const k of keysList) list.push({ k, d: Math.hypot(k.x - player.x, k.y - player.y) });
        list.push({ k: null, d: Math.hypot(orb.x - player.x, orb.y - player.y) });
        list.sort((a, b) => b.d - a.d);
        for (const it of list) { if (it.k) drawKey(it.k, buf, intro); else drawOrb(buf, intro); }
        drawParticles(buf, intro);

        // ---- vignette (before the HUD so the hands stay clean) ----
        for (let i = 0, n = W * H; i < n; i++) {
            const v = VIG[i], j = i * 4;
            buf[j] *= v; buf[j + 1] *= v; buf[j + 2] *= v;
        }

        drawHUD(buf);

        if (flash > 0.01) {
            const fr2 = 255 * (0.6 + 0.4 * Math.min(1, ot[0])), fg2 = 255 * (0.6 + 0.4 * Math.min(1, ot[1])), fb2 = 255 * (0.6 + 0.4 * Math.min(1, ot[2]));
            for (let i = 0, n = W * H; i < n; i++) {
                const j = i * 4;
                buf[j] += fr2 * flash; buf[j + 1] += fg2 * flash; buf[j + 2] += fb2 * flash;
            }
        }

        ctx.putImageData(screenBuffer, 0, 0);
        if (cheats.map) drawMinimap();
    }

    function drawKey(k, buf, intro) {
        const z = 0.3 + Math.sin(T * 2.2 + k.phase) * 0.045;
        if (!project(k.x, k.y, z, W * 0.25)) return;
        const S = PR.S, sx = PR.sx, sy = PR.sy, dist = PR.dist;
        const sizePx = Math.floor(S * 0.3 * intro);
        if (sizePx < 1) return;

        // soft shadow on the floor
        const fy = cam.half + 0.5 * S, shW = sizePx * 0.55, shH = Math.max(1, sizePx * 0.16);
        for (let yy = Math.max(0, Math.floor(fy - shH)); yy <= Math.min(H - 1, Math.ceil(fy + shH)); yy++) {
            for (let xx = Math.max(0, Math.floor(sx - shW)); xx <= Math.min(W - 1, Math.ceil(sx + shW)); xx++) {
                const ex = (xx - sx) / shW, ey = (yy - fy) / shH;
                if (ex * ex + ey * ey <= 1 && dist < zBuffer[xx]) {
                    const j = (yy * W + xx) * 4;
                    buf[j] *= 0.55; buf[j + 1] *= 0.55; buf[j + 2] *= 0.55;
                }
            }
        }

        const ts = tex.key;
        const x0 = Math.floor(sx - sizePx / 2), y0 = Math.floor(sy - sizePx / 2);
        const sh = Math.max(0.6, fogShade(dist));
        if (ts) {
            for (let x = Math.max(0, x0); x < Math.min(W, x0 + sizePx); x++) {
                if (dist >= zBuffer[x]) continue;
                const tx = clamp(Math.floor(((x - x0) / sizePx) * ts.width), 0, ts.width - 1);
                for (let y = Math.max(0, y0); y < Math.min(H, y0 + sizePx); y++) {
                    const ty = clamp(Math.floor(((y - y0) / sizePx) * ts.height), 0, ts.height - 1);
                    const ti = (ty * ts.width + tx) * 4;
                    if (ts.data[ti + 3] > 128) {
                        const j = (y * W + x) * 4;
                        buf[j] = ts.data[ti] * sh; buf[j + 1] = ts.data[ti + 1] * sh; buf[j + 2] = ts.data[ti + 2] * sh; buf[j + 3] = 255;
                    }
                }
            }
        }
        // glint
        if ((T * 1.7 + k.phase) % 3 < 0.18) {
            const gx = Math.round(sx + sizePx * 0.22), gy = Math.round(sy - sizePx * 0.3);
            for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const px = gx + ox, py = gy + oy;
                if (px >= 0 && px < W && py >= 0 && py < H && dist < zBuffer[px]) {
                    const j = (py * W + px) * 4;
                    buf[j] = 255; buf[j + 1] = 250; buf[j + 2] = 220;
                }
            }
        }
    }

    function drawOrb(buf, intro) {
        const z = 0.5 + Math.sin(T * 1.6) * 0.04;
        if (!project(orb.x, orb.y, z, W * 0.4)) return;
        const S = PR.S * intro, sx = PR.sx, sy = PR.sy, dist = PR.dist;
        const R = S * 0.27;
        if (R < 0.8) return;
        const ot = tints.orb;

        // additive glow
        const Rg = R * 2.6, pulse = 0.85 + 0.15 * Math.sin(T * 4);
        for (let y = Math.max(0, Math.floor(sy - Rg)); y <= Math.min(H - 1, Math.ceil(sy + Rg)); y++) {
            for (let x = Math.max(0, Math.floor(sx - Rg)); x <= Math.min(W - 1, Math.ceil(sx + Rg)); x++) {
                if (dist >= zBuffer[x]) continue;
                const d = Math.hypot(x - sx, y - sy);
                if (d >= Rg) continue;
                const a = Math.pow(1 - d / Rg, 2) * 0.55 * pulse, j = (y * W + x) * 4;
                buf[j] += 255 * Math.min(1, ot[0]) * a; buf[j + 1] += 255 * Math.min(1, ot[1]) * a; buf[j + 2] += 255 * Math.min(1, ot[2]) * a;
            }
        }

        // faceted body, back faces culled so nothing overlaps
        const pts = ICO_V.map((v) => { const r = rot3(v, orbAngX, orbAngY, orbAngZ); return { x: sx + r[0] * R, y: sy - r[1] * R }; });
        for (let f = 0; f < ICO_F.length; f++) {
            const n = rot3(ICO_N[f], orbAngX, orbAngY, orbAngZ);
            if (n[2] <= 0) continue;
            const diff = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
            const spec = Math.pow(Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]), 22);
            const band = Math.floor(diff * 3.999) / 3;
            const lum = 0.36 + 0.64 * band + (spec > 0.55 ? 0.28 : 0);
            const cr = 235 * lum * ot[0], cg = 235 * lum * ot[1], cb = 235 * lum * ot[2];
            fillTri(buf, pts[ICO_F[f][0]], pts[ICO_F[f][1]], pts[ICO_F[f][2]], cr, cg, cb, dist);
        }
    }

    function fillTri(buf, p0, p1, p2, r, g, b, dist) {
        const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x))), maxX = Math.min(W - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
        const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y))), maxY = Math.min(H - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));
        const area = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
        if (Math.abs(area) < 0.5) return;
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (dist >= zBuffer[x]) continue;
                const px = x + 0.5, py = y + 0.5;
                const s = ((p1.x - px) * (p2.y - py) - (p1.y - py) * (p2.x - px)) / area;
                const t = ((p2.x - px) * (p0.y - py) - (p2.y - py) * (p0.x - px)) / area;
                const u = 1 - s - t;
                if (s < 0 || t < 0 || u < 0) continue;
                const edge = Math.min(s, t, u) < 0.07 ? 0.58 : 1;       // dark seams between the facets
                const j = (y * W + x) * 4;
                buf[j] = r * edge; buf[j + 1] = g * edge; buf[j + 2] = b * edge; buf[j + 3] = 255;
            }
        }
    }

    function drawParticles(buf, intro) {
        for (const p of particles) {
            if (!project(p.x, p.y, p.z, 4)) continue;
            const px = Math.round(PR.sx), py = Math.round(PR.sy), dist = PR.dist;
            const sz = Math.max(1, Math.round(PR.S * p.sz));
            const f = clamp(p.life / p.max * 1.6, 0, 1);
            for (let y = py; y < py + sz; y++) for (let x = px; x < px + sz; x++) {
                if (x < 0 || x >= W || y < 0 || y >= H || dist >= zBuffer[x]) continue;
                const j = (y * W + x) * 4;
                buf[j] = p.r * f + buf[j] * (1 - f); buf[j + 1] = p.g * f + buf[j + 1] * (1 - f); buf[j + 2] = p.b * f + buf[j + 2] * (1 - f);
            }
        }
        // floating dust
        for (const m of motes) {
            if (!project(m.x, m.y, m.z, 2)) continue;
            const x = Math.round(PR.sx), y = Math.round(PR.sy);
            if (x < 0 || x >= W || y < 0 || y >= H || PR.dist >= zBuffer[x]) continue;
            const a = 38 * fogShade(PR.dist) * (0.6 + 0.4 * Math.sin(T * 2 + m.ph)) * intro, j = (y * W + x) * 4;
            buf[j] += a; buf[j + 1] += a; buf[j + 2] += a;
        }
    }

    function blit(t, w, h, xPos, yPos, mirror, buf) {
        if (!t) return;
        for (let y = 0; y < h; y++) {
            const sy = Math.floor(yPos + y);
            if (sy < 0 || sy >= H) continue;
            const ty = Math.floor((y / h) * t.height);
            for (let x = 0; x < w; x++) {
                const sx = Math.floor(xPos + x);
                if (sx < 0 || sx >= W) continue;
                const tx = Math.floor(((mirror ? w - 1 - x : x) / w) * t.width);
                const ti = (ty * t.width + tx) * 4;
                if (t.data[ti + 3] > 128) {
                    const j = (sy * W + sx) * 4;
                    buf[j] = t.data[ti]; buf[j + 1] = t.data[ti + 1]; buf[j + 2] = t.data[ti + 2]; buf[j + 3] = 255;
                }
            }
        }
    }

    function drawHUD(buf) {
        const bobX = Math.sin(bobTimer * 0.35) * 3.5 * bobAmp + Math.sin(T * 1.3) * 0.5;
        const bobY = Math.cos(bobTimer * 0.7) * 3.0 * bobAmp + Math.sin(T * 1.9) * 0.7;
        const s = primaryScale();
        const w = Math.floor(62 * s), h = Math.floor(62 * s);
        const t = equipAnim < 0.5 && tex.hand ? tex.hand : (tex.equip || tex.key);
        if (isDragging && playerHasKey) blit(t, w, h, dragX - w / 2, dragY - h / 2, false, buf);
        else blit(t, w, h, W - w + 7.5 + bobX, H - h + 10 + bobY, false, buf);
        const w2 = Math.floor(62 * 0.9), h2 = Math.floor(62 * 0.9);
        blit(tex.hand, w2, h2, -10 - bobX, H - h2 + 10 + bobY, true, buf);
    }

    // small local map for the cheat menu
    function drawMinimap() {
        const R = 10, cs = 3, span = (R * 2 + 1) * cs, ox = W - span - 4, oy = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(ox - 1, oy - 1, span + 2, span + 2);
        const pc = Math.floor(player.x), pr = Math.floor(player.y);
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            const row = map[pr + dy];
            if (!row || row[pc + dx] === undefined) continue;
            const v = row[pc + dx];
            ctx.fillStyle = v === 1 ? '#1D2B53' : v === 3 ? '#FFA300' : v === 4 ? '#FFEC27' : v === 2 ? '#FF77A8' : '#5F574F';
            ctx.fillRect(ox + (dx + R) * cs, oy + (dy + R) * cs, cs, cs);
        }
        const px = Math.round(ox + (R + player.x - pc) * cs), py = Math.round(oy + (R + player.y - pr) * cs);
        ctx.fillStyle = '#29ADFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        ctx.fillStyle = '#FFF1E8';
        ctx.fillRect(Math.round(px + Math.cos(player.angle) * 3), Math.round(py + Math.sin(player.angle) * 3), 1, 1);
    }

    // ==========================================
    // 11. CHEAT MENU   (Up, Up, Down, Down, X, Left)
    // ==========================================
    let cheatPanel = null, cheatInfo = null, cheatStatus = null;

    function injectCheatCSS() {
        if (document.getElementById('_maze_cheat_style')) return;
        const s = document.createElement('style');
        s.id = '_maze_cheat_style';
        s.textContent = `
.cm-panel,.cm-testbar,.cm-dlg{
--c-surface:var(--color-surface,#c0c0c0);--c-hi:var(--color-hi,#fff);--c-lo:var(--color-lo,#808080);--c-dark:var(--color-dark,#0a0a0a);
--c-title:var(--color-titlebar,#000080);--c-titletext:var(--color-title-text,#fff);--c-ink:var(--color-ink,#020202);
--c-field:var(--color-clock-face,#f8f8f8);--c-link:var(--color-link,#192cd3);--c-warn:var(--color-link-visited,#d31941);--c-accent:var(--color-accent,#520909);
--c-font:var(--font-ui,sans-serif);--c-mono:var(--font-mono,monospace);
background:var(--c-surface);color:var(--c-ink);font:bold 12px/1.3 var(--c-font);padding:3px;box-sizing:border-box;
border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark);user-select:none}
.cm-panel *,.cm-testbar *,.cm-dlg *{box-sizing:border-box}
.cm-panel{position:fixed;top:8px;right:8px;bottom:8px;width:min(300px,calc(100vw - 16px));z-index:99999;display:none;flex-direction:column}
.cm-panel.on{display:flex;animation:cm-pop var(--motion-pop-time,.5s) var(--motion-pop,cubic-bezier(.175,.885,.32,1.275))}
.cm-panel.min{bottom:auto!important;height:auto!important}
.cm-panel.min .cm-body{display:none}
.cm-title{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:3px 5px;background:var(--c-title);color:var(--c-titletext);font-size:var(--size-bar,12px);font-weight:bold;touch-action:none}
.cm-panel .cm-title{cursor:move}
.cm-tbtns{display:flex;gap:2px}
.cm-tb{display:grid;place-items:center;width:18px;height:16px;padding:0;background:var(--c-surface);color:var(--c-ink);font:bold 12px/1 var(--c-font);cursor:pointer;border-radius:0;
border:1px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi)}
.cm-tb:active{border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo)}
.cm-body{display:flex;flex-direction:column;gap:8px;margin-top:4px;padding:6px;background:var(--c-surface);overflow:auto;flex:1;min-height:0}
.cm-body::-webkit-scrollbar{width:16px}
.cm-body::-webkit-scrollbar-track{background:repeating-conic-gradient(var(--c-surface) 0 25%,var(--c-hi) 0 50%) 0 0/2px 2px}
.cm-body::-webkit-scrollbar-thumb{background:var(--c-surface);border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset -1px -1px var(--c-dark)}
.cm-head{display:flex;justify-content:space-between;align-items:baseline;font-size:14px}
.cm-sec{display:flex;flex-direction:column;gap:5px}
.cm-grp{border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);padding:6px;display:flex;flex-direction:column;gap:5px}
.cm-lbl{font-size:12px}
.cm-row{display:flex;flex-wrap:wrap;gap:4px}
.cm-center{justify-content:center}
.cm-btn{font:inherit;color:var(--c-ink);background:var(--c-surface);min-height:24px;padding:2px 8px;cursor:pointer;border-radius:0;
border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark)}
.cm-btn:active,.cm-btn.sel{border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);box-shadow:inset 1px 1px var(--c-dark),inset -1px -1px var(--c-surface)}
.cm-btn.sel{background:repeating-conic-gradient(var(--c-surface) 0 25%,var(--c-hi) 0 50%) 0 0/2px 2px}
.cm-btn:disabled{color:var(--c-lo);text-shadow:1px 1px var(--c-hi);cursor:default}
.cm-btn:disabled:active{border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark)}
.cm-btn:focus-visible,.cm-tb:focus-visible,.cm-help summary:focus-visible{outline:1px dotted var(--c-ink);outline-offset:2px}
.cm-btn.go{outline:1px solid var(--c-ink)}
.cm-btn.go:focus-visible{outline:1px dotted var(--c-ink)}
.cm-btn.bad{color:var(--c-warn)}
.cm-chip{min-width:28px;text-align:center;padding:2px 0}
.cm-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.cm-tile{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 2px;font-size:10px;white-space:nowrap}
.cm-tile img{width:42px;height:42px;image-rendering:pixelated;background:#000;display:block;border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo)}
.cm-warn{color:var(--c-warn)}
.cm-ok{color:var(--c-ink)}
.cm-field{background:var(--c-field);border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);padding:2px 5px}
.cm-status{min-height:3.6em}
.cm-hover{min-height:1.9em}
.cm-data textarea{width:100%;height:84px;resize:vertical;background:var(--c-field);color:var(--c-ink);font:10px/1.3 var(--c-mono);padding:4px;border-radius:0;user-select:text;
border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo)}
.cm-help summary{cursor:pointer}
.cm-help dl{margin:6px 0 0;display:grid;grid-template-columns:auto 1fr;gap:2px 10px}
.cm-help dt{color:var(--c-link)}
.cm-help dd{margin:0}
.cm-testbar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:99999;display:none;flex-direction:column;min-width:280px}
.cm-testbar.on{display:flex;animation:cm-pop-c var(--motion-pop-time,.5s) var(--motion-pop,cubic-bezier(.175,.885,.32,1.275))}
.cm-tbody{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;padding:8px}
.cm-dlg{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100000;min-width:250px;max-width:320px;animation:cm-pop-c var(--motion-pop-time,.5s) var(--motion-pop,cubic-bezier(.175,.885,.32,1.275))}
.cm-dbody{margin-top:4px;padding:12px 12px 10px;display:flex;flex-direction:column;gap:12px}
.cm-dlg p{margin:0;font-size:13px}
.cm-dlg .cm-btn{min-width:72px}
@keyframes cm-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes cm-pop-c{from{transform:translate(-50%,-50%) scale(.6);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
.cm-testbar.on{animation-name:cm-pop-b}
@keyframes cm-pop-b{from{transform:translateX(-50%) scale(.6);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.cm-panel.on,.cm-testbar.on,.cm-dlg{animation:none}}
@media (max-width:820px){.cm-panel{top:auto!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;max-height:46vh}.cm-panel .cm-title{cursor:default}}

.cm-panel{bottom:auto;height:auto;width:min(268px,calc(100vw - 16px));max-height:calc(100dvh - 16px)}
.cm-info{font-size:13px}
.cm-btn{flex:1 1 auto}
`;
        document.head.appendChild(s);
    }

    function buildCheatUI() {
        if (cheatPanel) return;
        injectCheatCSS();
        cheatPanel = document.createElement('div');
        cheatPanel.className = 'cm-panel';
        cheatPanel.setAttribute('role', 'region');
        cheatPanel.setAttribute('aria-label', 'Cheat menu');
        cheatPanel.innerHTML = `
<div class="cm-title"><span>cheats.exe</span>
  <span class="cm-tbtns">
    <button class="cm-tb" data-act="min" aria-label="Minimize">_</button>
    <button class="cm-tb" data-act="close" aria-label="Close cheat menu">&times;</button>
  </span>
</div>
<div class="cm-body">
  <div class="cm-field cm-info" id="cm-info"></div>
  <div class="cm-grp"><span class="cm-lbl">Level</span>
    <div class="cm-row">
      <button class="cm-btn" data-act="prev">Previous</button>
      <button class="cm-btn" data-act="next">Next</button>
      <button class="cm-btn" data-act="skip">Skip level</button>
      <button class="cm-btn" data-act="regen">New maze</button>
    </div>
  </div>
  <div class="cm-grp"><span class="cm-lbl">Items</span>
    <div class="cm-row">
      <button class="cm-btn" data-act="key">Give key</button>
      <button class="cm-btn" data-act="doors">Open all doors</button>
    </div>
  </div>
  <div class="cm-grp"><span class="cm-lbl">Player</span>
    <div class="cm-row">
      <button class="cm-btn" data-act="noclip" data-t="noclip">Noclip</button>
      <button class="cm-btn" data-act="speed" data-v="1" data-t="s1">1x</button>
      <button class="cm-btn" data-act="speed" data-v="2" data-t="s2">2x</button>
      <button class="cm-btn" data-act="speed" data-v="4" data-t="s4">4x</button>
    </div>
  </div>
  <div class="cm-grp"><span class="cm-lbl">View and sound</span>
    <div class="cm-row">
      <button class="cm-btn" data-act="bright" data-t="fullbright">Fullbright</button>
      <button class="cm-btn" data-act="map" data-t="map">Map</button>
      <button class="cm-btn" data-act="mute" data-t="mute">Mute</button>
    </div>
  </div>
  <div class="cm-field cm-status" id="cm-status" aria-live="polite"></div>
</div>`;
        document.body.appendChild(cheatPanel);
        cheatInfo = cheatPanel.querySelector('#cm-info');
        cheatStatus = cheatPanel.querySelector('#cm-status');

        cheatPanel.addEventListener('click', (e) => {
            const b = e.target.closest('[data-act]');
            if (!b) return;
            cheatAct(b.dataset.act, b.dataset.v);
            if (document.activeElement === b) b.blur();
        });

        // drag by the title bar
        const bar = cheatPanel.querySelector('.cm-title');
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
        if (cheatInfo) cheatInfo.textContent = 'Level ' + level + '  -  ' + size + 'x' + size + (doorsList.length ? '  -  ' + doorsList.length + ' door(s)' : '');
    }

    function renderCheats() {
        if (!cheatPanel) return;
        const state = { noclip: cheats.noclip, fullbright: cheats.fullbright, map: cheats.map, mute: muted,
            s1: cheats.speed === 1, s2: cheats.speed === 2, s4: cheats.speed === 4 };
        cheatPanel.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('sel', !!state[b.dataset.t]));
        updateCheatInfo();
    }

    function setLevel(n) {
        n = clamp(n, 1, MAX_LEVEL);
        level = n - 1;
        size = START_SIZE + SIZE_STEP * (n - 1);
        flash = 0;
        initLevel();
        say('Level ' + n + ' (' + size + 'x' + size + ').');
    }

    function cheatAct(a, v) {
        switch (a) {
            case 'close': toggleCheats(false); return;
            case 'min': cheatPanel.classList.toggle('min'); return;
            case 'prev': setLevel(level - 1); break;
            case 'next': setLevel(level + 1); break;
            case 'regen': setLevel(level); break;
            case 'skip':
                if (gameState !== 'PLAYING') { say('Wait for the walls to finish moving.'); return; }
                player.x = orb.x; player.y = orb.y;
                say('Skipping to the next level.');
                break;
            case 'key':
                if (playerHasKey) { say('You already hold a key.'); return; }
                playerHasKey = true;
                say('Key added. Drag it onto a door, or press E next to one.');
                break;
            case 'doors': {
                const n = doorsList.length;
                if (!n) { say('No doors on this level.'); return; }
                for (const d of doorsList.slice()) openDoor(d.r, d.c);
                say('Opened ' + n + ' door(s).');
                break;
            }
            case 'noclip': cheats.noclip = !cheats.noclip; say('Noclip ' + (cheats.noclip ? 'on.' : 'off.')); if (!cheats.noclip && !canStand(player.x, player.y)) { player.x = 1.5; player.y = 1.5; say('Noclip off. Moved you back to the start.'); } break;
            case 'speed': cheats.speed = +v; say('Speed ' + v + 'x.'); break;
            case 'bright': cheats.fullbright = !cheats.fullbright; say('Fullbright ' + (cheats.fullbright ? 'on.' : 'off.')); break;
            case 'map': cheats.map = !cheats.map; say('Map ' + (cheats.map ? 'on.' : 'off.')); break;
            case 'mute': muted = !muted; say('Sound ' + (muted ? 'muted.' : 'on.')); break;
        }
        renderCheats();
    }
    window.openMazeCheats = toggleCheats;               // handy for debugging from the console

    // ==========================================
    // 12. LOOP
    // ==========================================
    refreshActive();
    let wasActive = activeCache;
    initLevel(!wasActive);                              // the build sound waits until the window is actually visible

    let last = performance.now(), frameNo = 0;
    function loop(now) {
        requestAnimationFrame(loop);
        const dt = clamp((now - last) / 1000, 0, 0.05);
        last = now;
        if (frameNo++ % 8 === 0) refreshActive();

        if (activeCache && !wasActive) {                // window just opened: replay the walls rising
            introProgress = 0;
            gameState = 'RISING';
            playSfx('build');
        }
        if (!activeCache && wasActive) { for (const k in keys) keys[k] = false; isDragging = false; }
        wasActive = activeCache;
        if (!activeCache) return;

        update(dt);
        render();
    }
    requestAnimationFrame(loop);

    console.log('// Loop initiated: //\n-- Player initiated! --\n-- Textures loaded! --\n-- Rendering initiated! --');
};

console.log('// render.js loaded //');