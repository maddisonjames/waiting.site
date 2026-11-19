import './assets/physics.js';

/* ==========================================================================
   STYLE SYSTEM
   1. TOKENS   – every colour, size, font and timing lives here
   2. THEMES   – overrides of tokens (switch with StyleSystem.setTheme)
   3. WINDOWS  – one line per window: where it sits and how big it is
   4. CSS      – layered stylesheet generated from the above
   ========================================================================== */

/* ---------- 1. TOKENS ---------- */
const TOKENS = {
    color: {
        desk:        '#ffffff',   // page + loading cover
        surface:     '#c0c0c0',   // window / button face
        hi:          '#ffffff',   // bevel highlight
        lo:          '#808080',   // bevel shadow
        dark:        '#0a0a0a',   // bevel deep shadow
        titlebar:    '#000080',   // active title bar fades from this...
        titlebarEnd: '#1084d0',   // ...to this, the Windows 98 way
        titleText:   '#ffffff',
        titleInactive:     '#808080',   // title bars of windows in the background
        titleInactiveEnd:  '#b5b5b5',
        titleInactiveText: '#d4d0c8',
        warning:     '#ffd400',   // the "!" triangle in dialogs
        ink:         '#020202',   // text, clock hands
        clockFace:   '#f8f8f8',
        link:        '#192cd3',
        linkVisited: '#d31941',
        linkActive:  '#19d395',
        accent:      '#520909',
    },
    font: {
        ui:   'sans-serif',   // same as your original; change here to restyle all text
        mono: 'monospace',    // clock numbers
    },
    size: {
        text:  '24px',
        link:  '20px',
        title: '30px',
        bar:   '12px',
        clock: 'min(350px, 86vmin)',   // everything on the clock scales from this
    },
    space: { 1: '2px', 2: '4px', 3: '6px', 4: '8px', 5: '12px' },
    z:     { clock: 1, window: 2, falling: 850, button: 900, dialog: 950, cover: 1000 },   // windows stack from 3 upwards (desktop.js)
    motion: {
        pop:     'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        settle:  'cubic-bezier(0.25, 1, 0.3, 1)',
        popTime: '0.75s',
        fadeTime: '0.25s',
    },
};

/* ---------- 2. THEMES (overrides only) ---------- */
const THEMES = {
    classic: {},
    dark: {
        color: {
            desk: '#0d0d0d', surface: '#2b2b2b', hi: '#4a4a4a', lo: '#161616', dark: '#000000',
            titlebar: '#3a1d6e', titlebarEnd: '#7a4fc0', ink: '#e8e8e8', clockFace: '#1c1c1c',
            titleInactive: '#333333', titleInactiveEnd: '#4d4d4d', titleInactiveText: '#9a9a9a',
            link: '#7aa2ff', linkVisited: '#ff7a9a', linkActive: '#7affd0', accent: '#ff8a8a',
        },
    },
};

/* ---------- 3. WINDOW LAYOUT ----------
   x / y  : CSS position (use left|right and top|bottom)
   anchor : which part of the window sits on that position, [x%, y%]
   width  : max width in px (shrinks on small screens)                     */
const WINDOWS = {
    links:             { pos: { left: '50%',  top: '5%'     }, anchor: [-50, 0],   width: 350 },
    _notice:           { pos: { left: '50%',  bottom: '4%'  }, anchor: [-50, 0],   width: 350 },

    pico_core:  { pos: { left: '50%',  top: '50%'    }, anchor: [-50, -50], width: 520 },
    pico_details:{ pos: { left: '27.5%', top: '40%'  }, anchor: [-50, -50], width: 200 },

    mine_core:  { pos: { left: '50%',  top: '50%'    }, anchor: [-50, -50], width: 520 },
    mine_details:{ pos: { left: '27.5%', top: '40%'  }, anchor: [-50, -50], width: 200 },

    minesweeper_core:  { pos: { left: '50%',  top: '50%'    }, anchor: [-50, -50], width: 520 },
    maze_core:         { pos: { left: '50%',  top: '50%'    }, anchor: [-50, -50], width: 590 },
    maze_details:      { pos: { left: '27.5%', top: '40%'   }, anchor: [-50, -50], width: 200 },
    _games:            { pos: { right: '12px', top: '50%'   }, anchor: [0, -50],   width: 200, height: 'min(800px, calc(100dvh - 24px))' },
    updates:           { pos: { left: '50%',  top: '50%'    }, anchor: [-50, -50], width: 600, height: 'min(540px, calc(100dvh - 24px))' },
};

/* ---------- helpers ---------- */
const kebab = (s) => String(s).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

const flatten = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([key, val]) =>
        val !== null && typeof val === 'object'
            ? flatten(val, `${prefix}${kebab(key)}-`)
            : [[`--${prefix}${kebab(key)}`, val]]
    );

const declarations = (obj) => flatten(obj).map(([k, v]) => `${k}: ${v};`).join('\n    ');

const windowCss = () => Object.entries(WINDOWS).map(([name, w]) => `
    .win.${name} {
        ${Object.entries(w.pos).map(([k, v]) => `${k}: ${v};`).join(' ')}
        --tx: ${w.anchor[0]}%;
        --ty: ${w.anchor[1]}%;
        width: min(${w.width}px, calc(100vw - 16px));
        ${w.height ? `height: ${w.height};` : ''}
    }`).join('\n');

/* ---------- 4. STYLESHEET ---------- */
const buildCss = () => `
@layer reset, tokens, base, bevel, window, clock, desktop, effects;

@layer tokens {
    :root {
        ${declarations(TOKENS)}
    }
    ${Object.entries(THEMES).filter(([, t]) => Object.keys(t).length).map(([name, t]) => `
    :root[data-theme="${name}"] {
        ${declarations(t)}
    }`).join('\n')}
}

@layer reset {
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
    body { overflow: hidden; cursor: default; }
}

@layer base {
    body {
        background: var(--color-desk);
        color: var(--color-ink);
        font-family: var(--font-ui);
    }

    #_screen_cover {
        position: fixed;
        inset: 0;
        height: 100dvh;
        background: var(--color-desk);
        pointer-events: none;
        z-index: var(--z-cover);
    }

    #_version_title {
        position: fixed;
        bottom: 0;
        left: 10px;
        width: 200px;
        height: 48.75px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--size-link);
        font-weight: bold;
        opacity: 0.05;
        user-select: none;
    }

    a:focus-visible, button:focus-visible, .win-button:focus-visible {
        outline: 1px dotted var(--color-ink);
        outline-offset: 2px;
    }
}

/* Reusable Win95 bevels. Compose with: .bevel-out  .bevel-in */
@layer bevel {
    .bevel-out {
        border: 2px solid;
        border-color: var(--color-hi) var(--color-lo) var(--color-lo) var(--color-hi);
        box-shadow: inset 1px 1px var(--color-surface), inset -1px -1px var(--color-dark);
    }
    .bevel-in {
        border: 2px solid;
        border-color: var(--color-lo) var(--color-hi) var(--color-hi) var(--color-lo);
    }
}

@layer window {
    .win {
        position: fixed;
        padding: 3px;
        background: var(--color-surface);
        z-index: var(--z-window);
        user-select: none;

        --tx: -50%; --ty: -50%; --s: 0;
        transform: translate(var(--tx), var(--ty)) scale(var(--s));
        opacity: 0;
        pointer-events: none;
        transition:
            transform var(--motion-pop-time) var(--motion-pop),
            opacity var(--motion-fade-time) ease-in-out;
    }
    .win.open { --s: 1; opacity: 1; pointer-events: auto; }

    .win__title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 3px 5px;
        background: var(--color-titlebar);
        color: var(--color-title-text);
        font-size: var(--size-bar);
        font-weight: bold;
        cursor: default;
    }

    .win__controls { display: flex; gap: 2px; }

    .win__btn {
        display: grid;
        place-items: center;
        width: 18px;
        height: 16px;
        padding: 0;
        background: var(--color-surface);
        color: var(--color-ink);
        font: bold 14px/1 var(--font-ui);
        cursor: pointer;
        border: 1px solid;
        border-color: var(--color-hi) var(--color-lo) var(--color-lo) var(--color-hi);
    }
    .win__btn:active { border-color: var(--color-lo) var(--color-hi) var(--color-hi) var(--color-lo); }
    .win__btn--min { padding-bottom: 6px; }

    .win__body {
        position: relative;
        margin-top: 4px;
        padding: 6px;
        background: var(--color-surface);
        font-size: var(--size-text);
        font-weight: bold;
        display: flex;
        gap: 12px;
    }
    .win__body--col  { flex-direction: column; gap: 4px; }
    .win__body--row  { align-items: flex-start; }
    .win__body--short  { height: 65px; }
    .win__body--medium { height: 100px; padding: 8px; }
    .win__body--fill   { height: calc(100% - 25px); overflow-y: auto; }
    .win__body--screen { padding: 0; background: #000; }

    .screen-square { width: 100%; max-width: 512px; aspect-ratio: 1; }
    .screen-maze   { width: 100%; aspect-ratio: 575 / 475; }

    .screen-canvas {
        display: block;
        width: 100%;
        height: 100%;
        image-rendering: crisp-edges;
        image-rendering: pixelated;   /* last wins where supported */
    }

    .win-link {
        font-size: var(--size-link);
        font-weight: bold;
        text-decoration: underline;
        transition: color 0.2s ease;
        pointer-events: auto;
    }
    .win-link:link    { color: var(--color-link); }
    .win-link:visited { color: var(--color-link-visited); }
    .win-link:hover   { text-transform: uppercase; }
    .win-link:active  { color: var(--color-link-active); }

    .games-title { font-size: var(--size-title); color: var(--color-accent); }

    ${windowCss()}

    .win-button {
        position: fixed;
        right: 12px;
        bottom: 12px;
        width: 150px;
        height: 48.75px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface);
        cursor: pointer;
        z-index: var(--z-button);
        opacity: 0;
        pointer-events: none;
        transform: scale(0.75);
        transform-origin: bottom right;
        transition: transform 1s var(--motion-pop), opacity 0.5s ease-in-out;
    }
    .win-button.open { opacity: 1; transform: scale(1); pointer-events: auto; }
    .win-button:active {
        border-color: var(--color-lo) var(--color-hi) var(--color-hi) var(--color-lo);
        box-shadow: inset 1px 1px var(--color-dark), inset -1px -1px var(--color-surface);
        padding: 2px 0 0 2px;
    }
    #_refresh_txt { font-size: 38px; font-weight: bold; }

    .win-button.theme {
        left: 12px;
        bottom: 50px;

        width: 112.5px;
        height: 36.5625px;
    }
    #_theme_txt { font-size: 30px; font-weight: bold; }

    .win-button.updates-btn {
        left: 12px;
        bottom: 94px;
        width: 112.5px;
        height: 36.5625px;
        transform-origin: bottom left;
    }
    #_updates_txt { font-size: 24px; font-weight: bold; }
}

@layer clock {
    #_clock_base {
        --r: var(--size-clock);
        position: absolute;
        left: 50%;
        top: 50%;
        width: var(--r);
        height: var(--r);
        background: var(--color-clock-face);
        border: 6px solid var(--color-ink);
        border-radius: 50%;
        pointer-events: none;
        z-index: var(--z-clock);
        transform: translate(-50%, -50%);
        transition: transform 1.6s var(--motion-settle);
    }
    #_clock_base.lean { transform: translate(-50%, -47.5%) rotate(-3deg); }

    .number {
        position: absolute;
        left: 50%;
        top: 50%;
        padding: 12px;
        font-family: var(--font-mono);
        font-size: calc(var(--r) * 0.055);
        font-weight: bold;
        color: var(--color-ink);
        transform: translate(-50%, -50%) rotate(calc(var(--i) * 30deg)) translateY(calc(var(--r) * -0.443));
    }
    /* keep digits upright while the slot rotates around the dial */
    .number span {
        display: inline-block;
        pointer-events: none;
        transform: rotate(calc(var(--i) * -30deg));
    }
    .click-collapse { pointer-events: auto; cursor: pointer; }

    .hand {
        position: absolute;
        bottom: 50%;
        left: 50%;
        transform: translate(-50%, 0);
        transform-origin: bottom center;
        background: var(--color-ink);
        border-radius: 4px;
    }
    #hour-hand   { width: 8px; height: calc(var(--r) * 0.243); }
    #minute-hand { width: 6px; height: calc(var(--r) * 0.343); }
    #second-hand { width: 4px; height: calc(var(--r) * 0.4); }

    #center-pin {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 12px;
        height: 12px;
        background: var(--color-ink);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: pointer;
    }
}

/* window behaviour + desktop toys (driven by desktop.js) */
@layer desktop {
    .win__title {
        background: linear-gradient(90deg, var(--color-titlebar), var(--color-titlebar-end));
        touch-action: none;
    }
    .win.inactive .win__title {
        background: linear-gradient(90deg, var(--color-title-inactive), var(--color-title-inactive-end));
        color: var(--color-title-inactive-text);
    }
    .win__btn[aria-label="Close"] { margin-left: 2px; }
    .win.dragging { transition: none; }

    /* maximised: fill the screen, body stretches, game screens stay square and centred */
    .win.max {
        left: 8px !important; top: 8px !important; right: auto !important; bottom: auto !important;
        --tx: 0% !important; --ty: 0% !important;
        width: calc(100vw - 16px) !important;
        height: calc(100dvh - 16px) !important;
        display: flex; flex-direction: column;
    }
    .win.max .win__body { flex: 1; height: auto; min-height: 0; }
    .win.max .win__body--screen { justify-content: center; align-items: center; }
    .win.max .screen-square { width: min(100%, calc(100dvh - 60px)); max-width: none; }
    .win.max .screen-maze   { width: min(100%, calc((100dvh - 60px) * 575 / 475)); }

    /* minimised: rolled up to just the title bar */
    .win.rolled { height: auto !important; }
    .win.rolled .win__body { display: none; }

    /* Games.txt entries are buttons now */
    .game-name {
        font: inherit; color: inherit; text-align: left;
        background: none; border: 0; padding: 2px 6px; margin: 0;
        cursor: pointer;
    }
    .game-name::before { content: '▸ '; opacity: 0.5; }
    .game-name:hover, .game-name:focus-visible {
        background: var(--color-titlebar);
        color: var(--color-title-text);
        outline: 1px dotted var(--color-title-text);
        outline-offset: -3px;
    }
    .game-name:hover::before, .game-name:focus-visible::before { opacity: 1; }

    /* desktop selection box */
    .marquee {
        position: fixed;
        border: 1px dotted var(--color-ink);
        pointer-events: none;
        z-index: var(--z-window);
    }

    /* refresh button wiggles when it wants attention */
    .win-button.nudge { animation: nudge 0.6s ease-in-out; }

    /* confirm dialog */
    .dlg-shade { position: fixed; inset: 0; z-index: var(--z-dialog); }
    .dlg {
        position: fixed; left: 50%; top: 50%;
        width: min(340px, calc(100vw - 16px));
        padding: 3px;
        background: var(--color-surface);
        color: var(--color-ink);
        transform: translate(-50%, -50%);
        animation: dlg-pop var(--motion-pop-time) var(--motion-pop);
    }
    .dlg.flash .win__title { animation: title-flash 0.5s steps(1) 1; }
    .dlg__body { display: flex; gap: 14px; align-items: flex-start; padding: 16px 14px 6px; font-size: 14px; }
    .dlg__body p { margin: 0 0 6px; }
    .dlg__extra { opacity: 0.75; font-style: italic; }
    .dlg__icon {
        flex: none; width: 34px; height: 30px;
        display: grid; place-items: end center; padding-bottom: 1px;
        background: var(--color-warning); color: #000;
        font: bold 18px/1 var(--font-ui);
        clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }
    .dlg__btns { display: flex; justify-content: center; gap: 8px; padding: 8px 0 10px; }
    .dlg__btn {
        min-width: 75px; height: 23px; padding: 0 10px;
        font: 12px var(--font-ui); color: var(--color-ink);
        background: var(--color-surface); cursor: pointer;
        border: 2px solid; border-color: var(--color-hi) var(--color-lo) var(--color-lo) var(--color-hi);
        box-shadow: inset 1px 1px var(--color-surface), inset -1px -1px var(--color-dark);
        transition: transform 0.15s var(--motion-settle);
    }
    .dlg__btn.default { outline: 1px solid var(--color-dark); }
    .dlg__btn:active {
        border-color: var(--color-lo) var(--color-hi) var(--color-hi) var(--color-lo);
        box-shadow: inset 1px 1px var(--color-dark), inset -1px -1px var(--color-surface);
    }
    .dlg__btn:focus-visible { outline: 1px dotted var(--color-ink); outline-offset: -5px; }

    /* update log: updates.txt (driven by updates.js) */
    #_version_title { cursor: pointer; }
    .updates-btn .new-tag {
        display: none;
        position: absolute; top: -9px; right: -10px;
        padding: 1px 4px;
        background: var(--color-link-visited); color: #fff;
        font: bold 10px/1.2 var(--font-ui); letter-spacing: 0.5px;
        border: 1px solid var(--color-dark);
        animation: tag-blink 1.2s steps(1) infinite;
        pointer-events: none;
    }
    .updates-btn.has-new .new-tag { display: block; }

    .win__body--log {
        height: calc(100% - 25px);
        padding: 6px; gap: 6px;
        display: grid; grid-template-columns: 150px 1fr;
        font-size: 14px; font-weight: normal;
    }
    .log-list, .log-page {
        min-height: 0; overflow-y: auto;
        background: var(--color-clock-face);
        color: var(--color-ink);
        user-select: text;
    }
    .log-list { display: flex; flex-direction: column; padding: 2px; user-select: none; }
    .log-ver {
        display: flex; flex-direction: column; align-items: flex-start; gap: 1px;
        padding: 4px 6px; margin: 0;
        font: inherit; color: inherit; text-align: left;
        background: none; border: 0; cursor: pointer;
    }
    .log-ver__name { font-weight: bold; }
    .log-ver__date { font-size: 11px; opacity: 0.65; }
    .log-ver:hover { background: var(--color-surface); }
    .log-ver.sel { background: var(--color-titlebar); color: var(--color-title-text); }
    .log-ver.sel .log-ver__date { opacity: 0.85; }
    .log-ver:focus-visible { outline: 1px dotted currentColor; outline-offset: -3px; }

    .log-page { padding: 10px 14px 14px; line-height: 1.45; }
    .log-page:focus-visible { outline: 1px dotted var(--color-ink); outline-offset: -4px; }
    .log-page header { margin-bottom: 8px; }
    .log-page h2 { margin: 0; font-size: 20px; }
    .log-date { margin: 2px 0 0; font-size: 12px; opacity: 0.7; }
    .log-tag {
        display: inline-block; padding: 0 4px; margin-left: 2px;
        background: var(--color-link-visited); color: #fff;
        font-size: 10px; font-weight: bold; letter-spacing: 0.5px; vertical-align: 1px;
    }
    .log-page section { margin-top: 12px; }
    .log-page h3 {
        margin: 0 0 4px; padding-bottom: 2px;
        font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;
        color: var(--color-accent);
        border-bottom: 1px dotted var(--color-lo);
    }
    .log-page ul { margin: 0; padding-left: 18px; list-style: square; }
    .log-page ul ul { margin-top: 2px; list-style: circle; }
    .log-page li { margin: 2px 0; }

    /* Win98 scrollbars for the two panes */
    .log-list::-webkit-scrollbar, .log-page::-webkit-scrollbar { width: 16px; }
    .log-list::-webkit-scrollbar-track, .log-page::-webkit-scrollbar-track {
        background: repeating-conic-gradient(var(--color-surface) 0 25%, var(--color-hi) 0 50%) 0 0 / 2px 2px;
    }
    .log-list::-webkit-scrollbar-thumb, .log-page::-webkit-scrollbar-thumb {
        background: var(--color-surface);
        border: 2px solid; border-color: var(--color-hi) var(--color-lo) var(--color-lo) var(--color-hi);
        box-shadow: inset -1px -1px var(--color-dark);
    }

    /* narrow screens: versions become a row of tabs above the notes */
    @media (max-width: 560px) {
        .win__body--log { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
        .log-list { flex-direction: row; overflow-x: auto; overflow-y: hidden; }
        .log-ver { flex: none; }
        .win.updates { top: 8px; --ty: 0%; height: calc(100dvh - 150px); }   /* leave room for the corner buttons */
    }
}

@layer effects {
    @keyframes dlg-pop {
        from { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
        to   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
    }
    @keyframes title-flash {
        0%, 40%, 80% { filter: grayscale(1) brightness(1.4); }
        20%, 60%, 100% { filter: none; }
    }
    @keyframes tag-blink {
        0%, 70% { opacity: 1; }
        71%, 100% { opacity: 0.25; }
    }
    @keyframes nudge {
        0%, 100% { transform: scale(1) rotate(0); }
        20% { transform: scale(1.08) rotate(-4deg); }
        40% { transform: scale(1.08) rotate(4deg); }
        60% { transform: scale(1.04) rotate(-2deg); }
        80% { transform: scale(1.02) rotate(1deg); }
    }

    #_screen_cover.fade-out { animation: flashAndFade 0.5s ease-in-out forwards; }
    #_screen_cover.fade-in  { animation: fadeIn 0.5s ease-in-out forwards; }
    .screen-shake { animation: screen-shake 0.5s ease-in-out; }

    @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    @keyframes flashAndFade {
        0%   { opacity: 1; filter: brightness(1); }
        25%  { opacity: 1; filter: brightness(1.4); }
        100% { opacity: 0; filter: brightness(1); }
    }
    @keyframes screen-shake {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(-6px, 4px); }
        40% { transform: translate(6px, -4px); }
        60% { transform: translate(-4px, -6px); }
        80% { transform: translate(4px, 6px); }
    }

    @media (prefers-reduced-motion: reduce) {
        .screen-shake { animation: none; }
        .win, .win-button, #_clock_base { transition-duration: 0.01ms; }
        .dlg, .win-button.nudge, .dlg.flash .win__title, .updates-btn .new-tag { animation: none; }
    }
}
`;

/* ---------- inject (safe to run twice) ---------- */
let styleEl = document.getElementById('_style_system');
if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = '_style_system';
    document.head.appendChild(styleEl);
}
styleEl.textContent = buildCss();

/* ---------- runtime API ----------
   StyleSystem.setTheme('dark')                 switch theme (remembered)
   StyleSystem.setToken('color.accent', 'red')  tweak one token live
   Or visit the site with ?theme=dark                                      */
const root = document.documentElement;

const StyleSystem = {
    tokens: TOKENS,
    themes: Object.keys(THEMES),

    get theme() { 
        return root.dataset.theme || 'classic'; 
    },

    setTheme(name) {
        if (!THEMES[name]) {
            console.warn(`StyleSystem: unknown theme "${name}". Options: ${Object.keys(THEMES).join(', ')}`);
            return;
        }
        root.dataset.theme = name;
        try { localStorage.setItem('theme', name); } catch (e) { /* storage blocked */ }
    },

    // .js 2 now manages its own active state rotation
    toggleTheme() {
        const themeList = Object.keys(THEMES);
        const currentIndex = themeList.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % themeList.length;
        const nextTheme = themeList[nextIndex];
        
        this.setTheme(nextTheme);
        return nextTheme;
    },

    setToken(path, value) {
        const name = '--' + path.split('.').map(kebab).join('-');
        root.style.setProperty(name, value);
    },

    rebuild() { styleEl.textContent = buildCss(); },
};

let savedTheme = new URLSearchParams(location.search).get('theme');
if (!savedTheme) {
    try { savedTheme = localStorage.getItem('theme'); } catch (e) { /* ignore */ }
}
StyleSystem.setTheme(savedTheme in THEMES ? savedTheme : 'classic');

window.StyleSystem = StyleSystem;
export default StyleSystem;