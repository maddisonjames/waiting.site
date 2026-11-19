window.initPlateformer = function () {
    if (window.__plateformerRunning) return;          // never start two game loops
    const container = document.getElementById('_pico_container');
    if (!container) return;
    window.__plateformerRunning = true;

    // ==========================================
    // 1. CANVAS (sizing / pixel look is handled by style.js)
    // ==========================================
    const PAL = ['#000000','#1D2B53','#7E2553','#008751','#AB5236','#5F574F','#C2C3C7','#FFF1E8','#FF004D','#FFA300','#FFEC27','#00E436','#29ADFF','#83769C','#FF77A8','#FFCCAA'];

    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'screen-canvas';
        container.appendChild(canvas);
    }
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;

    // ==========================================
    // 2. LEVELS
    // ==========================================
    const TILE = 8;
    const levels = {
        1: [
            [1,1,1,10,10,1,1,1,1,10,1,1,10,10,10,1],
            [1,1,10,10,10,10,10,10,10,10,1,1,10,1,1,10],
            [1,10,10,1,1,1,1,1,10,10,10,1,1,1,1,10],
            [10,10,1,1,1,1,1,1,1,1,10,10,1,1,10,10],
            [1,1,1,10,10,10,10,1,1,10,10,1,10,1,1,1],
            [1,1,10,1,7,7,7,0,0,7,7,7,7,10,1,10],
            [1,10,9,0,0,0,0,0,0,0,0,0,0,7,10,1],
            [10,10,9,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,0,0,10],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,4,1,1],
            [1,1,5,0,2,2,2,2,2,2,2,2,0,1,1,1],
            [1,1,1,1,10,10,10,10,10,10,10,10,1,1,1,1],
            [1,1,1,10,10,1,1,1,10,10,1,10,10,1,1,1]
        ],
        2: [
            [10,10,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [10,1,0,0,0,0,0,0,3,0,0,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,4,1,10],
            [1,0,0,0,0,2,2,2,2,2,2,2,1,1,1,10],
            [1,0,0,1,1,1,1,1,1,1,1,1,1,1,10,10],
            [1,0,0,0,0,0,0,0,3,0,0,0,1,1,1,10],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [10,1,0,2,2,2,2,2,2,2,0,0,0,0,1,1],
            [10,10,1,10,10,10,10,10,10,10,1,1,1,0,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1],
            [1,0,0,0,0,0,0,0,3,0,0,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,0,5,0,2,2,2,2,2,2,2,0,0,0,1,1],
            [10,1,1,1,10,10,10,10,10,10,10,1,1,1,1,10],
            [10,10,1,10,10,10,10,10,10,10,10,1,1,1,10,10],
            [10,1,10,10,10,10,10,10,10,10,1,1,1,10,10,10]
        ],
        3: [
            [10,10,1,1,1,1,1,1,1,1,1,1,10,1,10,10],
            [10,1,1,0,0,0,0,0,0,0,0,0,0,1,10,10],
            [10,1,0,0,0,3,0,0,0,0,0,0,4,0,1,10],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,2,2,0,0,0,0,0,2,2,2,2,2,2,2,10],
            [10,10,10,9,0,0,0,8,10,10,10,10,10,10,10,10],
            [1,7,7,0,0,0,0,0,7,7,7,7,7,7,7,1],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [10,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [10,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,2,2,2,2,2,0,0,3,0,0,2,2,2,2,1],
            [10,10,10,10,10,10,9,0,0,0,8,10,10,10,10,10],
            [10,7,7,7,7,7,0,0,0,0,0,7,7,7,1,10],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,10,10],
            [10,1,5,0,0,0,0,0,0,0,0,0,0,1,10,10],
            [10,10,1,1,1,1,1,1,1,1,1,1,10,10,10,10]
        ],
        4: [
            [10,10,10,10,10,10,1,1,1,1,1,1,1,1,1,1],
            [10,10,10,10,1,0,0,0,0,0,0,0,0,0,0,1],
            [10,10,10,1,0,0,0,0,0,0,0,0,0,0,4,1],
            [10,10,10,9,0,0,0,0,0,0,0,0,0,1,1,1],
            [10,10,9,0,0,0,0,0,0,0,0,0,0,0,1,10],
            [10,1,0,0,0,0,0,0,1,0,0,0,0,0,1,10],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [1,1,0,0,0,0,0,0,2,0,0,0,0,0,0,1],
            [1,0,0,0,0,2,0,0,10,0,0,0,0,0,8,10],
            [1,0,0,0,0,10,0,0,7,0,0,0,0,0,8,10],
            [10,9,0,0,0,7,0,0,0,0,0,0,2,0,8,10],
            [10,9,0,0,0,0,0,1,0,0,0,8,10,2,8,10],
            [10,9,0,0,0,0,0,0,0,0,0,8,10,10,9,1],
            [1,0,5,0,0,0,0,0,0,0,0,8,10,10,9,1],
            [1,1,1,1,2,2,2,2,2,2,2,2,10,10,2,1],
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10]
        ],
        5: [
            [1,1,10,1,1,1,10,10,10,1,1,1,1,1,1,1],
            [1,1,10,10,9,0,7,7,7,0,0,0,0,0,0,1],
            [1,10,10,7,0,0,0,0,0,0,0,0,0,2,4,1],
            [1,10,7,0,0,0,0,0,0,0,0,0,1,10,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,8,10,1,1],
            [1,0,0,0,0,0,0,0,0,2,2,0,8,10,9,1],
            [10,9,0,0,0,0,0,0,1,10,10,9,8,10,9,1],
            [10,9,0,3,0,0,0,0,8,10,10,9,8,10,9,1],
            [10,9,0,0,0,0,0,0,8,10,10,9,8,10,9,1],
            [10,9,0,0,0,0,2,0,8,10,10,9,8,10,9,1],
            [1,0,0,0,0,2,10,9,8,10,10,9,8,10,9,1],
            [1,0,0,0,8,10,10,9,8,10,10,9,8,10,9,1],
            [1,0,0,0,8,10,10,9,8,10,10,9,8,10,9,1],
            [1,0,5,0,8,10,10,9,8,10,10,10,10,10,9,1],
            [1,1,1,1,2,10,10,2,2,10,10,10,10,10,2,1],
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10]
        ],
        6: [
            [1,1,1,1,1,1,1,1,1,1,10,10,10,10,10,10],
            [1,0,0,0,0,0,0,0,0,0,7,7,7,7,10,10],
            [1,0,5,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,2,2,2,2,2,2,2,2,2,0,0,0,0,0,1],
            [10,10,10,10,10,10,10,10,10,10,9,0,0,0,8,10],
            [1,7,7,7,7,7,7,7,7,7,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,3,0,0,0,0,3,0,8,10],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [1,0,0,0,0,2,2,2,2,2,2,2,2,2,2,1],
            [1,0,0,0,8,10,10,10,10,10,10,10,10,10,10,10],
            [1,0,0,0,0,7,7,7,7,7,7,7,7,7,7,1],
            [1,0,3,0,0,0,0,3,0,0,0,0,0,0,0,1],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,4,8,10],
            [10,10,9,0,0,0,0,0,0,0,0,0,2,2,10,10],
            [10,10,10,2,2,2,2,2,2,2,2,2,10,10,10,10]
        ],
        7: [
            [1,1,1,1,1,1,1,1,1,1,10,10,10,10,1,10],
            [1,0,0,0,0,0,0,0,0,0,7,7,7,1,1,10],
            [10,9,5,0,0,0,0,0,0,0,0,0,0,0,1,10],
            [10,1,1,1,2,2,2,2,2,2,2,0,0,0,8,10],
            [10,10,10,10,10,10,10,10,10,10,10,9,0,0,8,10],
            [1,1,7,7,7,7,7,7,7,7,7,0,0,0,8,10],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [1,2,2,2,2,2,2,2,2,2,2,0,0,0,2,10],
            [10,10,10,10,10,10,10,10,10,10,10,9,0,8,10,10],
            [1,7,7,7,7,7,7,7,7,7,7,0,0,0,7,10],
            [1,1,0,0,0,0,0,0,3,0,0,0,0,0,0,10],
            [1,1,4,0,0,0,0,0,0,0,0,0,0,0,1,10],
            [10,1,1,0,2,2,2,2,2,2,2,2,0,1,1,10],
            [10,10,1,1,10,10,10,10,10,10,10,10,1,1,10,10],
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10]
        ],
        8: [
            [10,10,1,1,1,1,10,10,10,1,1,1,1,10,10,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,7,8,10],
            [1,0,5,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [10,1,1,1,2,2,2,2,2,0,0,0,0,2,2,10],
            [10,10,10,10,10,10,10,10,10,9,0,0,8,10,10,10],
            [10,10,7,7,7,7,7,7,7,0,0,0,0,7,7,10],
            [10,1,0,0,0,0,0,0,0,0,3,0,0,0,8,10],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [10,2,2,0,0,0,0,2,2,2,2,2,2,2,2,10],
            [10,10,10,9,0,0,8,10,10,10,10,10,10,10,10,10],
            [10,7,7,0,0,0,0,7,7,7,7,7,7,7,7,10],
            [1,2,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [10,10,9,0,0,3,0,0,0,0,0,0,0,0,8,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,4,8,10],
            [1,2,2,2,2,2,2,2,2,2,0,0,0,0,8,10],
            [10,10,10,10,10,10,10,10,10,10,1,1,1,1,1,10]
        ],
        9: [
            [10,10,1,1,1,10,10,10,10,1,1,10,10,10,1,1],
            [10,9,0,0,0,0,0,0,0,0,0,7,7,10,10,1],
            [10,0,5,0,0,0,0,0,3,0,0,0,0,7,10,1],
            [1,1,1,1,2,2,2,0,0,0,0,2,2,2,2,10],
            [1,1,10,10,10,10,10,9,0,0,8,10,10,10,10,10],
            [1,10,7,7,7,7,7,0,0,0,0,7,7,7,7,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,0,0,10],
            [10,2,0,0,0,0,2,2,2,2,2,2,2,2,2,10],
            [10,10,9,0,0,8,10,10,10,10,10,10,10,10,10,10],
            [10,7,0,0,0,0,7,7,7,7,7,7,7,7,7,10],
            [10,0,0,3,0,0,0,3,0,0,0,0,0,0,8,10],
            [10,0,0,0,0,0,0,0,0,0,0,0,0,0,8,10],
            [10,2,2,2,2,2,2,2,2,2,2,2,0,0,8,10],
            [10,10,10,10,10,10,10,10,10,10,10,10,9,0,8,10],
            [1,10,1,10,10,1,10,1,1,10,10,10,9,0,8,10],
            [1,1,1,1,10,1,1,1,1,1,1,10,9,4,8,10]
        ],
        10: [
            [10,10,9,0,5,0,0,1,1,1,1,10,1,1,1,1],
            [1,10,9,0,0,0,8,10,10,1,1,10,10,1,1,1],
            [1,10,9,0,0,0,8,10,10,1,1,1,10,10,1,1],
            [1,1,0,0,0,8,10,1,10,10,1,1,1,10,10,1],
            [1,1,0,0,0,8,10,10,1,1,10,1,1,10,10,1],
            [10,1,0,0,0,8,10,1,1,1,1,10,1,1,10,10],
            [10,10,9,0,0,0,8,10,10,1,10,10,10,1,10,10],
            [10,10,9,0,0,0,8,10,10,10,10,1,10,10,10,10],
            [10,10,9,0,0,0,0,7,8,10,10,1,1,10,1,1],
            [10,10,9,0,0,0,0,0,0,8,10,10,10,10,10,1],
            [10,1,9,0,0,0,0,0,0,0,7,8,10,10,10,1],
            [1,1,9,0,0,0,0,0,0,0,0,0,8,10,1,1],
            [1,1,9,0,0,0,0,0,0,0,0,0,8,10,10,1],
            [10,1,9,0,0,0,0,0,0,1,0,1,0,7,0,1],
            [10,10,9,0,0,2,2,2,1,1,0,1,1,0,8,10],
            [1,10,1,1,1,10,10,10,10,1,4,1,1,1,1,10]
        ],
        11: [
            [10,10,10,10,10,10,10,5,10,10,10,10,10,10,1,1],
            [10,10,10,1,10,10,10,0,10,10,10,1,10,10,10,1],
            [1,10,10,1,1,10,10,0,10,1,1,1,1,10,10,1],
            [1,10,10,10,1,1,10,0,1,1,1,10,9,8,10,1],
            [1,8,10,10,1,1,1,0,1,1,1,10,9,8,10,1],
            [1,8,10,7,0,1,0,0,1,1,1,10,9,8,10,1],
            [1,8,10,9,0,1,0,0,0,1,10,10,9,8,10,1],
            [1,8,10,9,0,0,0,0,0,8,10,10,9,8,10,1],
            [1,8,10,9,0,0,0,0,0,0,7,10,9,8,10,1],
            [1,8,10,9,0,0,0,0,0,0,0,7,0,8,10,1],
            [1,8,10,9,0,0,0,0,0,0,0,0,0,8,10,1],
            [1,8,10,9,0,0,0,0,0,0,0,0,0,8,10,1],
            [1,8,10,9,0,0,0,0,0,0,0,0,0,8,10,1],
            [1,8,10,9,0,0,0,0,0,0,0,0,0,8,10,10],
            [1,10,10,9,0,0,0,0,0,4,0,0,0,2,10,10],
            [10,10,10,10,10,10,1,1,1,1,1,10,10,10,10,1]
        ],
        12: [
            [1,1,10,10,1,10,10,10,10,1,1,1,10,10,1,1],
            [10,1,8,10,9,7,7,7,7,0,1,1,7,7,10,1],
            [10,4,8,10,9,0,0,0,0,2,2,2,2,2,8,10],
            [1,0,8,10,9,0,0,0,8,10,10,10,10,10,10,10],
            [1,0,0,7,0,0,0,0,0,7,7,7,7,7,7,10],
            [1,3,0,0,0,3,0,0,0,3,0,0,0,8,10,10],
            [1,2,2,2,2,2,2,0,0,0,0,0,0,0,1,1],
            [10,10,10,10,10,10,10,9,0,0,0,0,0,0,1,1],
            [1,7,7,7,7,7,7,0,0,0,0,0,0,0,0,1],
            [10,9,0,0,0,0,0,0,0,3,0,0,2,2,1,1],
            [10,9,0,0,0,0,0,0,0,0,0,8,10,10,10,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,7,7,7,1],
            [10,9,0,0,0,0,0,0,0,0,2,0,0,0,0,1],
            [10,1,0,0,0,0,0,0,0,8,10,9,0,0,2,10],
            [1,1,5,0,2,2,0,0,0,8,10,9,0,2,10,10],
            [10,10,1,1,10,10,1,1,1,1,10,1,1,10,10,1]
        ],
        13: [
            [10,10,1,1,1,10,10,10,1,10,10,10,10,1,10,10],
            [10,9,0,0,0,7,7,7,8,10,10,9,7,0,8,10],
            [1,0,5,0,0,0,0,0,8,10,10,9,0,2,10,10],
            [1,1,1,1,0,0,0,0,8,10,9,0,8,10,10,10],
            [10,10,1,0,0,0,0,0,8,10,9,8,10,10,10,1],
            [10,10,1,0,0,0,0,0,8,10,9,8,10,10,10,10],
            [10,10,9,0,2,0,0,0,0,7,0,0,8,10,10,1],
            [10,1,0,8,10,9,0,0,0,0,0,0,0,7,7,1],
            [10,9,0,8,10,9,0,2,2,2,2,2,2,2,2,10],
            [10,9,0,8,10,9,8,10,10,10,10,10,10,10,10,10],
            [10,9,0,8,10,9,0,7,7,7,7,7,7,7,7,10],
            [10,9,0,8,10,9,3,3,0,0,0,2,0,0,0,1],
            [10,9,0,8,10,9,0,0,0,0,8,10,9,0,0,1],
            [1,0,0,8,10,9,0,0,0,0,8,10,9,0,0,1],
            [1,2,2,8,10,9,0,2,2,2,8,10,9,2,4,1],
            [1,10,10,10,10,1,1,10,10,10,10,10,10,10,1,1]
        ],
        14: [
            [10,10,10,10,1,1,1,1,1,1,1,1,1,10,10,10],
            [10,10,10,1,1,1,1,10,10,10,1,1,0,7,8,10],
            [10,7,7,1,1,10,10,10,10,10,10,10,1,1,8,10],
            [10,9,1,10,10,10,10,1,1,10,1,10,10,1,0,1],
            [10,1,10,10,10,10,10,10,1,10,1,1,10,10,1,1],
            [10,10,10,10,9,2,2,2,10,10,1,0,7,10,10,10],
            [1,10,10,9,8,10,10,10,10,10,10,1,0,8,10,10],
            [10,9,7,0,8,10,10,9,2,10,10,10,1,1,1,10],
            [10,9,0,0,0,7,7,8,10,10,10,10,10,10,10,10],
            [1,2,2,2,0,0,0,0,2,10,10,1,1,1,10,10],
            [1,10,10,10,9,0,0,8,10,10,1,10,10,10,10,1],
            [1,10,10,10,10,9,0,8,10,10,10,7,10,7,10,10],
            [10,10,10,10,9,0,0,0,8,10,9,0,0,0,0,10],
            [1,0,0,0,0,0,0,0,0,7,0,0,0,0,0,10],
            [10,2,5,0,0,0,0,0,0,0,2,2,0,4,2,1],
            [10,10,1,1,1,1,1,1,1,1,10,10,1,1,10,10]
        ],
        15: [
            [10,10,10,10,1,1,10,10,10,1,1,1,1,1,10,10],
            [10,10,1,1,1,0,7,1,1,1,0,0,0,1,1,10],
            [10,1,0,0,0,0,0,0,8,10,9,0,0,0,1,10],
            [1,1,0,2,2,0,0,0,8,10,9,4,0,3,0,1],
            [1,0,2,10,10,2,0,8,10,10,10,2,2,0,0,1],
            [1,2,10,10,10,10,2,8,10,10,10,10,10,9,8,10],
            [10,10,10,10,10,10,10,10,10,10,10,7,7,0,0,1],
            [10,10,10,10,1,7,7,10,10,10,10,9,3,0,3,1],
            [10,10,10,7,0,0,0,8,10,10,10,9,0,2,1,1],
            [10,10,9,0,0,0,0,0,7,8,10,9,8,10,10,10],
            [1,7,0,0,0,0,0,0,0,0,7,0,8,10,10,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,7,7,1],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,5,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [10,1,1,0,0,0,2,2,2,2,0,0,1,1,1,10],
            [10,10,1,1,1,1,10,10,10,10,1,1,1,10,10,10]
        ],
        16: [
            [10,10,10,10,10,1,10,10,1,1,1,10,10,10,1,1],
            [10,10,10,9,7,8,10,7,0,0,0,7,7,7,0,1],
            [10,7,7,0,0,8,10,9,0,0,0,2,0,0,0,1],
            [1,0,0,0,0,8,10,9,0,0,0,10,9,2,4,1],
            [1,2,2,0,0,8,10,9,8,10,1,10,10,10,10,1],
            [10,10,10,9,0,8,10,9,0,7,0,7,7,7,10,1],
            [10,10,10,10,9,8,10,9,3,0,0,0,0,8,10,1],
            [10,10,10,10,10,10,1,0,0,0,0,0,3,8,10,1],
            [1,10,10,10,10,10,1,0,0,0,2,2,0,8,10,1],
            [1,7,10,10,10,10,10,0,0,8,10,10,9,8,10,1],
            [10,9,7,8,10,10,10,1,1,10,10,10,9,8,10,1],
            [10,9,0,8,10,10,10,10,10,10,10,9,0,0,0,1],
            [1,0,0,0,7,7,10,10,10,10,10,9,0,0,1,10],
            [1,1,0,0,0,0,7,7,7,7,7,0,0,0,1,10],
            [10,1,5,0,0,0,2,2,2,0,0,0,0,1,10,10],
            [10,10,1,1,1,1,10,10,10,1,1,1,1,10,10,10]
        ],
        17: [
            [10,10,1,1,1,1,1,1,10,10,10,10,10,10,10,10],
            [1,1,0,0,0,0,3,8,10,9,7,10,10,10,10,10],
            [1,0,0,0,2,0,0,8,10,9,0,7,7,10,10,10],
            [10,9,0,8,10,9,0,0,7,0,0,0,0,8,10,10],
            [10,9,4,8,10,1,3,0,0,0,0,0,0,8,10,10],
            [10,10,2,2,10,9,0,0,2,0,0,0,0,8,10,10],
            [10,10,10,10,10,9,2,2,10,9,0,0,0,1,1,1],
            [10,10,10,10,10,10,10,10,10,10,9,0,0,8,10,10],
            [10,10,10,10,10,10,10,10,10,10,9,0,0,8,10,10],
            [10,10,10,10,9,7,7,7,7,7,0,3,0,0,8,10],
            [10,10,7,7,0,0,0,0,0,0,0,0,0,0,8,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,0,2,10],
            [10,9,0,0,0,0,0,0,0,0,0,0,0,0,10,10],
            [1,1,0,0,0,0,0,0,0,0,2,2,2,2,10,10],
            [10,1,1,5,0,0,0,2,2,2,10,10,10,10,10,10],
            [10,10,1,1,1,1,1,10,10,10,10,10,10,10,10,10]
        ],
        18: [
            [1,1,1,10,1,1,1,10,10,10,10,10,10,1,1,1],
            [1,10,10,1,1,10,10,10,7,7,7,7,7,0,1,1],
            [1,1,1,10,10,10,10,10,0,3,0,2,0,0,1,10],
            [10,1,1,10,10,10,1,10,0,0,8,10,9,0,8,10],
            [1,1,10,10,10,1,10,10,0,0,8,10,9,0,8,10],
            [1,10,10,10,1,1,10,10,0,0,8,10,9,0,8,10],
            [10,10,10,10,10,10,0,0,0,0,8,10,9,0,8,10],
            [10,1,10,10,0,0,0,0,0,3,8,10,9,0,8,10],
            [1,10,0,0,0,0,0,0,0,0,8,10,9,0,8,10],
            [1,10,0,0,0,0,0,0,0,0,8,10,9,0,8,10],
            [10,0,0,0,0,0,0,0,0,0,8,10,9,0,8,10],
            [10,0,0,0,0,0,0,0,0,0,8,10,9,0,8,10],
            [1,1,0,0,0,0,0,0,0,0,8,10,9,0,8,10],
            [1,1,5,0,0,0,0,0,0,0,8,10,9,4,8,10],
            [10,1,1,1,1,10,10,10,1,1,1,10,10,0,10,10],
            [10,10,10,10,10,10,10,10,10,10,10,10,10,0,10,10]
        ],
        19: [
            [10,1,1,1,10,1,10,9,5,8,10,10,10,0,10,10],
            [1,1,1,10,10,1,10,9,0,8,10,10,9,4,8,10],
            [1,1,10,10,10,10,10,9,0,8,10,10,9,0,8,10],
            [1,10,10,10,1,10,10,9,0,8,10,10,9,0,8,10],
            [10,10,10,10,1,10,10,9,0,8,10,10,9,0,8,10],
            [10,1,10,10,1,1,10,9,0,8,10,10,9,3,8,10],
            [1,1,10,10,1,1,10,9,0,8,10,10,9,0,8,10],
            [10,10,1,1,10,10,10,9,0,8,10,10,9,0,8,10],
            [10,10,1,10,1,10,10,9,0,8,10,10,9,0,8,10],
            [10,10,1,10,10,10,10,9,0,0,7,7,0,3,1,1],
            [1,10,1,1,1,10,10,9,0,0,2,2,0,0,1,1],
            [1,1,1,1,1,1,10,9,0,8,10,10,9,0,8,10],
            [1,1,1,10,10,10,10,9,0,8,10,10,9,0,8,10],
            [10,1,1,10,1,10,10,9,3,8,10,10,9,0,8,10],
            [1,1,1,1,10,10,10,9,2,8,10,10,10,2,10,10],
            [1,1,1,1,1,1,1,10,10,10,10,1,1,10,10,10]
        ],
        20: [
            [10,10,1,10,10,10,10,9,5,8,10,10,10,10,1,1],
            [10,1,1,1,10,10,10,9,0,8,10,10,10,1,1,1],
            [1,1,1,10,10,1,1,9,0,8,10,10,10,10,1,1],
            [1,1,10,10,10,1,10,9,0,8,10,10,10,10,10,1],
            [10,10,10,10,1,10,10,9,0,8,10,10,1,10,10,1],
            [1,10,10,10,1,10,10,9,0,8,10,10,1,1,10,10],
            [10,10,1,10,10,10,10,9,0,8,10,10,10,10,1,10],
            [10,10,10,10,10,10,10,9,0,8,10,10,10,10,10,1],
            [10,1,10,10,10,10,7,0,0,0,0,8,10,10,10,1],
            [1,1,10,10,10,7,0,0,0,0,0,0,8,10,10,10],
            [1,10,10,10,9,0,0,0,0,0,0,0,8,10,10,10],
            [10,10,10,7,0,0,0,0,0,0,0,0,0,7,7,10],
            [10,10,7,0,0,0,0,0,0,0,0,0,0,0,1,10],
            [10,10,1,6,0,0,0,0,0,0,0,0,0,1,1,10],
            [10,1,1,1,1,2,2,2,1,1,1,1,1,1,10,10],
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10,1,1]
        ],
    };
    const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);

    // ==========================================
    // 3. TUNING
    // ==========================================
    const STEP = 1000 / 60;
    const GRAVITY = 0.18;
    const RUN = 1.5;
    const JUMP = -3.2;
    const DASH_SPEED = 4.4;
    const DASH_TIME = 8;
    const COYOTE = 7;
    const JUMP_BUFFER = 7;
    const DASH_BUFFER = 6;
    const ORB_BASE_SPIN = 0.4;

    // ==========================================
    // 4. SMALL HELPERS: hash, background stars, pixel font
    // ==========================================
    const hash = (n) => {
        n = (n ^ 61) ^ (n >>> 16);
        n = n + (n << 3);
        n = n ^ (n >>> 4);
        n = Math.imul(n, 0x27d4eb2d);
        n = n ^ (n >>> 15);
        return n >>> 0;
    };
    const rand = (a, b) => a + Math.random() * (b - a);

    const STARS = Array.from({ length: 28 }, (_, i) => {
        const h = hash(i * 977 + 13);
        return { x: h & 127, y: (h >> 7) & 127, v: 0.03 + ((h >> 14) & 7) * 0.01, p: (h >> 17) & 15, big: (h >> 21) % 7 === 0 };
    });

    // Slow drifting starfield, drawn behind the tiles (deterministic: no flicker, no state)
    function drawBackground(ctx2, t) {
        for (const s of STARS) {
            const y = Math.floor((((s.y - t * s.v) % 128) + 128) % 128);
            const twinkle = ((t >> 4) + s.p) % 6 === 0;
            ctx2.fillStyle = PAL[1];
            if (s.big) {
                ctx2.fillRect(s.x - 1, y, 3, 1);
                ctx2.fillRect(s.x, y - 1, 1, 3);
            }
            ctx2.fillStyle = twinkle ? PAL[13] : PAL[1];
            ctx2.fillRect(s.x, y, 1, 1);
        }
    }

    // 3x5 pixel font, rows separated by "|"
    const FONT_SRC = {
        A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
        E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
        I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
        M: '#.#|###|###|#.#|#.#', N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..',
        Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.',
        U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#',
        Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
        0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
        4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.',
        8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.',
        ':': '.|#|.|#|.', '!': '#|#|#|.|#', '.': '.|.|.|.|#', '-': '...|...|###|...|...', ' ': '..|..|..|..|..',
    };
    const FONT = {};
    for (const k in FONT_SRC) FONT[k] = FONT_SRC[k].split('|');
    const glyph = (ch) => FONT[ch] || FONT[' '];
    function textW(s) {
        let w = 0;
        for (const ch of s.toUpperCase()) w += glyph(ch)[0].length + 1;
        return Math.max(0, w - 1);
    }
    function text(s, x, y, col, shadow) {
        s = s.toUpperCase();
        const pass = (ox, oy, c) => {
            ctx.fillStyle = c;
            let cx = x + ox;
            for (const ch of s) {
                const g = glyph(ch);
                for (let r = 0; r < 5; r++) for (let q = 0; q < g[r].length; q++) if (g[r][q] === '#') ctx.fillRect(cx + q, y + oy + r, 1, 1);
                cx += g[0].length + 1;
            }
        };
        if (shadow) pass(0, 1, shadow);
        pass(0, 0, col);
    }
    const textC = (s, y, col, shadow) => text(s, (128 - textW(s)) >> 1, y, col, shadow);
    const fmtTime = (frames) => {
        const t = Math.floor((frames / 60) * 10) / 10;
        return Math.floor(t / 60) + ':' + (t % 60).toFixed(1).padStart(4, '0');
    };

    // ==========================================
    // 5. SPRITES
    // ==========================================
    const UP = [
        '........', '........', '........', '.#....#.',
        '###..###', '###..###', '########', '########'
    ];
    const UP_TIP = [
        '........', '........', '........', '.#....#.',
        '........', '........', '........', '........'
    ];
    const at = (g, x, y) => g[y][x] === '#';
    const ORIENT = {
        2: (g, x, y) => at(g, x, y),
        7: (g, x, y) => at(g, x, 7 - y),
        8: (g, x, y) => at(g, y, x),
        9: (g, x, y) => at(g, y, 7 - x),
    };
    const HIT = {
        2: [1, 5, 6, 3], 7: [1, 0, 6, 3], 8: [5, 1, 3, 6], 9: [0, 1, 3, 6], 10: [0, 0, 8, 8],
    };

    // Spikes get lit tips so they read better against the dark walls
    const spikeSprites = {};
    for (const id in ORIENT) {
        const c = document.createElement('canvas');
        c.width = c.height = TILE;
        const g = c.getContext('2d');
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
            if (!ORIENT[id](UP, x, y)) continue;
            g.fillStyle = ORIENT[id](UP_TIP, x, y) ? PAL[14] : PAL[8];
            g.fillRect(x, y, 1, 1);
        }
        spikeSprites[id] = c;
    }

    const ORB_SIZE = 14, ORB_FRAMES = 64, ORB_R = 5.2;
    const ORB_RAMPS = {
        grey: [PAL[7], PAL[6], PAL[13], PAL[5]],
        gold: [PAL[10], PAL[9], PAL[4], PAL[2]],
    };
    const LIGHT = (() => { const v = [-0.5, -0.6, 0.65], l = Math.hypot(...v); return v.map((n) => n / l); })();
    const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

    function rotate3(v, ax, ay, az) {
        const [x, y, z] = v;
        const y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax);
        const x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
        return [x2 * Math.cos(az) - y1 * Math.sin(az), x2 * Math.sin(az) + y1 * Math.cos(az), z2];
    }

    function bakeOrb(ramp, k) {
        const a = (Math.PI * 2 * k) / ORB_FRAMES;
        const ax = a + 0.6, ay = a * 2, az = a;
        const R = ORB_R, C = ORB_SIZE / 2;
        const nodes = [[R,0,0],[-R,0,0],[0,R,0],[0,-R,0],[0,0,R],[0,0,-R]]
            .map((n) => { const r = rotate3(n, ax, ay, az); return { x: r[0] + C, y: r[1] + C, z: r[2] }; });

        const img = new ImageData(ORB_SIZE, ORB_SIZE);
        const zbuf = new Float32Array(ORB_SIZE * ORB_SIZE).fill(-Infinity);
        const colors = ramp.map(hexRGB);

        for (let sx = 0; sx < 2; sx++) for (let sy = 0; sy < 2; sy++) for (let sz = 0; sz < 2; sz++) {
            const A = nodes[sx], B = nodes[2 + sy], D = nodes[4 + sz];
            const n = rotate3([sx ? -1 : 1, sy ? -1 : 1, sz ? -1 : 1].map((v) => v / Math.sqrt(3)), ax, ay, az);
            if (n[2] <= 0) continue;

            const light = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
            const col = colors[light > 0.7 ? 0 : light > 0.35 ? 1 : light > 0.0 ? 2 : 3];

            const area = (B.x - A.x) * (D.y - A.y) - (B.y - A.y) * (D.x - A.x);
            if (Math.abs(area) < 1e-6) continue;
            for (let py = 0; py < ORB_SIZE; py++) for (let px = 0; px < ORB_SIZE; px++) {
                const x = px + 0.5, y = py + 0.5;
                const w0 = ((B.x - x) * (D.y - y) - (B.y - y) * (D.x - x)) / area;
                const w1 = ((D.x - x) * (A.y - y) - (D.y - y) * (A.x - x)) / area;
                const w2 = 1 - w0 - w1;
                if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
                const z = w0 * A.z + w1 * B.z + w2 * D.z;
                const i = py * ORB_SIZE + px;
                if (z <= zbuf[i]) continue;
                zbuf[i] = z;
                img.data.set([col[0], col[1], col[2], 255], i * 4);
            }
        }
        const c = document.createElement('canvas');
        c.width = c.height = ORB_SIZE;
        c.getContext('2d').putImageData(img, 0, 0);
        return c;
    }

    const orbFrames = { grey: [], gold: [] };
    for (let k = 0; k < ORB_FRAMES; k++) {
        orbFrames.grey.push(bakeOrb(ORB_RAMPS.grey, k));
        orbFrames.gold.push(bakeOrb(ORB_RAMPS.gold, k));
    }

    // ==========================================
    // 6. TILE DRAWING (shared by the game, the editor and the palette thumbnails)
    // ==========================================
    const wallAt = (m, r, c) => r < 0 || r > 15 || c < 0 || c > 15 || m[r][c] === 1;

    // Walls get a lit edge wherever they face open space, plus a couple of dark specks
    function drawWall(g, x, y, m, r, c) {
        g.fillStyle = PAL[1];
        g.fillRect(x, y, TILE, TILE);
        if (!m) { g.fillStyle = PAL[13]; g.fillRect(x, y, TILE, 1); return; }
        const h = hash(r * 16 + c + 1);
        g.fillStyle = PAL[0];
        g.fillRect(x + 1 + (h % 6), y + 1 + ((h >> 4) % 6), 1, 1);
        if (h & 0x100) g.fillRect(x + 1 + ((h >> 9) % 6), y + 1 + ((h >> 13) % 6), 1, 1);
        g.fillStyle = PAL[13];
        if (!wallAt(m, r - 1, c)) g.fillRect(x, y, TILE, 1);
        if (!wallAt(m, r, c - 1)) g.fillRect(x, y, 1, TILE);
        if (!wallAt(m, r, c + 1)) g.fillRect(x + 7, y, 1, TILE);
        g.fillStyle = PAL[5];
        if (!wallAt(m, r + 1, c)) g.fillRect(x, y + 7, TILE, 1);
    }

    function drawHazard(g, x, y) {
        g.fillStyle = PAL[8];
        g.fillRect(x, y, TILE, TILE);
        g.fillStyle = PAL[2];
        g.fillRect(x + 3, y + 3, 2, 2);
        g.fillRect(x, y, 1, 1); g.fillRect(x + 7, y, 1, 1);
        g.fillRect(x, y + 7, 1, 1); g.fillRect(x + 7, y + 7, 1, 1);
    }

    function drawPlayerBox(g, px, py, w, h, col, facing) {
        g.fillStyle = col;       // plain box: the player has no face
        g.fillRect(px, py, w, h);
    }

    // m / r / c are optional: with them walls autotile against their neighbours
    function drawTile(g, t, x, y, frame, m, r, c) {
        if (t === 1) drawWall(g, x, y, m, r, c);
        else if (spikeSprites[t]) g.drawImage(spikeSprites[t], x, y);
        else if (t === 10) drawHazard(g, x, y);
        else if (t === 3) {
            g.fillStyle = PAL[11];
            g.fillRect(x + 3, y + 2, 2, 4);
            g.fillRect(x + 2, y + 3, 4, 2);
        }
        else if (t === 5) drawPlayerBox(g, x + 1, y + 2, 6, 6, PAL[12], 1);
        else if (t === 4 || t === 6 || t === 12) {
            const f = (t === 4 ? orbFrames.grey : orbFrames.gold)[frame % ORB_FRAMES];
            g.drawImage(f, x + 4 - ORB_SIZE / 2, y + 4 - ORB_SIZE / 2);
            if (t === 12) {                       // editor-only marker so a fake goal can be told from the real one
                g.fillStyle = PAL[8];
                g.fillRect(x, y, 3, 1); g.fillRect(x, y, 1, 3);
            }
        }
        else if (t === 11) {                      // hidden goal: ghost orb + dotted box (editor only, invisible in game)
            const prev = g.globalAlpha;
            g.globalAlpha = prev * 0.45;
            g.drawImage(orbFrames.grey[frame % ORB_FRAMES], x + 4 - ORB_SIZE / 2, y + 4 - ORB_SIZE / 2);
            g.globalAlpha = prev;
            g.fillStyle = PAL[13];
            for (let i = 0; i < 8; i += 2) {
                g.fillRect(x + i, y, 1, 1); g.fillRect(x + i, y + 7, 1, 1);
                g.fillRect(x, y + i, 1, 1); g.fillRect(x + 7, y + i, 1, 1);
            }
        }
    }

    // ==========================================
    // 7. LEVEL STATE
    // ==========================================
    let levelIdx = 0, map, spawn, orb, orbGone, isFinal, staticLayer, refills = [], fakes = [];
    let orbSpin = ORB_BASE_SPIN, orbPhase = 0;   // accumulated phase: speed changes never make the orb jump frames
    let winT = 0, runFrames = 0;

    function findTile(id) {
        for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) if (map[r][c] === id) return { r, c };
        return null;
    }

    function buildStaticLayer() {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        for (let r = 0; r < 16; r++) {
            for (let col = 0; col < 16; col++) {
                const t = map[r][col];
                if (t === 1 || t === 10 || spikeSprites[t]) drawTile(g, t, col * TILE, r * TILE, 0, map, r, col);
            }
        }
        return c;
    }

    function loadLevel(i) {
        levelIdx = i;
        map = levels[levelKeys[i]];
        isFinal = i === levelKeys.length - 1;
        const s = findTile(5);
        spawn = s ? { x: s.c * TILE + 1, y: s.r * TILE + 2 } : { x: 16, y: 80 };
        const o = findTile(isFinal ? 6 : 4) || findTile(4) || findTile(6) || findTile(11);
        orb = o ? { x: o.c * TILE + 4, y: o.r * TILE + 4, hidden: map[o.r][o.c] === 11, gold: map[o.r][o.c] === 6 || isFinal } : null;
        fakes = [];
        for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++)
            if (map[r][c] === 12) fakes.push({ x: c * TILE + 4, y: r * TILE + 4, used: false });
        orbGone = false;
        orbSpin = ORB_BASE_SPIN;
        staticLayer = buildStaticLayer();

        update_details();
        resetRefills();
    }

    function resetRefills() {
        refills = [];
        for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++)
            if (map[r][c] === 3) refills.push({ r, c, active: true, timer: 0 });
    }

    // ==========================================
    // 8. INPUT
    // ==========================================
    const BIND = {
        left: ['arrowleft', 'a'], right: ['arrowright', 'd'],
        up: ['arrowup', 'w'], down: ['arrowdown', 's'],
        jump: [' ', 'z', 'k', 'arrowup', 'w'],
        dash: ['x', 'c', 'shift', 'j', 'l'],
        restart: ['r'],
    };
    const GAME_KEYS = new Set(Object.values(BIND).flat());
    const keys = {};
    const pressed = {};

    const held = (n) => BIND[n].some((k) => keys[k]);
    const hit = (n) => BIND[n].some((k) => pressed[k]);
    const clearPressed = () => { for (const k in pressed) pressed[k] = false; };

    // Editor / playtest flags (declared here so the input handlers can read them)
    let editing = false, testing = false, testDeaths = 0;

    window.addEventListener('keydown', (e) => {
        if (editing) return;                                   // the editor owns the keyboard
        const k = e.key.toLowerCase();
        if (!GAME_KEYS.has(k) || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target && e.target.matches && e.target.matches('input, textarea, select')) return;
        e.preventDefault();
        if (!keys[k]) pressed[k] = true;
        keys[k] = true;
    });
    window.addEventListener('keyup', (e) => { if (editing) return; keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

    // ==========================================
    // 9. PLAYER + EFFECTS STATE
    // ==========================================
    const P = {
        x: 0, y: 0, w: 6, h: 6, vx: 0, vy: 0, grounded: false, visible: true,
        dashes: 1, dashT: 0, dir: { x: 1, y: 0 }, facing: 1, squash: 0, stretch: 0, trail: [],
    };
    let mode = 'in';   // in | play | dead | out | win
    let trans = { t: 0, dur: 18, cx: 64, cy: 64, next: null };
    let tick = 0, freeze = 0, shake = 0, deadT = 0, dcx = 0, dcy = 0;
    let coyote = 0, jumpBuf = 0, dashBuf = 0, deaths = 0;
    const parts = [];

    function burst(x, y, n, colors, speed, life) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
            parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), c: colors[i % colors.length] });
        }
    }

    function dust(x, y, dir) {
        parts.push({ x, y, vx: -dir * rand(0.15, 0.45), vy: rand(-0.35, -0.1), life: rand(8, 14), c: PAL[13] });
    }

    function respawn() {
        P.x = spawn.x; P.y = spawn.y; P.vx = P.vy = 0;
        P.dashes = 1; P.dashT = 0; P.trail = []; P.squash = 0; P.stretch = 0; P.grounded = true;
        P.visible = true;
        coyote = jumpBuf = dashBuf = 0;
        resetRefills();
    }

    function startOut(cx, cy, next) {
        mode = 'out';
        trans = { t: 0, dur: 16, cx, cy, next };
    }

    function die() {
        if (mode !== 'play' && mode !== 'in') return;
        mode = 'dead';
        P.visible = false;
        deaths++;
        deadT = 14; freeze = 12; shake = 8;
        dcx = P.x + 3; dcy = P.y + 3;

        update_details();
        burst(dcx, dcy, 30, [PAL[8], PAL[7], PAL[14]], 2.2, 28);
    }

    function update_details() {
        const _details = document.getElementsByClassName('pico_details');
        if (_details.length > 0) _details[0].classList.add('open');
        const _level = document.getElementById('_level');
        if (_level) {
            _level.textContent = 'Level: ' + (levelIdx + 1);
            _level.title = 'Level: ' + (levelIdx + 1);
        }

        const _deaths = document.getElementById('_deaths');
        if (_deaths) {
            _deaths.textContent = 'Deaths: ' + deaths;
            _deaths.title = 'Deaths: ' + deaths;
        }

        const _time = document.getElementById('_time');   // optional: only filled if the page has one
        if (_time) _time.textContent = 'Time: ' + fmtTime(runFrames);
    }

    function end_game() {
        console.log('-- YOU WIN! --');
        try { window.dispatchEvent(new CustomEvent('plateformer:win', { detail: { deaths, frames: runFrames } })); } catch (e) { /* ignore */ }
    }

    function winGame() {
        mode = 'win';
        winT = 0;
        P.visible = false;
        P.vx = P.vy = 0;
        shake = 6;
        burst(orb.x, orb.y, 40, [PAL[10], PAL[9], PAL[7]], 2.6, 40);
        update_details();
        end_game();
    }

    // A fake goal looks exactly like the real final goal and shows the win screen,
    // then (on a key press or after a few seconds) the level simply carries on.
    function fakeWin(f) {
        mode = 'fake';
        winT = 0;
        P.visible = false;
        P.vx = P.vy = 0;
        shake = 6;
        freeze = 4;
        burst(f.x, f.y, 40, [PAL[10], PAL[9], PAL[7]], 2.6, 40);
    }

    // ==========================================
    // 10. COLLISION
    // ==========================================
    function solid(x, y) {
        const c0 = Math.floor(x / TILE), c1 = Math.floor((x + P.w - 0.001) / TILE);
        const r0 = Math.floor(y / TILE), r1 = Math.floor((y + P.h - 0.001) / TILE);
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                if (r < 0 || r >= 16 || c < 0 || c >= 16) return true;
                if (map[r][c] === 1) return true;
            }
        }
        return false;
    }

    // A dash only stops dead against a wall when it is aimed straight at it.
    // Diagonal dashes keep sliding along the wall / floor / ceiling instead of fizzling out.
    const dashAxisX = () => Math.abs(P.dir.x) > 0.01;
    const dashAxisY = () => Math.abs(P.dir.y) > 0.01;

    function moveX(amt) {
        const s = Math.sign(amt);
        let n = Math.abs(amt);
        while (n > 0) {
            const d = Math.min(1, n) * s;
            if (!solid(P.x + d, P.y)) { P.x += d; n -= Math.min(1, n); continue; }
            let lifted = false;
            for (let k = 1; k <= 3; k++) {
                if (!solid(P.x + d, P.y - k)) { P.y -= k; P.x += d; lifted = true; break; }
            }
            if (lifted) { n -= Math.min(1, n); continue; }
            P.vx = 0;
            if (P.dashT > 0 && !dashAxisY()) P.dashT = 0;
            return;
        }
    }

    function moveY(amt) {
        const s = Math.sign(amt);
        let n = Math.abs(amt);
        while (n > 0) {
            const d = Math.min(1, n) * s;
            if (!solid(P.x, P.y + d)) { P.y += d; n -= Math.min(1, n); continue; }
            if (s < 0) {
                let nudged = false;
                for (let k = 1; k <= 3 && !nudged; k++) {
                    for (const dir of [-1, 1]) {
                        if (!solid(P.x + dir * k, P.y + d)) { P.x += dir * k; P.y += d; nudged = true; break; }
                    }
                }
                if (nudged) { n -= Math.min(1, n); continue; }
            } else if (P.vy > 1.2) {
                P.squash = 4;
                burst(P.x + 3, P.y + 6, 4, [PAL[6], PAL[13]], 0.8, 12);
            }
            P.vy = 0;
            if (P.dashT > 0 && !dashAxisX()) P.dashT = 0;
            return;
        }
    }

    function touchingHazard() {
        const c0 = Math.floor(P.x / TILE), c1 = Math.floor((P.x + P.w - 0.001) / TILE);
        const r0 = Math.floor(P.y / TILE), r1 = Math.floor((P.y + P.h - 0.001) / TILE);
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const hb = map[r] && HIT[map[r][c]];
                if (!hb) continue;
                const bx = c * TILE + hb[0], by = r * TILE + hb[1];
                if (P.x < bx + hb[2] && P.x + P.w > bx && P.y < by + hb[3] && P.y + P.h > by) return true;
            }
        }
        return false;
    }

    // ==========================================
    // 11. UPDATE
    // ==========================================
    function playerStep() {
        const D = held('down'), U = held('up');
        const ax = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
        const jumpHeld = held('jump');

        jumpBuf = hit('jump') ? JUMP_BUFFER : Math.max(0, jumpBuf - 1);
        dashBuf = hit('dash') ? DASH_BUFFER : Math.max(0, dashBuf - 1);
        coyote = P.grounded ? COYOTE : Math.max(0, coyote - 1);
        if (P.grounded && P.dashT === 0) P.dashes = 1;
        if (ax) P.facing = ax;
        if (P.squash > 0) P.squash--;
        if (P.stretch > 0) P.stretch--;

        if (dashBuf > 0 && P.dashes > 0 && P.dashT === 0) {
            let dx = ax, dy = (D ? 1 : 0) - (U ? 1 : 0);
            if (!dx && !dy) dx = P.facing;
            const len = Math.hypot(dx, dy);
            P.dir = { x: dx / len, y: dy / len };
            P.dashT = DASH_TIME;
            P.dashes = 0;
            dashBuf = 0;
            jumpBuf = 0;                       // an "up" dash must never leave a stray jump queued
            freeze = 2;
            shake = Math.max(shake, 2);
            burst(P.x + 3, P.y + 3, 6, [PAL[7], PAL[12]], 1.2, 14);
        }

        let ending = false;
        if (P.dashT > 0) {
            P.vx = P.dir.x * DASH_SPEED;
            P.vy = P.dir.y * DASH_SPEED;
            P.trail.push({ x: Math.round(P.x), y: Math.round(P.y) });
            if (P.trail.length > 5) P.trail.shift();
            parts.push({ x: P.x + 3 + rand(-1, 1), y: P.y + 3 + rand(-1, 1), vx: 0, vy: 0, life: 7, c: tick & 1 ? PAL[12] : PAL[7] });
            ending = --P.dashT === 0;
        } else {
            if (P.trail.length) P.trail.shift();

            const target = ax * RUN;
            const rate = ax ? (P.grounded ? 0.5 : 0.35) : (P.grounded ? 0.4 : 0.1);
            P.vx += Math.max(-rate, Math.min(rate, target - P.vx));

            if (jumpBuf > 0 && coyote > 0) {
                P.vy = JUMP;
                P.grounded = false;
                P.stretch = 5;
                coyote = jumpBuf = 0;
                burst(P.x + 3, P.y + 6, 3, [PAL[6], PAL[13]], 0.7, 10);
            }
            if (!jumpHeld && P.vy < -0.8) P.vy += 0.25;

            let g = GRAVITY;
            if (jumpHeld && Math.abs(P.vy) < 0.6) g *= 0.6;
            P.vy = Math.min(P.vy + g, 2.8);
        }

        moveX(P.vx);
        moveY(P.vy);
        // The dash timer can be cut short by a collision: always bleed speed off when a dash ends
        if (ending || (P.dashT === 0 && P.trail.length && Math.hypot(P.vx, P.vy) > RUN * 1.6)) {
            P.vx *= 0.5; P.vy *= 0.5;
        }
        P.grounded = P.vy >= 0 && solid(P.x, P.y + 1);

        // running dust
        if (P.grounded && ax && Math.abs(P.vx) > 1 && P.dashT === 0 && tick % 7 === 0) dust(P.x + 3, P.y + 6, Math.sign(P.vx));

        if (touchingHazard()) { die(); return; }

        // level orb collision check
        if (orb && !orbGone && Math.hypot(P.x + 3 - orb.x, P.y + 3 - orb.y) < 7) {
            burst(orb.x, orb.y, 16, [PAL[10], PAL[7], PAL[12]], 2, 30);
            orbSpin += 0.8;                    // spins up when grabbed, then eases back down
            freeze = 4;
            shake = Math.max(shake, 3);

            if (testing) {
                // Playtest from the editor: clearing the level goes back to the editor
                P.vx = P.vy = 0;
                startOut(orb.x, orb.y, () => exitTest(true));
                return;
            }

            if (isFinal) {
                orbGone = true;
                winGame();
                return;
            }
            P.vx = P.vy = 0;
            startOut(orb.x, orb.y, () => { loadLevel(levelIdx + 1); respawn(); });
            return;
        }

        // fake goals
        for (const f of fakes) {
            if (f.used || Math.hypot(P.x + 3 - f.x, P.y + 3 - f.y) >= 7) continue;
            f.used = true;
            fakeWin(f);
            return;
        }

        // refills
        for (const ref of refills) {
            if (!ref.active || P.dashes >= 1) continue;
            const rx = ref.c * TILE + 2, ry = ref.r * TILE + 2;
            if (P.x < rx + 4 && P.x + P.w > rx && P.y < ry + 4 && P.y + P.h > ry) {
                P.dashes = 1;
                ref.active = false;
                ref.timer = 120;
                burst(rx + 2, ry + 2, 8, [PAL[11], PAL[7]], 1.4, 18);
            }
        }
    }

    function update() {
        tick++;
        orbPhase += orbSpin;
        orbSpin += (ORB_BASE_SPIN - orbSpin) * 0.02;
        for (const ref of refills) if (!ref.active && --ref.timer <= 0) ref.active = true;
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.04;
            if (--p.life <= 0) parts.splice(i, 1);
        }
        if (orb && !orbGone && !orb.hidden && mode === 'play' && tick % 14 === 0) {
            parts.push({ x: orb.x + rand(-6, 6), y: orb.y + rand(-6, 6), vx: 0, vy: -0.2, life: 18, c: orb.gold ? PAL[10] : PAL[7] });
        }
        if (mode === 'play' && tick % 14 === 0) {
            for (const f of fakes) if (!f.used) parts.push({ x: f.x + rand(-6, 6), y: f.y + rand(-6, 6), vx: 0, vy: -0.2, life: 18, c: PAL[10] });
        }
        if (shake > 0) shake--;
        if (freeze > 0) { freeze--; return; }

        if (mode === 'out') {
            if (++trans.t >= trans.dur) {
                trans.next();
                mode = 'in';
                trans = { t: 0, dur: 18, cx: spawn.x + 3, cy: spawn.y + 3, next: null };
            }
            clearPressed();
            return;
        }
        if (mode === 'dead') {
            if (--deadT <= 0) startOut(dcx, dcy, respawn);
            clearPressed();
            return;
        }
        if (mode === 'win' || mode === 'fake') {
            winT++;
            if (winT < 90 && winT % 3 === 0) {
                parts.push({ x: rand(0, 128), y: -2, vx: rand(-0.3, 0.3), vy: rand(0.3, 0.9), life: 140,
                    c: [PAL[10], PAL[9], PAL[11], PAL[12], PAL[14], PAL[8]][(Math.random() * 6) | 0] });
            }
            const go = winT > 50 && (hit('jump') || hit('dash') || hit('restart'));
            if (mode === 'win') {
                if (go) {
                    deaths = 0;
                    runFrames = 0;
                    startOut(64, 64, () => { loadLevel(0); respawn(); });
                }
            } else if (go || winT > 260) {
                startOut(64, 64, respawn);       // the "win" was a lie: carry on from the spawn
            }
            clearPressed();
            return;
        }
        if (mode === 'in' && ++trans.t >= trans.dur) mode = 'play';
        if (mode === 'play') runFrames++;

        if (hit('restart')) {
            startOut(P.x + 3, P.y + 3, respawn);
        } else {
            playerStep();
        }
        clearPressed();
    }

    // ==========================================
    // 12. DRAW
    // ==========================================
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

    function ring(cx, cy, r, col) {
        ctx.fillStyle = col;
        const n = Math.max(12, Math.round(r * 4));
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
        }
    }

    function drawOrbAt(x, y, gold) {
        // soft pulsing halo
        ctx.globalAlpha = 0.3 + 0.15 * Math.sin(tick / 9);
        ring(x, y, 8 + Math.round(Math.sin(tick / 12)), gold ? PAL[9] : PAL[13]);
        ctx.globalAlpha = 1;
        const frames = gold ? orbFrames.gold : orbFrames.grey;
        const fi = ((Math.floor(orbPhase) % ORB_FRAMES) + ORB_FRAMES) % ORB_FRAMES;
        ctx.drawImage(frames[fi], Math.round(x - ORB_SIZE / 2), Math.round(y - ORB_SIZE / 2));
    }

    function drawOrb() {
        if (orb && !orbGone && !orb.hidden) drawOrbAt(orb.x, orb.y, orb.gold);   // hidden goals are not drawn at all
        for (const f of fakes) if (!f.used) drawOrbAt(f.x, f.y, true);
    }

    function drawRefills() {
        for (const ref of refills) {
            const rx = ref.c * TILE + 2, ry = ref.r * TILE + 2;
            if (ref.active) {
                const b = Math.round(Math.sin((tick + ref.c * 7) / 12));
                if (((tick + ref.c * 5) >> 4) % 4 === 0) {
                    rect(rx - 1, ry - 1 + b, 1, 1, PAL[3]); rect(rx + 4, ry - 1 + b, 1, 1, PAL[3]);
                    rect(rx - 1, ry + 4 + b, 1, 1, PAL[3]); rect(rx + 4, ry + 4 + b, 1, 1, PAL[3]);
                }
                rect(rx + 1, ry + b, 2, 4, PAL[11]);
                rect(rx, ry + 1 + b, 4, 2, PAL[11]);
            } else {
                rect(rx + 1, ry + 1, 2, 2, PAL[5]);
            }
        }
    }

    function drawIris(cx, cy, r) {
        cx = Math.round(cx); cy = Math.round(cy); r = Math.max(0, Math.round(r));
        ctx.fillStyle = PAL[0];
        if (r === 0) { ctx.fillRect(0, 0, 128, 128); return; }
        ctx.fillRect(0, 0, 128, Math.max(0, cy - r));
        ctx.fillRect(0, cy + r, 128, Math.max(0, 128 - (cy + r)));
        ctx.fillRect(0, cy - r, Math.max(0, cx - r), r * 2);
        ctx.fillRect(cx + r, cy - r, Math.max(0, 128 - (cx + r)), r * 2);
    }

    function drawWin() {
        ctx.globalAlpha = Math.min(0.7, winT / 40);
        rect(0, 0, 128, 128, PAL[0]);
        ctx.globalAlpha = 1;
        if (winT < 12) return;
        const bob = Math.round(Math.sin(winT / 8) * 1.5);
        textC('COMPLETE!', 36 + bob, PAL[10]);
        if (winT > 50 && ((winT >> 4) & 1)) textC("'JUMP' TO RESTART!", 96, PAL[6]);
    }

    function draw() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        rect(0, 0, 128, 128, PAL[0]);

        const m = Math.min(shake, 3);
        ctx.translate(m ? Math.round((Math.random() - 0.5) * 2 * m) : 0, m ? Math.round((Math.random() - 0.5) * 2 * m) : 0);

        drawBackground(ctx, tick);
        ctx.drawImage(staticLayer, 0, 0);
        drawOrb();
        drawRefills();

        if (mode !== 'dead' && P.visible) {
            P.trail.forEach((t, i) => rect(t.x, t.y, P.w, P.h, i < P.trail.length - 2 ? PAL[13] : PAL[12]));

            const col = P.dashT > 0 ? PAL[7] : (P.dashes > 0 ? PAL[12] : PAL[6]);
            const px = Math.round(P.x), py = Math.round(P.y);
            if (P.squash > 0) drawPlayerBox(ctx, px, py + 1, 7, 5, col, P.facing);
            else if (P.stretch > 0) drawPlayerBox(ctx, px, py - 1, 6, 7, col, P.facing);
            else drawPlayerBox(ctx, px, py, 6, 6, col, P.facing);
        }

        for (const p of parts) rect(Math.round(p.x), Math.round(p.y), 1, 1, p.c);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (mode === 'win' || mode === 'fake') drawWin();
        if (mode === 'out') drawIris(trans.cx, trans.cy, 96 * (1 - trans.t / trans.dur));
        else if (mode === 'in' && trans.t < trans.dur) drawIris(trans.cx, trans.cy, 96 * (trans.t / trans.dur));
    }

    // ==========================================
    // 13. LEVEL EDITOR
    //     Boot with:  Up, Up, Down, Down, X, Left
    // ==========================================
    const COMBO = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'x', 'arrowleft'];
    const COMBO_GAP = 2000;                       // max ms between combo keys
    const DRAFT_KEY = 'plateformer_editor_draft_v1';

    const TILE_DEFS = [
        { id: 1,  name: 'Wall' },
        { id: 2,  name: 'Spike up' },
        { id: 9,  name: 'Spike right' },
        { id: 7,  name: 'Spike down' },
        { id: 8,  name: 'Spike left' },
        { id: 10, name: 'Hazard' },
        { id: 3,  name: 'Refill' },
        { id: 5,  name: 'Spawn' },
        { id: 4,  name: 'Goal' },
        { id: 6,  name: 'Final goal' },
        { id: 11, name: 'Hidden goal' },
        { id: 12, name: 'Fake goal' },
        { id: 0,  name: 'Eraser' },
    ];
    // Palette entries. Entries with several ids are one button: pick the type with Q / E, the mouse wheel,
    // by pressing the entry's key again, or by right clicking it.
    const GROUPS = [
        { name: 'Wall',   key: '1', ids: [1] },
        { name: 'Spike',  key: '2', ids: [2, 9, 7, 8] },
        { name: 'Hazard', key: '3', ids: [10] },
        { name: 'Refill', key: '4', ids: [3] },
        { name: 'Spawn',  key: '5', ids: [5] },
        { name: 'Goal',   key: '6', ids: [4, 6, 11, 12] },
        { name: 'Eraser', key: '7', ids: [0] },
    ];
    const GROUP_OF = {};
    GROUPS.forEach((g, i) => g.ids.forEach((id) => { GROUP_OF[id] = i; }));
    const TILE_NAME = {};
    TILE_DEFS.forEach((d) => { TILE_NAME[d.id] = d.name; });
    TILE_NAME[0] = 'Empty';
    const VALID_TILE = new Set(TILE_DEFS.map((d) => d.id));
    // Tiles that may only exist once per level (placing one removes the others in the group).
    // Fake goals are deliberately not in here: a level can hold one real goal and any number of fakes.
    const UNIQUE = { 5: [5], 4: [4, 6, 11], 6: [4, 6, 11], 11: [4, 6, 11] };

    const TOOLS = [
        { id: 'pencil', name: 'Pencil', key: 'b' },
        { id: 'line',   name: 'Line',   key: 'l' },
        { id: 'rect',   name: 'Rect',   key: 'r' },
        { id: 'frame',  name: 'Frame',  key: 'o' },
        { id: 'fill',   name: 'Fill',   key: 'f' },
        { id: 'pick',   name: 'Pick',   key: 'i' },
        { id: 'select', name: 'Select', key: 's' },
    ];

    const ed = {
        idx: 0, tool: 'pencil', tile: 1, last: {}, grid: true, hit: false,
        hover: null, drag: null, sel: null, clip: null,
        undo: [], redo: [], frame: 0, prevCursor: '', prevTouch: '',
    };

    // ---------- small helpers ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const cloneMap = (m) => m.map((r) => r.slice());
    const getList = () => levelKeys.map((k) => levels[k]);
    const curMap = () => levels[levelKeys[ed.idx]];
    const inb = (p) => !!p && p.c >= 0 && p.c < 16 && p.r >= 0 && p.r < 16;
    const clampCell = (p) => ({ c: clamp(p.c, 0, 15), r: clamp(p.r, 0, 15) });

    function setList(list) {
        for (const k of Object.keys(levels)) delete levels[k];
        list.forEach((m, i) => { levels[i + 1] = m; });
        levelKeys.length = 0;
        Object.keys(levels).map(Number).sort((a, b) => a - b).forEach((k) => levelKeys.push(k));
    }

    const snapshot = () => JSON.stringify({ list: getList(), idx: ed.idx });

    function restoreSnapshot(s) {
        const o = JSON.parse(s);
        setList(o.list.map(cloneMap));
        ed.idx = clamp(o.idx, 0, levelKeys.length - 1);
        ed.sel = null;
        ed.drag = null;
        renderPanel();
    }

    function saveDraft() {
        try { localStorage.setItem(DRAFT_KEY, snapshot()); } catch (e) { /* storage unavailable */ }
    }

    // Records an undo step if anything changed since `before`
    function commit(before) {
        const after = snapshot();
        if (after === before) return false;
        ed.undo.push(before);
        if (ed.undo.length > 200) ed.undo.shift();
        ed.redo.length = 0;
        saveDraft();
        renderPanel();
        return true;
    }

    function undo() {
        if (!ed.undo.length) return say('Nothing to undo.');
        ed.redo.push(snapshot());
        restoreSnapshot(ed.undo.pop());
        saveDraft();
        say('Undo.');
    }
    function redo() {
        if (!ed.redo.length) return say('Nothing to redo.');
        ed.undo.push(snapshot());
        restoreSnapshot(ed.redo.pop());
        saveDraft();
        say('Redo.');
    }

    // ---------- editing primitives ----------
    function put(m, c, r, t) {
        if (c < 0 || c >= 16 || r < 0 || r >= 16) return;
        const group = UNIQUE[t];
        if (group) {
            for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (group.includes(m[y][x])) m[y][x] = 0;
        }
        m[r][c] = t;
    }

    function lineCells(a, b) {
        const out = [];
        let x = a.c, y = a.r;
        const dx = Math.abs(b.c - a.c), dy = -Math.abs(b.r - a.r);
        const sx = a.c < b.c ? 1 : -1, sy = a.r < b.r ? 1 : -1;
        let err = dx + dy;
        for (;;) {
            out.push({ c: x, r: y });
            if (x === b.c && y === b.r) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x += sx; }
            if (e2 <= dx) { err += dx; y += sy; }
        }
        return out;
    }

    function shapeCells(d) {
        const a = d.start, b = d.cur;
        if (UNIQUE[d.val]) return [b];                       // single-instance tiles go to the end cell only
        if (d.tool === 'line') return lineCells(a, b);
        const c0 = Math.min(a.c, b.c), c1 = Math.max(a.c, b.c);
        const r0 = Math.min(a.r, b.r), r1 = Math.max(a.r, b.r);
        const out = [];
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
            if (d.tool === 'rect' || r === r0 || r === r1 || c === c0 || c === c1) out.push({ c, r });
        }
        return out;
    }

    function floodFill(m, c, r, v) {
        const target = m[r][c];
        if (target === v) return;
        if (UNIQUE[v]) { put(m, c, r, v); return; }
        const stack = [[c, r]];
        while (stack.length) {
            const [x, y] = stack.pop();
            if (x < 0 || x >= 16 || y < 0 || y >= 16 || m[y][x] !== target) continue;
            m[y][x] = v;
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    function selRect() {
        if (!ed.sel) return null;
        const { a, b } = ed.sel;
        return { c0: Math.min(a.c, b.c), r0: Math.min(a.r, b.r), c1: Math.max(a.c, b.c), r1: Math.max(a.r, b.r) };
    }

    function copySel(cut) {
        const s = selRect();
        if (!s) return say('Select an area first (S, then drag).');
        const m = curMap();
        ed.clip = [];
        for (let r = s.r0; r <= s.r1; r++) ed.clip.push(m[r].slice(s.c0, s.c1 + 1));
        if (cut) {
            const before = snapshot();
            for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) m[r][c] = 0;
            commit(before);
        } else renderPanel();
        say((cut ? 'Cut ' : 'Copied ') + (s.c1 - s.c0 + 1) + 'x' + (s.r1 - s.r0 + 1) + '. Ctrl+V to paste.');
    }

    function clearSel() {
        const s = selRect();
        if (!s) return;
        const before = snapshot(), m = curMap();
        for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) m[r][c] = 0;
        commit(before);
        say('Cleared selection.');
    }

    function pasteClip() {
        if (!ed.clip) return say('Clipboard is empty. Copy a selection first.');
        setTool('stamp');
        say('Click to stamp. Esc cancels.');
    }

    // ---------- whole-level transforms ----------
    function transform(label, fn) {
        const before = snapshot();
        levels[levelKeys[ed.idx]] = fn(curMap());
        ed.sel = null;
        commit(before);
        say(label);
    }
    const flipH = () => transform('Flipped horizontally.', (m) =>
        m.map((row) => row.slice().reverse().map((t) => (t === 8 ? 9 : t === 9 ? 8 : t))));
    const flipV = () => transform('Flipped vertically.', (m) =>
        m.slice().reverse().map((row) => row.map((t) => (t === 2 ? 7 : t === 7 ? 2 : t))));
    const shiftLevel = (dx, dy) => transform('Shifted level (wraps around).', (m) =>
        m.map((row, r) => row.map((_, c) => m[(r - dy + 16) % 16][(c - dx + 16) % 16])));
    const sealEdges = () => transform('Sealed the outer edge with walls.', (m) => {
        const out = cloneMap(m);
        for (let i = 0; i < 16; i++) for (const [r, c] of [[0, i], [15, i], [i, 0], [i, 15]]) if (out[r][c] === 0) out[r][c] = 1;
        return out;
    });
    const clearLevel = () => transform('Cleared level.', () => Array.from({ length: 16 }, () => Array(16).fill(0)));
    const solidLevel = () => transform('Filled level with walls.', () => Array.from({ length: 16 }, () => Array(16).fill(1)));

    // ---------- level management ----------
    function blankLevel() {
        const m = Array.from({ length: 16 }, (_, r) => Array.from({ length: 16 }, (_, c) => (r === 0 || r === 15 || c === 0 || c === 15 ? 1 : 0)));
        m[14][2] = 5;
        m[14][13] = 4;
        return m;
    }
    function insertLevel(m, label) {
        const before = snapshot(), list = getList();
        list.splice(ed.idx + 1, 0, m);
        setList(list);
        ed.idx++;
        ed.sel = null;
        commit(before);
        say(label);
    }
    const newLevel = () => insertLevel(blankLevel(), 'New level added after this one.');
    const duplicateLevel = () => insertLevel(cloneMap(curMap()), 'Level duplicated.');
    function deleteLevel() {
        if (levelKeys.length <= 1) return say('Cannot delete the only level.');
        ask('Delete level ' + (ed.idx + 1) + '? You can undo this.', () => {
            const before = snapshot(), list = getList();
            list.splice(ed.idx, 1);
            setList(list);
            ed.idx = clamp(ed.idx, 0, list.length - 1);
            ed.sel = null;
            commit(before);
            say('Level deleted.');
        });
    }
    function moveLevel(dir) {
        const j = ed.idx + dir;
        if (j < 0 || j >= levelKeys.length) return;
        const before = snapshot(), list = getList();
        [list[ed.idx], list[j]] = [list[j], list[ed.idx]];
        setList(list);
        ed.idx = j;
        commit(before);
        say('Level moved to position ' + (j + 1) + '.');
    }
    function gotoLevel(i) {
        ed.idx = clamp(i, 0, levelKeys.length - 1);
        ed.sel = null;
        ed.drag = null;
        renderPanel();
    }

    // ---------- validation ----------
    function boxHits(m, x, y, w, h) {
        let wall = false, haz = false;
        const c0 = Math.floor(x / TILE), c1 = Math.floor((x + w - 0.001) / TILE);
        const r0 = Math.floor(y / TILE), r1 = Math.floor((y + h - 0.001) / TILE);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
            if (r < 0 || r >= 16 || c < 0 || c >= 16) { wall = true; continue; }
            const t = m[r][c];
            if (t === 1) wall = true;
            const hb = HIT[t];
            if (hb) {
                const bx = c * TILE + hb[0], by = r * TILE + hb[1];
                if (x < bx + hb[2] && x + w > bx && y < by + hb[3] && y + h > by) haz = true;
            }
        }
        return { wall, haz };
    }

    function validate(m) {
        const warns = [];
        let spawns = 0, goals = 0, sp = null;
        for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
            const t = m[r][c];
            if (t === 5) { spawns++; if (!sp) sp = { r, c }; }
            if (t === 4 || t === 6 || t === 11) goals++;
        }
        if (!spawns) warns.push('No spawn point (key 5).');
        if (spawns > 1) warns.push('More than one spawn; only the first is used.');
        if (!goals) warns.push('No real goal (key 6). Fake goals do not finish a level.');
        if (goals > 1) warns.push('More than one goal.');
        if (sp) {
            const h = boxHits(m, sp.c * TILE + 1, sp.r * TILE + 2, 6, 6);
            if (h.wall) warns.push('Spawn overlaps a wall.');
            if (h.haz) warns.push('Spawn overlaps a hazard.');
        }
        return warns;
    }

    // ---------- import / export ----------
    function toJS() {
        const lines = ['const levels = {'];
        levelKeys.forEach((k) => {
            lines.push('    ' + k + ': [');
            levels[k].forEach((row, i) => lines.push('        [' + row.join(',') + ']' + (i < 15 ? ',' : '')));
            lines.push('    ],');
        });
        lines.push('};');
        return lines.join('\n');
    }
    const toJSON = () => JSON.stringify(getList());

    // Reads every run of 16 numbers in brackets (works for JSON and for the JS format above), no eval
    function parseLevels(text) {
        const rows = text.match(/\[\s*\d+(?:\s*,\s*\d+){15}\s*,?\s*\]/g) || [];
        if (!rows.length) throw new Error('No level rows found.');
        if (rows.length % 16) throw new Error('Expected 16 rows per level, found ' + rows.length + ' rows.');
        const nums = rows.map((r) => r.match(/\d+/g).map(Number));
        const maps = [];
        for (let i = 0; i < nums.length; i += 16) {
            const m = nums.slice(i, i + 16);
            for (const row of m) for (const t of row) if (!VALID_TILE.has(t)) throw new Error('Unknown tile id ' + t + '.');
            maps.push(m);
        }
        return maps;
    }

    function copyText(txt, okMsg) {
        const done = () => say(okMsg);
        const fail = () => say('Text is in the box below. Press Ctrl+C to copy it.');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fail);
        else fail();
    }

    const swatchURL = {};
    TILE_DEFS.forEach((d) => {
        const c = document.createElement('canvas');
        c.width = c.height = 14;
        const g = c.getContext('2d');
        g.fillStyle = PAL[0]; g.fillRect(0, 0, 14, 14);
        if (d.id === 0) {
            g.fillStyle = PAL[13];
            for (let i = 0; i < 8; i++) { g.fillRect(3 + i, 3 + i, 1, 1); g.fillRect(10 - i, 3 + i, 1, 1); }
        } else drawTile(g, d.id, 3, 3, 12);
        swatchURL[d.id] = c.toDataURL();
    });

    // ---------- UI (reads the site's style.js tokens, so it follows the active theme) ----------
    let panel = null, dyn = null, statusEl = null, hoverEl = null, dataBox = null, testbar = null, dlg = null;

    function injectCSS() {
        const s = document.createElement('style');
        s.textContent = `
.pe-panel,.pe-testbar,.pe-dlg{
--c-surface:var(--color-surface,#c0c0c0);--c-hi:var(--color-hi,#fff);--c-lo:var(--color-lo,#808080);--c-dark:var(--color-dark,#0a0a0a);
--c-title:var(--color-titlebar,#000080);--c-titletext:var(--color-title-text,#fff);--c-ink:var(--color-ink,#020202);
--c-field:var(--color-clock-face,#f8f8f8);--c-link:var(--color-link,#192cd3);--c-warn:var(--color-link-visited,#d31941);--c-accent:var(--color-accent,#520909);
--c-font:var(--font-ui,sans-serif);--c-mono:var(--font-mono,monospace);
background:var(--c-surface);color:var(--c-ink);font:bold 12px/1.3 var(--c-font);padding:3px;box-sizing:border-box;
border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark);user-select:none}
.pe-panel *,.pe-testbar *,.pe-dlg *{box-sizing:border-box}
.pe-panel{position:fixed;top:8px;right:8px;bottom:8px;width:min(300px,calc(100vw - 16px));z-index:99999;display:none;flex-direction:column}
.pe-panel.on{display:flex;animation:pe-pop var(--motion-pop-time,.5s) var(--motion-pop,cubic-bezier(.175,.885,.32,1.275))}
.pe-panel.min{bottom:auto!important;height:auto!important}
.pe-panel.min .pe-body{display:none}
.pe-title{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:3px 5px;background:var(--c-title);color:var(--c-titletext);font-size:var(--size-bar,12px);font-weight:bold;touch-action:none}
.pe-panel .pe-title{cursor:move}
.pe-tbtns{display:flex;gap:2px}
.pe-tb{display:grid;place-items:center;width:18px;height:16px;padding:0;background:var(--c-surface);color:var(--c-ink);font:bold 12px/1 var(--c-font);cursor:pointer;border-radius:0;
border:1px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi)}
.pe-tb:active{border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo)}
.pe-body{display:flex;flex-direction:column;gap:8px;margin-top:4px;padding:6px;background:var(--c-surface);overflow:auto;flex:1;min-height:0}
.pe-body::-webkit-scrollbar{width:16px}
.pe-body::-webkit-scrollbar-track{background:repeating-conic-gradient(var(--c-surface) 0 25%,var(--c-hi) 0 50%) 0 0/2px 2px}
.pe-body::-webkit-scrollbar-thumb{background:var(--c-surface);border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset -1px -1px var(--c-dark)}
.pe-head{display:flex;justify-content:space-between;align-items:baseline;font-size:14px}
.pe-sec{display:flex;flex-direction:column;gap:5px}
.pe-grp{border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);padding:6px;display:flex;flex-direction:column;gap:5px}
.pe-lbl{font-size:12px}
.pe-row{display:flex;flex-wrap:wrap;gap:4px}
.pe-center{justify-content:center}
.pe-btn{font:inherit;color:var(--c-ink);background:var(--c-surface);min-height:24px;padding:2px 8px;cursor:pointer;border-radius:0;
border:2px solid;border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark)}
.pe-btn:active,.pe-btn.sel{border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);box-shadow:inset 1px 1px var(--c-dark),inset -1px -1px var(--c-surface)}
.pe-btn.sel{background:repeating-conic-gradient(var(--c-surface) 0 25%,var(--c-hi) 0 50%) 0 0/2px 2px}
.pe-btn:disabled{color:var(--c-lo);text-shadow:1px 1px var(--c-hi);cursor:default}
.pe-btn:disabled:active{border-color:var(--c-hi) var(--c-lo) var(--c-lo) var(--c-hi);box-shadow:inset 1px 1px var(--c-surface),inset -1px -1px var(--c-dark)}
.pe-btn:focus-visible,.pe-tb:focus-visible,.pe-help summary:focus-visible{outline:1px dotted var(--c-ink);outline-offset:2px}
.pe-btn.go{outline:1px solid var(--c-ink)}
.pe-btn.go:focus-visible{outline:1px dotted var(--c-ink)}
.pe-btn.bad{color:var(--c-warn)}
.pe-var{min-width:56px}
.pe-chip{min-width:28px;text-align:center;padding:2px 0}
.pe-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.pe-tile{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 2px;font-size:10px;white-space:nowrap}
.pe-tile img{width:42px;height:42px;image-rendering:pixelated;background:#000;display:block;border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo)}
.pe-warn{color:var(--c-warn)}
.pe-ok{color:var(--c-ink)}
.pe-field{background:var(--c-field);border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo);padding:2px 5px}
.pe-status{min-height:3.6em}
.pe-hover{min-height:1.9em}
.pe-data textarea{width:100%;height:84px;resize:vertical;background:var(--c-field);color:var(--c-ink);font:10px/1.3 var(--c-mono);padding:4px;border-radius:0;user-select:text;
border:2px solid;border-color:var(--c-lo) var(--c-hi) var(--c-hi) var(--c-lo)}
.pe-help summary{cursor:pointer}
.pe-help dl{margin:6px 0 0;display:grid;grid-template-columns:auto 1fr;gap:2px 10px}
.pe-help dt{color:var(--c-link)}
.pe-help dd{margin:0}
.pe-testbar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:99999;display:none;flex-direction:column;min-width:280px}
.pe-testbar.on{display:flex;animation:pe-pop-c var(--motion-pop-time,.5s) var(--motion-pop,cubic-bezier(.175,.885,.32,1.275))}
.pe-tbody{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;padding:8px}
.pe-dlg{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100000;min-width:250px;max-width:320px;animation:pe-pop-c var(--motion-pop-time,.5s) var(--motion-pop,cubic-bezier(.175,.885,.32,1.275))}
.pe-dbody{margin-top:4px;padding:12px 12px 10px;display:flex;flex-direction:column;gap:12px}
.pe-dlg p{margin:0;font-size:13px}
.pe-dlg .pe-btn{min-width:72px}
@keyframes pe-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes pe-pop-c{from{transform:translate(-50%,-50%) scale(.6);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
.pe-testbar.on{animation-name:pe-pop-b}
@keyframes pe-pop-b{from{transform:translateX(-50%) scale(.6);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.pe-panel.on,.pe-testbar.on,.pe-dlg{animation:none}}
@media (max-width:820px){.pe-panel{top:auto!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;max-height:46vh}.pe-panel .pe-title{cursor:default}}
`;
        document.head.appendChild(s);
    }

    function buildUI() {
        if (panel) return;
        injectCSS();

        panel = document.createElement('div');
        panel.className = 'pe-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Level editor');
        panel.innerHTML = `
<div class="pe-title"><span>leveleditor.exe</span>
  <span class="pe-tbtns">
    <button class="pe-tb" data-act="min" aria-label="Minimize">_</button>
    <button class="pe-tb" data-act="dock" aria-label="Restore position">&#9633;</button>
    <button class="pe-tb" data-act="exit" aria-label="Close editor">&times;</button>
  </span>
</div>
<div class="pe-body">
  <div class="pe-dyn"></div>
  <div class="pe-sec">
    <div class="pe-field pe-hover" id="pe-hover">&nbsp;</div>
    <div class="pe-field pe-status" id="pe-status" aria-live="polite"></div>
  </div>
  <div class="pe-grp pe-data">
    <span class="pe-lbl">Data</span>
    <div class="pe-row">
      <button class="pe-btn" data-act="exportjs">Copy JS</button>
      <button class="pe-btn" data-act="exportjson">Copy JSON</button>
      <button class="pe-btn" data-act="download">Download</button>
      <button class="pe-btn" data-act="import">Import box</button>
      <button class="pe-btn" data-act="restore">Restore draft</button>
    </div>
    <textarea id="pe-data" spellcheck="false" aria-label="Level data" placeholder="Exports appear here. Paste level data and press Import box to load it."></textarea>
  </div>
  <details class="pe-help">
    <summary>Shortcuts</summary>
    <dl>
      <dt>1-7</dt><dd>Pick tile (press again for its next type)</dd>
      <dt>Q / E, wheel</dt><dd>Previous / next type (spike direction, goal kind)</dd>
      <dt>Right click tile</dt><dd>Next type</dd>
      <dt>B L R O F I S</dt><dd>Pencil, Line, Rect, Frame, Fill, Pick, Select</dd>
      <dt>Right click</dt><dd>Erase with the current tool</dd>
      <dt>Ctrl+Z / Y</dt><dd>Undo / redo</dd>
      <dt>Ctrl+C X V</dt><dd>Copy, cut, paste selection</dd>
      <dt>Ctrl+A</dt><dd>Select the whole level</dd>
      <dt>Del</dt><dd>Clear selection</dd>
      <dt>[ and ]</dt><dd>Previous / next level</dd>
      <dt>Shift+arrows</dt><dd>Shift level contents</dd>
      <dt>G / H</dt><dd>Toggle grid / hitboxes</dd>
      <dt>P</dt><dd>Playtest this level</dd>
      <dt>Esc</dt><dd>Cancel, then leave the editor</dd>
    </dl>
  </details>
</div>`;
        document.body.appendChild(panel);
        dyn = panel.querySelector('.pe-dyn');
        statusEl = panel.querySelector('#pe-status');
        hoverEl = panel.querySelector('#pe-hover');
        dataBox = panel.querySelector('#pe-data');

        testbar = document.createElement('div');
        testbar.className = 'pe-testbar';
        testbar.innerHTML = `<div class="pe-title"><span>playtest.exe</span></div>
<div class="pe-tbody"><span id="pe-testlabel">Playtest</span><button class="pe-btn go" data-act="endtest">Back to editor (Esc)</button></div>`;
        document.body.appendChild(testbar);

        const onClick = (e) => {
            const b = e.target.closest('[data-act]');
            if (!b || b.disabled) return;
            handleAct(b.dataset.act, b.dataset.v);
            if (document.activeElement === b) b.blur();
        };
        panel.addEventListener('click', onClick);
        panel.addEventListener('contextmenu', (e) => {
            const b = e.target.closest('[data-act="group"], [data-act="tile"]');
            if (!b) return;
            e.preventDefault();
            if (b.dataset.act === 'group' && GROUP_OF[ed.tile] !== +b.dataset.v) pickGroup(+b.dataset.v);
            else cycleVariant(1);
        });
        testbar.addEventListener('click', onClick);

        // drag the window by its title bar
        const bar = panel.querySelector('.pe-title');
        let off = null;
        bar.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button') || window.matchMedia('(max-width:820px)').matches) return;
            const r = panel.getBoundingClientRect();
            off = { x: e.clientX - r.left, y: e.clientY - r.top };
            panel.style.left = r.left + 'px'; panel.style.top = r.top + 'px';
            panel.style.right = 'auto'; panel.style.bottom = 'auto';
            panel.style.height = panel.classList.contains('min') ? '' : r.height + 'px';
            try { bar.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        });
        bar.addEventListener('pointermove', (e) => {
            if (!off) return;
            panel.style.left = clamp(e.clientX - off.x, 0, window.innerWidth - 80) + 'px';
            panel.style.top = clamp(e.clientY - off.y, 0, window.innerHeight - 24) + 'px';
        });
        const stop = () => { off = null; };
        bar.addEventListener('pointerup', stop);
        bar.addEventListener('pointercancel', stop);
    }

    function dockPanel() {
        panel.style.left = panel.style.top = panel.style.right = panel.style.bottom = panel.style.height = '';
        panel.classList.remove('min');
    }

    // Small modal message box (replaces window.confirm so it matches the rest of the editor)
    function closeDlg() { if (dlg) { dlg.remove(); dlg = null; } }
    function ask(msg, onYes) {
        closeDlg();
        dlg = document.createElement('div');
        dlg.className = 'pe-dlg';
        dlg.setAttribute('role', 'alertdialog');
        dlg.innerHTML = `<div class="pe-title"><span>leveleditor.exe</span></div>
<div class="pe-dbody"><p></p><div class="pe-row pe-center"><button class="pe-btn go" data-d="y">Yes</button><button class="pe-btn" data-d="n">No</button></div></div>`;
        dlg.querySelector('p').textContent = msg;
        dlg.addEventListener('click', (e) => {
            const b = e.target.closest('[data-d]');
            if (!b) return;
            const ok = b.dataset.d === 'y';
            closeDlg();
            if (ok) onYes();
        });
        document.body.appendChild(dlg);
        dlg.querySelector('.go').focus();
    }

    function say(msg) { if (statusEl) statusEl.textContent = msg; }

    function renderPanel() {
        if (!dyn) return;
        const N = levelKeys.length;
        ed.idx = clamp(ed.idx, 0, N - 1);
        const warns = validate(curMap());
        const chips = levelKeys.map((_, i) =>
            `<button class="pe-btn pe-chip ${i === ed.idx ? 'sel' : ''}" data-act="goto" data-v="${i}" aria-label="Level ${i + 1}">${i + 1}</button>`).join('');
        const tiles = GROUPS.map((g, i) => {
            const cur = GROUP_OF[ed.tile] === i;
            const id = cur ? ed.tile : (ed.last[i] !== undefined ? ed.last[i] : g.ids[0]);
            const tip = g.name + ' (' + g.key + ')' + (g.ids.length > 1 ? ' - right click or Q/E for the next type' : '');
            return `<button class="pe-btn pe-tile ${cur ? 'sel' : ''}" data-act="group" data-v="${i}" title="${tip}"><img src="${swatchURL[id]}" alt="">${g.key} ${g.name}</button>`;
        }).join('');
        const grp = GROUPS[GROUP_OF[ed.tile]];
        const variants = grp && grp.ids.length > 1
            ? `<div class="pe-grp"><span class="pe-lbl">${grp.name} type (Q / E, wheel)</span><div class="pe-row">${grp.ids.map((id) =>
                `<button class="pe-btn pe-tile pe-var ${ed.tile === id ? 'sel' : ''}" data-act="tile" data-v="${id}" title="${TILE_NAME[id]}"><img src="${swatchURL[id]}" alt="">${TILE_NAME[id]}</button>`).join('')}</div></div>`
            : '';
        const tools = TOOLS.map((t) =>
            `<button class="pe-btn ${ed.tool === t.id ? 'sel' : ''}" data-act="tool" data-v="${t.id}" title="${t.name} (${t.key.toUpperCase()})">${t.name}</button>`).join('');
        const stamp = ed.clip
            ? `<button class="pe-btn ${ed.tool === 'stamp' ? 'sel' : ''}" data-act="tool" data-v="stamp" title="Stamp clipboard (Ctrl+V)">Stamp</button>` : '';

        dyn.innerHTML = `
<div class="pe-head"><span>Level ${ed.idx + 1} of ${N}</span><span class="${warns.length ? 'pe-warn' : 'pe-ok'}">${warns.length ? warns.length + ' warning' + (warns.length > 1 ? 's' : '') : 'OK'}</span></div>
<div class="pe-grp">
  <div class="pe-row">${chips}</div>
  <div class="pe-row">
    <button class="pe-btn" data-act="new">New</button>
    <button class="pe-btn" data-act="dup">Duplicate</button>
    <button class="pe-btn bad" data-act="del">Delete</button>
    <button class="pe-btn" data-act="mvl" ${ed.idx === 0 ? 'disabled' : ''} aria-label="Move level earlier">Move &larr;</button>
    <button class="pe-btn" data-act="mvr" ${ed.idx === N - 1 ? 'disabled' : ''} aria-label="Move level later">Move &rarr;</button>
  </div>
</div>
<div class="pe-grp"><span class="pe-lbl">Tiles</span><div class="pe-tiles">${tiles}</div></div>
${variants}
<div class="pe-grp"><span class="pe-lbl">Tools</span><div class="pe-row">${tools}${stamp}</div></div>
<div class="pe-grp">
  <span class="pe-lbl">Level</span>
  <div class="pe-row">
    <button class="pe-btn" data-act="undo" ${ed.undo.length ? '' : 'disabled'}>Undo</button>
    <button class="pe-btn" data-act="redo" ${ed.redo.length ? '' : 'disabled'}>Redo</button>
    <button class="pe-btn" data-act="fliph">Flip H</button>
    <button class="pe-btn" data-act="flipv">Flip V</button>
  </div>
  <div class="pe-row">
    <button class="pe-btn" data-act="shl" aria-label="Shift left">&larr;</button>
    <button class="pe-btn" data-act="shr" aria-label="Shift right">&rarr;</button>
    <button class="pe-btn" data-act="shu" aria-label="Shift up">&uarr;</button>
    <button class="pe-btn" data-act="shd" aria-label="Shift down">&darr;</button>
    <button class="pe-btn" data-act="seal">Seal edges</button>
    <button class="pe-btn bad" data-act="clear">Clear</button>
    <button class="pe-btn" data-act="solid">Solid</button>
  </div>
</div>
<div class="pe-grp">
  <span class="pe-lbl">View</span>
  <div class="pe-row">
    <button class="pe-btn ${ed.grid ? 'sel' : ''}" data-act="grid">Grid</button>
    <button class="pe-btn ${ed.hit ? 'sel' : ''}" data-act="hit">Hitboxes</button>
  </div>
</div>
<div class="pe-row">
  <button class="pe-btn go" data-act="test">Playtest (P)</button>
  <button class="pe-btn" data-act="exit">Exit editor (Esc)</button>
</div>
<div class="${warns.length ? 'pe-warn' : 'pe-ok'}">${warns.length ? warns.map((w) => '! ' + w).join('<br>') : 'Level looks valid.'}</div>`;
    }

    function handleAct(a, v) {
        switch (a) {
            case 'goto': gotoLevel(+v); break;
            case 'new': newLevel(); break;
            case 'dup': duplicateLevel(); break;
            case 'del': deleteLevel(); break;
            case 'mvl': moveLevel(-1); break;
            case 'mvr': moveLevel(1); break;
            case 'tile': pickTile(+v); break;
            case 'group': pickGroup(+v); break;
            case 'tool': setTool(v); break;
            case 'undo': undo(); break;
            case 'redo': redo(); break;
            case 'fliph': flipH(); break;
            case 'flipv': flipV(); break;
            case 'shl': shiftLevel(-1, 0); break;
            case 'shr': shiftLevel(1, 0); break;
            case 'shu': shiftLevel(0, -1); break;
            case 'shd': shiftLevel(0, 1); break;
            case 'seal': sealEdges(); break;
            case 'clear': clearLevel(); break;
            case 'solid': solidLevel(); break;
            case 'grid': ed.grid = !ed.grid; renderPanel(); break;
            case 'hit': ed.hit = !ed.hit; renderPanel(); break;
            case 'test': startTest(); break;
            case 'endtest': exitTest(false); break;
            case 'exit': exitEditor(); break;
            case 'min': panel.classList.toggle('min'); break;
            case 'dock': dockPanel(); break;
            case 'exportjs': dataBox.value = toJS(); dataBox.select(); copyText(dataBox.value, 'Copied level data as JS.'); break;
            case 'exportjson': dataBox.value = toJSON(); dataBox.select(); copyText(dataBox.value, 'Copied level data as JSON.'); break;
            case 'download': downloadJS(); break;
            case 'import': importFromBox(); break;
            case 'restore': restoreDraft(); break;
        }
    }

    function setTool(id) {
        if (id === 'stamp' && !ed.clip) return;
        ed.tool = id;
        ed.drag = null;
        renderPanel();
    }
    function pickGroup(gi) {
        const g = GROUPS[gi];
        pickTile(ed.last[gi] !== undefined ? ed.last[gi] : g.ids[0]);
    }
    function cycleVariant(dir) {
        const g = GROUPS[GROUP_OF[ed.tile]];
        if (!g || g.ids.length < 2) return say(TILE_NAME[ed.tile] + ' has only one type.');
        const i = g.ids.indexOf(ed.tile);
        pickTile(g.ids[(i + dir + g.ids.length) % g.ids.length]);
    }
    function pickTile(t) {
        ed.tile = t;
        if (GROUP_OF[t] !== undefined) ed.last[GROUP_OF[t]] = t;
        if (ed.tool === 'pick' || ed.tool === 'select' || ed.tool === 'stamp') ed.tool = 'pencil';
        renderPanel();
        say(TILE_NAME[t] + ' selected.');
    }

    function downloadJS() {
        const txt = toJS();
        dataBox.value = txt;
        try {
            const url = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plateformer_levels.js';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            say('Downloaded plateformer_levels.js.');
        } catch (e) { say('Download blocked. The data is in the box below.'); }
    }

    function importFromBox() {
        let maps;
        try { maps = parseLevels(dataBox.value); } catch (err) { return say('Import failed: ' + err.message); }
        ask('Replace all ' + levelKeys.length + ' levels with ' + maps.length + ' imported level(s)? You can undo this.', () => {
            const before = snapshot();
            setList(maps);
            ed.idx = 0;
            ed.sel = null;
            commit(before);
            renderPanel();
            say('Imported ' + maps.length + ' level(s).');
        });
    }

    function restoreDraft() {
        let s = null;
        try { s = localStorage.getItem(DRAFT_KEY); } catch (e) { /* ignore */ }
        if (!s) return say('No saved draft found.');
        try {
            const before = snapshot();
            restoreSnapshot(s);
            commit(before);
            say('Draft restored. Undo brings back what you had.');
        } catch (e) { say('The saved draft is damaged.'); }
    }

    // ---------- pointer editing ----------
    function cellAt(e) {
        const b = canvas.getBoundingClientRect();
        const x = ((e.clientX - b.left) / b.width) * 128, y = ((e.clientY - b.top) / b.height) * 128;
        return { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
    }

    function updateHover(p) {
        if (!hoverEl) return;
        hoverEl.textContent = inb(p) ? 'x ' + p.c + '  y ' + p.r + '  ' + TILE_NAME[curMap()[p.r][p.c]] : '\u00a0';
    }

    canvas.addEventListener('contextmenu', (e) => { if (editing) e.preventDefault(); });
    canvas.addEventListener('wheel', (e) => {
        if (!editing) return;
        e.preventDefault();
        cycleVariant(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    canvas.addEventListener('pointerdown', (e) => {
        if (!editing) return;
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        const p = clampCell(cellAt(e));
        const erase = e.button === 2;
        const val = erase ? 0 : ed.tile;
        const m = curMap();
        const before = snapshot();
        ed.hover = p;
        updateHover(p);

        switch (ed.tool) {
            case 'pencil':
                put(m, p.c, p.r, val);
                ed.drag = { kind: 'pencil', last: p, val, before };
                break;
            case 'line': case 'rect': case 'frame':
                ed.drag = { kind: 'shape', tool: ed.tool, start: p, cur: p, val, before };
                break;
            case 'fill':
                floodFill(m, p.c, p.r, val);
                commit(before);
                break;
            case 'pick':
                if (!erase) { const t = m[p.r][p.c]; pickTile(t); say('Picked ' + TILE_NAME[t] + '.'); }
                break;
            case 'select':
                if (erase) { ed.sel = null; say('Selection cleared.'); }
                else { ed.sel = null; ed.drag = { kind: 'select', start: p, cur: p }; }
                break;
            case 'stamp':
                if (erase) { setTool('pencil'); break; }
                for (let y = 0; y < ed.clip.length; y++) for (let x = 0; x < ed.clip[y].length; x++) put(m, p.c + x, p.r + y, ed.clip[y][x]);
                commit(before);
                break;
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!editing) return;
        const raw = cellAt(e);
        ed.hover = inb(raw) ? raw : null;
        updateHover(raw);
        const d = ed.drag;
        if (!d) return;
        const q = clampCell(raw);
        if (d.kind === 'pencil') {
            const m = curMap();
            for (const s of lineCells(d.last, q)) put(m, s.c, s.r, d.val);
            d.last = q;
        } else d.cur = q;
    });

    function endDrag() {
        const d = ed.drag;
        if (!d) return;
        ed.drag = null;
        if (d.kind === 'pencil') commit(d.before);
        else if (d.kind === 'shape') {
            const m = curMap();
            for (const s of shapeCells(d)) put(m, s.c, s.r, d.val);
            commit(d.before);
        } else if (d.kind === 'select') {
            ed.sel = { a: d.start, b: d.cur };
            const s = selRect();
            say('Selected ' + (s.c1 - s.c0 + 1) + 'x' + (s.r1 - s.r0 + 1) + '. Ctrl+C copies, Del clears.');
        }
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', () => { if (editing) { ed.hover = null; updateHover(null); } });

    // ---------- enter / leave / playtest ----------
    function enterEditor() {
        if (editing) return;
        buildUI();
        editing = true;
        testing = false;
        for (const k in keys) keys[k] = false;
        clearPressed();
        ed.idx = clamp(levelIdx, 0, levelKeys.length - 1);
        ed.drag = null; ed.hover = null; ed.sel = null;
        parts.length = 0; shake = 0; freeze = 0;
        ed.prevCursor = canvas.style.cursor;
        ed.prevTouch = canvas.style.touchAction;
        canvas.style.cursor = 'crosshair';
        canvas.style.touchAction = 'none';
        testbar.classList.remove('on');
        panel.classList.add('on');
        renderPanel();
        say('Editor on. Draw with the mouse, P to playtest, Esc to leave.');
    }

    function leaveEditorUI() {
        closeDlg();
        panel.classList.remove('on');
        canvas.style.cursor = ed.prevCursor;
        canvas.style.touchAction = ed.prevTouch;
    }

    function restartGameAt(i) {
        loadLevel(i);
        respawn();
        mode = 'in';
        trans = { t: 0, dur: 18, cx: spawn.x + 3, cy: spawn.y + 3, next: null };
        P.visible = true;
        parts.length = 0; shake = 0; freeze = 0;
        for (const k in keys) keys[k] = false;
        clearPressed();
    }

    function exitEditor() {
        if (!editing) return;
        editing = false;
        leaveEditorUI();
        saveDraft();
        restartGameAt(clamp(ed.idx, 0, levelKeys.length - 1));
    }

    function startTest() {
        const m = curMap();
        if (!m.some((row) => row.includes(5))) return say('Place a spawn point (key 5) before testing.');
        editing = false;
        testing = true;
        testDeaths = deaths;
        leaveEditorUI();
        document.getElementById('pe-testlabel').textContent = 'Level ' + (ed.idx + 1) + ': reach the goal to finish.';
        testbar.classList.add('on');
        restartGameAt(ed.idx);
    }

    function exitTest(cleared) {
        if (!testing) return;
        const d = deaths - testDeaths;
        deaths = testDeaths;
        testing = false;
        editing = true;
        testbar.classList.remove('on');
        panel.classList.add('on');
        canvas.style.cursor = 'crosshair';
        canvas.style.touchAction = 'none';
        parts.length = 0; shake = 0; freeze = 0;
        for (const k in keys) keys[k] = false;
        clearPressed();
        renderPanel();
        say((cleared ? 'Level cleared' : 'Back in the editor') + '. Deaths during test: ' + d + '.');
    }

    // ---------- editor drawing ----------
    function outline(x, y, w, h, c) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, 1);
        ctx.fillRect(x, y + h - 1, w, 1);
        ctx.fillRect(x, y, 1, h);
        ctx.fillRect(x + w - 1, y, 1, h);
    }

    function ants(x, y, w, h) {
        const phase = ed.frame >> 3;
        const px = (X, Y) => {
            ctx.fillStyle = ((X + Y + phase) & 1) ? PAL[7] : PAL[0];
            ctx.fillRect(X, Y, 1, 1);
        };
        for (let i = 0; i < w; i++) { px(x + i, y); px(x + i, y + h - 1); }
        for (let j = 0; j < h; j++) { px(x, y + j); px(x + w - 1, y + j); }
    }

    function drawTileOrErase(t, c, r, fr) {
        if (t === 0) { outline(c * TILE + 1, r * TILE + 1, 6, 6, PAL[8]); return; }
        drawTile(ctx, t, c * TILE, r * TILE, fr);
    }

    function editorDraw() {
        ed.frame++;
        const fr = Math.floor(ed.frame * 0.4);
        const m = curMap();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        rect(0, 0, 128, 128, PAL[0]);
        drawBackground(ctx, ed.frame);

        for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) drawTile(ctx, m[r][c], c * TILE, r * TILE, fr, m, r, c);

        if (ed.hit) {
            for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
                const hb = HIT[m[r][c]];
                if (hb) outline(c * TILE + hb[0], r * TILE + hb[1], hb[2], hb[3], PAL[10]);
            }
        }

        if (ed.grid) {
            ctx.fillStyle = 'rgba(255,241,232,0.13)';
            for (let i = 0; i < 16; i++) { ctx.fillRect(i * TILE, 0, 1, 128); ctx.fillRect(0, i * TILE, 128, 1); }
        }

        // previews
        const h = ed.hover, d = ed.drag;
        ctx.globalAlpha = 0.65;
        if (d && d.kind === 'shape') {
            for (const s of shapeCells(d)) drawTileOrErase(d.val, s.c, s.r, fr);
        } else if (!d && inb(h)) {
            if (ed.tool === 'stamp' && ed.clip) {
                for (let y = 0; y < ed.clip.length; y++) for (let x = 0; x < ed.clip[y].length; x++) {
                    if (h.c + x < 16 && h.r + y < 16) drawTileOrErase(ed.clip[y][x], h.c + x, h.r + y, fr);
                }
            } else if (['pencil', 'line', 'rect', 'frame', 'fill'].includes(ed.tool)) {
                drawTileOrErase(ed.tile, h.c, h.r, fr);
            }
        }
        ctx.globalAlpha = 1;

        // selection (live while dragging, or committed)
        let sr = null;
        if (d && d.kind === 'select') {
            sr = { c0: Math.min(d.start.c, d.cur.c), r0: Math.min(d.start.r, d.cur.r), c1: Math.max(d.start.c, d.cur.c), r1: Math.max(d.start.r, d.cur.r) };
        } else sr = selRect();
        if (sr) ants(sr.c0 * TILE, sr.r0 * TILE, (sr.c1 - sr.c0 + 1) * TILE, (sr.r1 - sr.r0 + 1) * TILE);

        if (inb(h)) outline(h.c * TILE, h.r * TILE, TILE, TILE, PAL[10]);
    }

    // ---------- keyboard: combo + editor shortcuts ----------
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
            enterEditor();
        }
    }

    function onEditorKey(e) {
        const k = e.key.toLowerCase();
        const typing = e.target && e.target.matches && e.target.matches('input, textarea, select');

        // a message box swallows the keyboard until it is answered
        if (dlg) {
            if (k === 'escape') { e.preventDefault(); closeDlg(); }
            return;
        }

        if (!editing && !testing) { if (!typing) comboCheck(e, k); return; }

        if (testing) {
            if (k === 'escape') { e.preventDefault(); exitTest(false); }
            return;
        }

        if (typing) { if (k === 'escape') e.target.blur(); return; }

        const mod = e.ctrlKey || e.metaKey;
        if (mod) {
            let handled = true;
            if (k === 'z') (e.shiftKey ? redo : undo)();
            else if (k === 'y') redo();
            else if (k === 'c') copySel(false);
            else if (k === 'x') copySel(true);
            else if (k === 'v') pasteClip();
            else if (k === 'a') { ed.sel = { a: { c: 0, r: 0 }, b: { c: 15, r: 15 } }; say('Selected the whole level.'); }
            else handled = false;
            if (handled) e.preventDefault();
            return;
        }
        if (e.altKey) return;

        const tool = TOOLS.find((t) => t.key === k);
        const gi = GROUPS.findIndex((g) => g.key === k);

        if (k === 'escape') {
            e.preventDefault();
            if (ed.drag) ed.drag = null;
            else if (ed.tool === 'stamp') setTool('pencil');
            else if (ed.sel) { ed.sel = null; say('Selection cleared.'); }
            else exitEditor();
        }
        else if (k === 'delete' || k === 'backspace') { e.preventDefault(); clearSel(); }
        else if (tool) { e.preventDefault(); setTool(tool.id); }
        else if (gi >= 0) { e.preventDefault(); if (GROUP_OF[ed.tile] === gi) cycleVariant(1); else pickGroup(gi); }
        else if (k === 'q') { e.preventDefault(); cycleVariant(-1); }
        else if (k === 'e') { e.preventDefault(); cycleVariant(1); }
        else if (k === 'g') { ed.grid = !ed.grid; renderPanel(); }
        else if (k === 'h') { ed.hit = !ed.hit; renderPanel(); }
        else if (k === 'p') { e.preventDefault(); startTest(); }
        else if (k === '[') gotoLevel(ed.idx - 1);
        else if (k === ']') gotoLevel(ed.idx + 1);
        else if (k.startsWith('arrow')) {
            e.preventDefault();
            if (e.shiftKey) shiftLevel(k === 'arrowleft' ? -1 : k === 'arrowright' ? 1 : 0, k === 'arrowup' ? -1 : k === 'arrowdown' ? 1 : 0);
        }
    }
    window.addEventListener('keydown', onEditorKey);
    window.openPlateformerEditor = enterEditor;   // handy for debugging from the console

    // ==========================================
    // 14. LOOP
    // ==========================================
    loadLevel(0);
    respawn();
    trans = { t: 0, dur: 18, cx: spawn.x + 10, cy: spawn.y + 10, next: null };

    let last = performance.now(), acc = 0;
    function frame(now) {
        if (editing) {
            last = now;
            acc = 0;
            editorDraw();
            requestAnimationFrame(frame);
            return;
        }
        acc += Math.min(now - last, 100);
        last = now;
        while (acc >= STEP && !editing) { update(); acc -= STEP; }
        if (editing) { requestAnimationFrame(frame); return; }
        draw();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};