/* ==========================================================================
   UPDATES
   The update log: the "Updates" button opens updates.txt, which lists every
   version down the side and shows its notes on the right.

   To add a release: put a new entry at the TOP of CHANGELOG. That's it:
     - the version label in the corner updates itself
     - the Updates button gets a NEW tag until each visitor has read it

   Entry format:
     version:  '1.3'
     date:     '2026-12-01'   (or null while it's not out yet: shows "Latest")
     sections: [{ name: 'pico.exe', items: [ 'a line', { text: 'a line', sub: ['detail', 'detail'] } ] }]
   Wrap words in **double stars** to make them bold.
   ========================================================================== */

const STAGE = 'ALPHA';
const SEEN_KEY = 'updates_seen';

const CHANGELOG = [
    {
        version: '1.2',
        date: null,                                  // set to the upload date, e.g. '2026-11-20'
        sections: [
            {
                name: 'pico.exe',
                items: [
                    'Doubled from 10 levels to 20.',
                    'New hidden goals: some exits are invisible.',
                    'New fake goals: they throw a "COMPLETE!" screen at you, then the level carries on.',
                    'New look: drifting starfield, walls with lit edges, spikes with glowing tips.',
                    'More game feel: squash and stretch, landing and running dust, screen shake and freeze frames.',
                    'Diagonal dashes slide along walls instead of stopping dead.',
                    'You get nudged round corners and up small steps.',
                    'Press **R** to restart from the spawn.',
                    'New win screen with confetti; press jump to play again.',
                    'details.txt now shows your level as well as your deaths.',
                    {
                        text: 'New level editor (**Up, Up, Down, Down, X, Left**):',
                        sub: [
                            'Drawing tools, undo/redo, and copy and paste.',
                            'Add, duplicate and reorder levels.',
                            'Playtest straight from the editor.',
                            'Import and export levels; drafts save automatically.',
                        ],
                    },
                ],
            },
            {
                name: 'minesweeper.exe (new game: type "mine")',
                items: [
                    'Endless sectors that grow bigger and harder.',
                    'Special rules on a cycle: **Tremor** (mines move), **Wrap** (the edges join up) and **Timed**.',
                    'Your first click is always safe.',
                    'Pings count nearby mines; hidden gems recharge them.',
                    'Streak multiplier and bonuses for clearing fast or without pings.',
                    'Flags, question marks and chording.',
                    'Play with keyboard, mouse or touch.',
                    'Top 8 best runs are saved.',
                    'Chain-reaction explosions and a CRT screen look.',
                    'Cheat menu with the secret code.',
                ],
            },
            {
                name: 'Desktop',
                items: [
                    'New **Theme** button: switch between classic and dark, and the site remembers your pick.',
                    'New **Updates** button: you\'re reading it!',
                    'Drag windows around; the one you click comes to the front.',
                    'Windows 98 gradient title bars; background windows go grey.',
                    {
                        text: 'Title bar buttons work now:',
                        sub: [
                            '**_** rolls the window up.',
                            '**□** maximises it.',
                            '**×** asks if you\'re sure first. Sometimes "Yes" runs away.',
                        ],
                    },
                    'Clicking outside a dialog beeps and flashes it.',
                    'Drag on an empty part of the desktop for a selection box.',
                    'Click games in Games.txt instead of typing them.',
                    'Minesweeper added to the list.',
                    'Each game sets its own tab icon.',
                    'Trying to open a second game makes the refresh button wiggle.',
                    'The clock resizes to fit smaller screens.',
                ],
            },
            {
                name: 'Fixes',
                items: [
                    'Falling clock numbers and hands now drop in front of windows instead of behind them.',
                    'Falling clock hands no longer shrink or vanish.',
                    'The clock no longer drifts behind real time.',
                    'Game codes don\'t trigger while you\'re typing in a text box or using shortcuts.',
                    'Refresh and theme buttons work with Enter and Space.',
                    'The site no longer needs Python to load, so it starts faster.',
                ],
            },
        ],
    },
    {
        version: '1.1',
        date: '2026-11-15',
        sections: [
            {
                name: 'New',
                items: [
                    {
                        text: 'New **pico** platformer (type "pico"):',
                        sub: [
                            '10 levels with dashing and dash refill crystals.',
                            'Spikes and hazard blocks.',
                            'A death counter and a win screen.',
                        ],
                    },
                    'New **links.txt** with YouTube, Discord and Ko-fi, each with its own sound.',
                    'New **READ ME.txt** notice.',
                    'New **Games.txt** listing the games you can type.',
                    'Labyrinth now shows your hand, and the key you\'re holding.',
                    'Typing a game code plays a sound for each correct letter.',
                    'Windows sounds throughout: tapping the clock, breaking it, knocking numbers off, the loading screen and refreshing.',
                ],
            },
        ],
    },
    {
        version: '1.0',
        date: '2026-11-05',
        sections: [
            {
                name: 'New',
                items: [
                    {
                        text: 'New **labyrinth** (type "maze"):',
                        sub: [
                            'A 3D first-person maze that\'s different every time and grows with each level.',
                            'Keys and locked doors from level 3.',
                            'Find the smiley to escape.',
                            'Wall colours change each level.',
                        ],
                    },
                    'details window showing your level and map size.',
                    'Click clock numbers to knock them off.',
                    'The tab title shows the current time; breaking the clock changes it to "why did you do that for?".',
                    'A refresh button appears after something breaks.',
                    'Version label, tab icon and the site\'s own web address.',
                ],
            },
        ],
    },
    {
        version: 'First upload',
        date: '2026-10-15',
        sections: [
            {
                name: 'New',
                items: [
                    'A live clock in the middle of the screen.',
                    'Tap the centre pin 5 times and it breaks: the hands fall off and the clock tilts.',
                    'Loading screen that flashes and fades away.',
                ],
            },
        ],
    },
];

/* ---------- helpers ---------- */
const latest = CHANGELOG[0];
const isNumbered = (e) => /^\d/.test(e.version);
const fullName = (e) => (isNumbered(e) ? `Version ${e.version}` : e.version);

function fmtDate(d) {
    if (!d) return 'Latest';
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// appends text to el, turning **this** into bold (built from text nodes, never innerHTML)
function richText(el, s) {
    s.split('**').forEach((part, i) => {
        if (!part) return;
        if (i % 2) { const b = document.createElement('strong'); b.textContent = part; el.appendChild(b); }
        else el.appendChild(document.createTextNode(part));
    });
}

function list(items) {
    const ul = document.createElement('ul');
    for (const it of items) {
        const li = document.createElement('li');
        if (typeof it === 'string') richText(li, it);   // careful: strings have a built-in .sub(), so check the type first
        else {
            richText(li, it.text);
            if (Array.isArray(it.sub)) li.appendChild(list(it.sub));
        }
        ul.appendChild(li);
    }
    return ul;
}

function play(file, volume = 0.3) {
    try { const a = new Audio('./assets/other/sfxs/' + file); a.volume = volume; a.play().catch(() => {}); } catch (e) { /* no audio */ }
}

/* ---------- elements ---------- */
const win = document.querySelector('.win.updates');
const nav = win && win.querySelector('.log-list');
const page = win && win.querySelector('.log-page');
const button = document.getElementById('_updates_button');
const label = document.getElementById('_version_title');

// the corner label always matches the newest release
if (label && isNumbered(latest)) label.textContent = `${STAGE} : Version ${latest.version}`;

/* ---------- rendering ---------- */
let current = 0;

function show(i, focusList) {
    current = i;
    const e = CHANGELOG[i];
    nav.querySelectorAll('.log-ver').forEach((b, j) => {
        const on = j === i;
        b.classList.toggle('sel', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focusList) b.focus();
    });

    page.replaceChildren();
    const head = document.createElement('header');
    const h = document.createElement('h2');
    h.textContent = fullName(e);
    const meta = document.createElement('p');
    meta.className = 'log-date';
    meta.textContent = fmtDate(e.date);
    if (i === 0) {
        const tag = document.createElement('span');
        tag.className = 'log-tag';
        tag.textContent = 'NEW';
        meta.append(' ', tag);
    }
    head.append(h, meta);
    page.appendChild(head);

    for (const s of e.sections) {
        const sec = document.createElement('section');
        const h3 = document.createElement('h3');
        h3.textContent = s.name;
        sec.append(h3, list(s.items));
        page.appendChild(sec);
    }
    page.scrollTop = 0;
}

function buildNav() {
    nav.replaceChildren();
    CHANGELOG.forEach((e, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'log-ver';
        b.setAttribute('role', 'tab');
        const v = document.createElement('span');
        v.className = 'log-ver__name';
        v.textContent = isNumbered(e) ? 'v' + e.version : e.version;
        const d = document.createElement('span');
        d.className = 'log-ver__date';
        d.textContent = fmtDate(e.date);
        b.append(v, d);
        b.addEventListener('click', () => show(i));
        nav.appendChild(b);
    });

    // arrow keys / Home / End move through the versions
    nav.addEventListener('keydown', (e) => {
        const n = CHANGELOG.length;
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        let next = null;
        if (step) next = (current + step + n) % n;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        if (next === null) return;
        e.preventDefault();
        e.stopPropagation();                         // don't steer a game underneath
        show(next, true);
    });
}

/* ---------- "NEW" tag ---------- */
function seenLatest() {
    try { return localStorage.getItem(SEEN_KEY) === latest.version; } catch (e) { return true; }
}
function markSeen() {
    try { localStorage.setItem(SEEN_KEY, latest.version); } catch (e) { /* storage blocked */ }
    if (button) button.classList.remove('has-new');
}

/* ---------- open / close ---------- */
const isOpen = () => win.classList.contains('open');

function open() {
    if (!isOpen()) {
        win.classList.add('open');                   // desktop.js brings it to the front
        play('Windows Navigation Start.wav', 0.25);
        show(0);
    }
    markSeen();
}
function close() {
    win.classList.remove('open', 'max', 'rolled');
}
function toggle() { isOpen() ? close() : open(); }

/* ---------- start ---------- */
if (win && nav && page) {
    buildNav();
    show(0);

    if (button) {
        button.addEventListener('click', toggle);
        if (!seenLatest()) button.classList.add('has-new');
    }
    if (label) {
        label.addEventListener('click', open);       // the faint version label is a shortcut too
        label.title = 'Show updates';
    }

    // Esc closes the log while it's the window you're using
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !isOpen() || win.classList.contains('inactive')) return;
        if (document.querySelector('.dlg-shade')) return;
        close();
    });

    window.openUpdates = open;                       // handy for debugging from the console
}