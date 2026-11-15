window.initPlateformer = function() {
    // ==========================================
    // 1. COLOR PALETTE & CANVAS SETUP
    // ==========================================
    const PAL = ['#000000','#1D2B53','#7E2553','#008751','#AB5236','#5F574F','#C2C3C7','#FFF1E8','#FF004D','#FFA300','#FFEC27','#00E436','#29ADFF','#83769C','#FF77A8','#FFCCAA'];

    const container = document.getElementById('_plateformer_container');
    if (!container) return;
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        container.appendChild(canvas);
    }
    
    canvas.width = 128;
    canvas.height = 128;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
    canvas.style.setProperty('-webkit-optimize-contrast', 'pixelated');
    canvas.style.setProperty('-moz-crisp-edges', 'pixelated');

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;

    // ==========================================
    // 2. CONSTANTS & LEVEL DICTIONARY SYSTEM
    // ==========================================
    const TILE = 8;
    const GRAVITY = 0.18;

    // Dictionary of levels:
    // 0 = empty, 1 = solid, 3 = refill, 4 = level orb, 5 = spawn, 6 = end game
    // Spike IDs: 2 = Up, 7 = Down, 8 = Left, 9 = Right, 10 = Solid Pink Death Block
    const levels = {
        1: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,0,1,0,1,1,1,1], 
            [1,1,1,0,0,1,0,0,0,0,0,1,1,1,1,1],
            [1,0,1,1,0,0,0,0,0,0,0,0,0,1,1,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,5,0,0,0,0,0,0,0,0,0,0,4,0,1],
            [1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] 
        ],
        2: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,0,0,0,0,0,0,3,0,0,0,0,0,1,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,4,1,1], 
            [1,0,0,0,0,2,2,2,2,2,2,2,1,1,1,1], 
            [1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], 
            [1,0,0,0,0,0,0,0,3,0,0,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], 
            [1,0,0,2,2,2,2,2,2,2,0,0,0,0,1,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1],
            [1,0,0,0,0,0,0,0,3,0,0,0,0,0,1,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], 
            [1,0,5,0,2,2,2,2,2,2,2,0,0,0,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] 
        ],

        3: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,3,0,0,0,0,3,0,0,4,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,2,2,2,0,0,0,2,2,2,2,2,2,2,2,1],
            [1,7,7,7,0,0,0,7,7,7,7,7,7,7,7,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,2,2,2,2,2,2,0,3,0,2,2,2,2,2,1], 
            [1,7,7,7,7,7,7,0,0,0,7,7,7,7,7,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], 
            [1,0,5,0,0,0,0,0,0,0,0,0,0,1,1,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] 
        ],

        4: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,0,1,0,0,0,0,0,0,0,0,0,0,4,1],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1],
            [1,0,0,0,0,2,0,0,1,0,0,0,0,0,0,1], 
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,1] 
        ],

        5: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1],
            [1,0,0,0,0,0,3,0,0,0,0,0,0,0,1,1],
            [4,0,2,2,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,2,1,2,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1],
            [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,1], 
            [1,0,2,2,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,1] 
        ],

        6: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,2,2,2,2,2,2,2,2,2,2,0,0,0,2,1],
            [1,7,7,7,7,7,7,7,7,7,7,0,0,0,7,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
            [1,0,0,0,0,0,0,3,0,0,0,0,0,0,0,1], 
            [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,2,2,2,2,2,2,2,2,2,2,2,2,1], 
            [1,0,0,7,7,7,7,7,7,7,7,7,7,7,7,1],
            [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,3,0,0,4,0,1], 
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1] 
        ],
        
        7: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,5,0,1,1,1,1,1,1,1],
            [1,0,1,1,1,1,0,0,0,1,1,1,1,0,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,3,2,2,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,7,7,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,0,1,1,0,0,0,1,1,1,1,0,1,1],
            [1,1,1,1,1,1,2,2,3,1,1,1,1,1,1,1], 
            [1,1,1,1,1,1,7,7,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,3,2,2,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,7,7,1,1,1,1,0,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,4,2,1,1,1,1,1,1,1],
        ],

        8: [
            [1,1,1,1,1,1,10,10,10,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,5,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,2,3,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,7,7,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], 
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,3,2,2,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,7,7,1,1,1,10,1,1,1],
            [10,1,10,1,1,1,0,0,0,1,1,10,1,1,1,10],
            [1,1,10,10,1,1,0,0,0,1,1,10,10,10,10,10],
            [1,10,10,10,10,1,2,2,4,1,10,7,10,10,8,10],
        ],

        9: [
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,5,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10], 
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,10,10,10,10,10],
            [10,10,10,10,10,10,0,0,0,10,10,1,10,1,1,1],
            [10,1,10,1,10,10,0,0,0,10,1,1,1,1,0,1],
            [10,1,7,1,1,10,0,0,0,1,1,1,1,0,1,1],
            [1,0,1,1,1,1,2,2,4,1,1,0,1,1,1,1],
        ],

        10: [
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
            [10,10,7,7,10,10,10,10,10,1,10,10,10,1,10,10],
            [10,7,0,0,8,10,8,1,10,10,10,1,10,9,1,10],
            [10,9,5,0,0,7,1,0,1,1,10,1,1,10,1,1],
            [1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,1,1,0,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,1,1,1,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,1,1,1,0,0,1,1,1,1], 
            [1,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1],
            [1,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1], 
            [1,1,0,1,0,0,1,1,1,1,1,0,0,1,0,1],
            [1,1,1,1,0,1,1,1,1,1,1,1,0,0,0,1],
            [1,1,0,1,1,1,1,1,1,1,1,1,1,0,0,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,1], 
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] 
        ],
    };

    let currentLevelKey = 1;
    let map = levels[currentLevelKey];

    // Stats tracking
    let deathCount = 0;

    // Find spawn coordinates based on tile ID 5 in the current map
    function getSpawnPosition() {
        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                if (map[r][c] === 5) {
                    return { x: c * TILE, y: r * TILE };
                }
            }
        }
        return { x: 16, y: 80 }; // Fallback default
    }

    let SPAWN = getSpawnPosition();

    // ==========================================
    // 3. REFILL COLLECTIBLES MANAGEMENT
    // ==========================================
    let refills = [];
    function resetRefills() {
        refills = [];
        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                if (map[r][c] === 3) {
                    refills.push({ r, c, active: true, timer: 0 });
                }
            }
        }
    }
    resetRefills();

    // ==========================================
    // 4. INPUT HANDLING
    // ==========================================
    const keys = {};
    const pressedKeys = {};

    window.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if ([' ', 'x', 'c', 'shift', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(k)) {
            e.preventDefault();
        }
        if (!keys[k]) {
            pressedKeys[k] = true;
        }
        keys[k] = true;
    });

    window.addEventListener('keyup', e => {
        const k = e.key.toLowerCase();
        keys[k] = false;
    });

    // ==========================================
    // 5. PLAYER OBJECT & STATE VARIABLES
    // ==========================================
    const player = {
        x: SPAWN.x,
        y: SPAWN.y + 12,    // Start slightly below spawn point for hop
        w: 6,               // Collision width
        h: 6,               // Collision height
        vx: 0,
        vy: -3.8,           // Upward hop velocity
        grounded: false,
        dashCount: 1,
        dashTimer: 0,
        dashDir: { x: 1, y: 0 },
        trail: [],
        facing: 1,
        coyoteTimer: 0,
        jumpBuffer: 0,
        dead: false,
        deathTimer: 0,
        deathPos: { x: 0, y: 0 },
        bubbleRadius: 0,
        introState: true,
        clearedLevel: false,
        clearTimer: 0
    };

    const DEATH_DURATION = 90;
    let orbRotationAngle = 0;

    // ==========================================
    // 6. COLLISION & CHECK FUNCTIONS
    // ==========================================
    function getTile(x, y) {
        const col = Math.floor(x / TILE);
        const row = Math.floor(y / TILE);
        if (row < 0 || row >= 16 || col < 0 || col >= 16) return 0;
        return map[row][col];
    }

    function checkCollision(x, y, w, h) {
        return getTile(x, y) === 1 || 
               getTile(x + w - 0.01, y) === 1 || 
               getTile(x, y + h - 0.01) === 1 || 
               getTile(x + w - 0.01, y + h - 0.01) === 1;
    }

    function isSpikeTile(tile) {
        return tile === 2 || tile === 7 || tile === 8 || tile === 9 || tile === 10;
    }

    function checkSpike(x, y, w, h) {
        const corners = [
            getTile(x, y),
            getTile(x + w - 0.01, y),
            getTile(x, y + h - 0.01),
            getTile(x + w - 0.01, y + h - 0.01)
        ];
        return corners.some(tile => isSpikeTile(tile));
    }

    // Handles checking completion for either standard or final special orbs
    function checkFinish(player) {
        const isFinalLevel = !levels[currentLevelKey + 1];
        const targetTile = isFinalLevel ? 6 : 4;

        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                if (map[r][c] === targetTile) {
                    const ox = c * TILE;
                    const oy = r * TILE;
                    if (player.x < ox + 12 && player.x + player.w > ox - 4 &&
                        player.y < oy + 12 && player.y + player.h > oy - 4) {
                        
                        if (isFinalLevel) {
                            map[r][c] = 0;
                            end_game();
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function checkRefillCollision(player) {
        for (let ref of refills) {
            if (!ref.active) continue;
            const rx = ref.c * TILE + 2;
            const ry = ref.r * TILE + 2;
            const rw = 4;
            const rh = 4;
            if (player.x < rx + rw && player.x + player.w > rx &&
                player.y < ry + rh && player.y + player.h > ry) {
                if (player.dashCount < 1) {
                    player.dashCount = 1;
                    ref.active = false;
                    ref.timer = 120;
                }
            }
        }
    }

    // ==========================================
    // 7. GAME STATE TRIGGERS & RESET
    // ==========================================
    function triggerDeath() {
        if (player.dead || player.introState || player.clearedLevel) return;
        player.dead = true;
        deathCount++;
        player.deathTimer = DEATH_DURATION;
        player.deathPos = { x: Math.floor(player.x + player.w / 2), y: Math.floor(player.y + player.h / 2) };
        player.bubbleRadius = 2;
        player.vx = 0;
        player.vy = 0;
        player.trail = [];
    }

    function triggerClear() {
        if (player.clearedLevel || player.introState || player.dead) return;
        player.clearedLevel = true;
        player.clearTimer = 20;
        player.vx = 0;
        player.vy = 0;
        player.trail = [];
    }

    function end_game() {
        let _details = document.getElementsByClassName("plateformer_details");

        if (_details.length > 0) {
            _details[0].classList.add("open");
        }

        let _deaths = document.getElementById("_deaths");
        if (_deaths) {
            _deaths.textContent = "Deaths: " + deathCount;
            _deaths.title = "Deaths: " + deathCount;
        }
    }

    function loadNextLevel() {
        if (levels[currentLevelKey + 1]) {
            currentLevelKey++;
            map = levels[currentLevelKey];
            SPAWN = getSpawnPosition();
        }
    }

    function resetLevelState() {
        loadNextLevel();
        player.x = SPAWN.x;
        player.y = SPAWN.y + 12; 
        player.vx = 0;
        player.vy = -3.8;        
        player.dashCount = 1;
        player.dashTimer = 0;
        player.trail = [];
        player.clearedLevel = false;
        player.introState = true;
        resetRefills();
    }

    function respawnPlayer() {
        player.x = SPAWN.x;
        player.y = SPAWN.y;
        player.vx = 0;
        player.vy = 0;
        player.dashCount = 1;
        player.dashTimer = 0;
    }

    // ==========================================
    // 8. UPDATE LOGIC (GAME LOOP)
    // ==========================================
    function update() {
        orbRotationAngle += 0.04;

        for (let ref of refills) {
            if (!ref.active) {
                ref.timer--;
                if (ref.timer <= 0) {
                    ref.active = true;
                }
            }
        }

        if (player.introState) {
            player.vy += GRAVITY;
            player.y += player.vy;
            if (player.y >= SPAWN.y && player.vy > 0) {
                player.y = SPAWN.y;
                player.x = SPAWN.x;
                player.vy = 0;
                player.vx = 0;
                player.introState = false;
            }
            return;
        }

        if (player.clearedLevel) {
            player.clearTimer--;
            if (player.clearTimer <= 0) {
                resetLevelState();
            }
            return;
        }

        if (player.dead) {
            player.deathTimer--;
            if (player.deathTimer > DEATH_DURATION - 15) {
                player.bubbleRadius += 1.5;
            }
            if (player.deathTimer === Math.floor(DEATH_DURATION / 2)) {
                respawnPlayer();
            }
            if (player.deathTimer <= 0) {
                player.dead = false;
            }
            for (let k in pressedKeys) pressedKeys[k] = false;
            return;
        }

        const left = keys['arrowleft'] || keys['a'];
        const right = keys['arrowright'] || keys['d'];
        const up = keys['arrowup'] || keys['w'];
        const down = keys['arrowdown'] || keys['s'];
        
        const jumpJustPressed = pressedKeys[' '];
        const dashJustPressed = pressedKeys['x'] || pressedKeys['c'] || pressedKeys['shift'];
        const jumpHeld = keys[' '];

        if (jumpJustPressed) {
            player.jumpBuffer = 8;
        } else if (player.jumpBuffer > 0) {
            player.jumpBuffer--;
        }

        if (player.grounded) {
            player.coyoteTimer = 8;
            player.dashCount = 1;
        } else if (player.coyoteTimer > 0) {
            player.coyoteTimer--;
        }

        if (dashJustPressed && player.dashCount > 0 && player.dashTimer === 0) {
            let dx = 0;
            let dy = 0;
            if (left) dx = -1;
            if (right) dx = 1;
            if (up) dy = -1;
            if (down) dy = 1;

            if (dx === 0 && dy === 0) {
                dx = player.facing;
            }

            const len = Math.hypot(dx, dy);
            player.dashDir = { x: dx / len, y: dy / len };
            player.dashTimer = 8;
            player.dashCount = 0;
            player.vy = 0;
        }

        if (player.dashTimer > 0) {
            player.vx = player.dashDir.x * 3.8;
            player.vy = player.dashDir.y * 3.8;
            player.dashTimer--;

            player.trail.push({
                x: Math.floor(player.x),
                y: Math.floor(player.y),
                colorIndex: 12 + (player.dashTimer % 4) * 2
            });
            if (player.trail.length > 4) {
                player.trail.shift();
            }
        } else {
            if (player.trail.length > 0) {
                player.trail.shift();
            }

            if (left) {
                player.vx = -1.5;
                player.facing = -1;
            } else if (right) {
                player.vx = 1.5;
                player.facing = 1;
            } else {
                player.vx *= 0.75;
                if (Math.abs(player.vx) < 0.1) player.vx = 0;
            }

            if (player.jumpBuffer > 0 && player.coyoteTimer > 0) {
                player.vy = -3.2;
                player.grounded = false;
                player.coyoteTimer = 0;
                player.jumpBuffer = 0;
            }

            if (!jumpHeld && player.vy < -0.8) {
                player.vy += 0.25;
            }

            player.vy += GRAVITY;
            if (player.vy > 2.8) player.vy = 2.8;
        }

        player.x += player.vx;
        if (checkCollision(player.x, player.y, player.w, player.h)) {
            if (player.vx > 0) player.x = Math.floor((player.x + player.w) / TILE) * TILE - player.w;
            else if (player.vx < 0) player.x = Math.floor(player.x / TILE) * TILE + TILE;
            player.vx = 0;
            if (player.dashTimer > 0) player.dashTimer = 0;
        }
        if (checkSpike(player.x, player.y, player.w, player.h)) {
            triggerDeath();
            for (let k in pressedKeys) pressedKeys[k] = false;
            return;
        }
        if (checkFinish(player)) {
            if (!levels[currentLevelKey + 1]) {
                for (let k in pressedKeys) pressedKeys[k] = false;
                return;
            } else {
                triggerClear();
                for (let k in pressedKeys) pressedKeys[k] = false;
                return;
            }
        }

        player.y += player.vy;
        player.grounded = false;
        if (checkCollision(player.x, player.y, player.w, player.h)) {
            if (player.vy > 0) {
                player.y = Math.floor((player.y + player.h) / TILE) * TILE - player.h;
                player.grounded = true;
                player.coyoteTimer = 8;
                player.dashCount = 1;
            } else if (player.vy < 0) {
                player.y = Math.floor(player.y / TILE) * TILE + TILE;
            }
            player.vy = 0;
            if (player.dashTimer > 0) player.dashTimer = 0;
        }
        if (checkSpike(player.x, player.y, player.w, player.h)) {
            triggerDeath();
            for (let k in pressedKeys) pressedKeys[k] = false;
            return;
        }
        if (checkFinish(player)) {
            if (!levels[currentLevelKey + 1]) {
                for (let k in pressedKeys) pressedKeys[k] = false;
                return;
            } else {
                triggerClear();
                for (let k in pressedKeys) pressedKeys[k] = false;
                return;
            }
        }

        checkRefillCollision(player);

        for (let k in pressedKeys) {
            pressedKeys[k] = false;
        }
    }

    // ==========================================
    // 9. RENDERING & DRAWING HELPER FUNCTIONS
    // ==========================================
    function drawPixelRect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }

    function drawPixelSquareRing(cx, cy, r, color) {
        ctx.fillStyle = color;
        const rad = Math.floor(r);
        for (let y = -rad; y <= rad; y++) {
            for (let x = -rad; x <= rad; x++) {
                const maxDist = Math.max(Math.abs(x), Math.abs(y));
                if (maxDist === rad || maxDist === rad - 1) {
                    ctx.fillRect(Math.floor(cx + x), Math.floor(cy + y), 1, 1);
                }
            }
        }
    }

    function drawPixelSquareIris(cx, cy, radius, color) {
        ctx.fillStyle = color;
        const rad = Math.floor(radius);
        const minX = cx - rad;
        const maxX = cx + rad;
        const minY = cy - rad;
        const maxY = cy + rad;

        for (let y = 0; y < 128; y++) {
            for (let x = 0; x < 128; x++) {
                if (x < minX || x >= maxX || y < minY || y >= maxY) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    function drawSolidLowPolyGreyOrb(cx, cy, angle) {
        const nodes = [
            {x: 0, y: -4, z: 0},
            {x: 4, y: 0, z: 0},
            {x: 0, y: 4, z: 0},
            {x: -4, y: 0, z: 0},
            {x: 0, y: 0, z: 4},
            {x: 0, y: 0, z: -4}
        ];

        const radX = angle;
        const radY = angle * 1.3;
        const radZ = angle * 0.7;

        const cosX = Math.cos(radX), sinX = Math.sin(radX);
        const cosY = Math.cos(radY), sinY = Math.sin(radY);
        const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

        const projected = nodes.map(node => {
            let y1 = node.y * cosX - node.z * sinX;
            let z1 = node.y * sinX + node.z * cosX;
            let x2 = node.x * cosY + z1 * sinY;
            let z2 = -node.x * sinY + z1 * cosY;
            let x3 = x2 * cosZ - y1 * sinZ;
            let y3 = x2 * sinZ + y1 * cosZ;

            return {
                x: Math.floor(cx + x3),
                y: Math.floor(cy + y3),
                z: z2
            };
        });

        const faces = [
            [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4],
            [0, 1, 5], [1, 2, 5], [2, 3, 5], [3, 0, 5]
        ];

        faces.sort((fa, fb) => {
            const zA = (projected[fa[0]].z + projected[fa[1]].z + projected[fa[2]].z) / 3;
            const zB = (projected[fb[0]].z + projected[fb[1]].z + projected[fb[2]].z) / 3;
            return zA - zB;
        });

        faces.forEach(face => {
            const p0 = projected[face[0]];
            const p1 = projected[face[1]];
            const p2 = projected[face[2]];

            const nZ = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
            const avgZ = (p0.z + p1.z + p2.z) / 3;
            
            let color = PAL[5];
            if (nZ > 0) {
                color = avgZ > 0 ? PAL[6] : PAL[13];
            }

            const minX = Math.min(p0.x, p1.x, p2.x);
            const maxX = Math.max(p0.x, p1.x, p2.x);
            const minY = Math.min(p0.y, p1.y, p2.y);
            const maxY = Math.max(p0.y, p1.y, p2.y);

            for (let py = minY; py <= maxY; py++) {
                for (let px = minX; px <= maxX; px++) {
                    const w0 = (p1.x - p0.x) * (py - p0.y) - (p1.y - p0.y) * (px - p0.x);
                    const w1 = (p2.x - p1.x) * (py - p1.y) - (p2.y - p1.y) * (px - p1.x);
                    const w2 = (p0.x - p2.x) * (py - p2.y) - (p0.y - p2.y) * (px - p2.x);

                    if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) {
                        drawPixelRect(px, py, 1, 1, color);
                    }
                }
            }
        });
    }

    // ==========================================
    // 10. MAIN RENDER FUNCTION & GAME LOOP
    // ==========================================
    function draw() {
        ctx.imageSmoothingEnabled = false;

        drawPixelRect(0, 0, 128, 128, PAL[0]);

        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                const tile = map[r][c];
                const tx = c * TILE;
                const ty = r * TILE;

                if (tile === 1) {
                    drawPixelRect(tx, ty, TILE, TILE, PAL[5]);
                } else if (tile === 2) {
                    // Up Spikes
                    drawPixelRect(tx + 1, ty + 4, 2, 4, PAL[8]);
                    drawPixelRect(tx, ty + 6, 4, 2, PAL[8]);
                    drawPixelRect(tx + 5, ty + 4, 2, 4, PAL[8]);
                    drawPixelRect(tx + 4, ty + 6, 4, 2, PAL[8]);
                } else if (tile === 7) {
                    // Down Spikes
                    drawPixelRect(tx + 1, ty, 2, 4, PAL[8]);
                    drawPixelRect(tx, ty, 4, 2, PAL[8]);
                    drawPixelRect(tx + 5, ty, 2, 4, PAL[8]);
                    drawPixelRect(tx + 4, ty, 4, 2, PAL[8]);
                } else if (tile === 8) {
                    // Left Spikes
                    drawPixelRect(tx + 4, ty + 1, 4, 2, PAL[8]);
                    drawPixelRect(tx + 6, ty, 2, 4, PAL[8]);
                    drawPixelRect(tx + 4, ty + 5, 4, 2, PAL[8]);
                    drawPixelRect(tx + 6, ty + 4, 2, 4, PAL[8]);
                } else if (tile === 9) {
                    // Right Spikes
                    drawPixelRect(tx, ty + 1, 4, 2, PAL[8]);
                    drawPixelRect(tx, ty, 2, 4, PAL[8]);
                    drawPixelRect(tx, ty + 5, 4, 2, PAL[8]);
                    drawPixelRect(tx, ty + 4, 2, 4, PAL[8]);
                } else if (tile === 10) {
                    // Solid Pink Block of Death
                    drawPixelRect(tx, ty, TILE, TILE, PAL[8]);
                } else if (tile === 4 || tile === 6) {
                    drawSolidLowPolyGreyOrb(tx + 4, ty + 4, orbRotationAngle);
                }
            }
        }

        for (let ref of refills) {
            const rx = ref.c * TILE + 2;
            const ry = ref.r * TILE + 2;
            if (ref.active) {
                drawPixelRect(rx + 1, ry, 2, 4, PAL[11]);
                drawPixelRect(rx, ry + 1, 4, 2, PAL[11]);
            } else {
                drawPixelRect(rx + 1, ry + 1, 2, 2, PAL[5]);
            }
        }

        if (player.dead) {
            const cx = player.deathPos.x;
            const cy = player.deathPos.y;

            if (player.deathTimer > DEATH_DURATION - 15) {
                drawPixelSquareRing(cx, cy, player.bubbleRadius, PAL[8]);
            }

            let currentRadius = 0;
            if (player.deathTimer > 55) {
                const progress = (DEATH_DURATION - player.deathTimer) / 35;
                currentRadius = Math.floor(100 * (1 - progress));
            } else if (player.deathTimer > 35) {
                currentRadius = 0;
            } else {
                const progress = (35 - player.deathTimer) / 35;
                currentRadius = Math.floor(100 * progress);
            }

            drawPixelSquareIris(cx, cy, currentRadius, PAL[0]);
            return;
        }

        for (let i = 0; i < player.trail.length; i++) {
            const t = player.trail[i];
            drawPixelRect(t.x, t.y, player.w, player.h, PAL[t.colorIndex]);
        }

        if (!player.clearedLevel) {
            const pColor = player.dashTimer > 0 ? PAL[7] : (player.dashCount > 0 ? PAL[12] : PAL[6]);
            
            const stretchFactor = Math.min(Math.max(player.vy * 0.04, -0.12), 0.12);
            const drawW = player.w * (1 - stretchFactor);
            const drawH = player.h * (1 + stretchFactor);
            const drawX = player.x + (player.w - drawW) / 2;
            const drawY = player.y + (player.h - drawH);

            drawPixelRect(drawX, drawY, drawW, drawH, pColor);
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }
    loop();
};