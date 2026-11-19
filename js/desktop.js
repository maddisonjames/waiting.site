/* ==========================================================================
   DESKTOP
   Makes the windows behave like real ones and adds a few desktop toys:
     - drag windows by the title bar, click to bring to front (others go grey)
     - title buttons work:  _ rolls the window up   □ maximises   × asks, then closes
     - double-click a title bar to maximise / restore
     - drag on empty desktop for the dotted selection box
     - click a game in Games.txt to launch it (manager.js listens for 'launch-game')
     - windows with data-quiet-close skip the "are you sure?" dialog
   Styles for all of this live in style.js (@layer desktop).
   ========================================================================== */

const SFX_DIR = './assets/other/sfxs/';
const SND = {
    tick: 'Windows Navigation Start.wav',
    warn: 'Windows Exclamation.wav',
    close: 'Windows Recycle.wav',
    ding: 'Windows Ding.wav',
};

const QUIPS = [
    'It might have feelings.',
    'It worked really hard on being a window.',
    'Nothing bad will happen. Probably.',
    'This action cannot be undone (except by pressing refresh).',
    'Your computer will remember this.',
    'Are you REALLY sure though?',
];

/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (list) => list[(Math.random() * list.length) | 0];

function play(file, volume = 0.3) {
    try {
        const a = new Audio(SFX_DIR + file);
        a.volume = volume;
        a.play().catch(() => {});
    } catch (e) { /* no audio */ }
}

const allWins = () => [...document.querySelectorAll('.win')];
const winName = (w) => (w.querySelector('.win__title span') || {}).textContent || 'this window';
const openRefresh = () => { const r = document.querySelector('.refresh'); if (r) r.classList.add('open'); };

/* ---------- focus & stacking ---------- */
let stack = [];                                  // bottom -> top
function focusWin(w) {
    stack = stack.filter((x) => x !== w && x.isConnected);
    stack.push(w);
    stack.forEach((x, i) => { x.style.zIndex = String(3 + i); });
    allWins().forEach((x) => x.classList.toggle('inactive', x !== w));
}
function blurAll() { allWins().forEach((x) => x.classList.add('inactive')); }

/* ---------- dragging ---------- */
function makeDraggable(w) {
    const title = w.querySelector('.win__title');
    if (!title) return;

    title.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('button') || w.classList.contains('max')) return;
        const start = { x: e.clientX, y: e.clientY };
        let off = null;
        try { title.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

        const move = (ev) => {
            if (!off) {
                if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 4) return;   // a click, not a drag
                // switch from the layout's anchored position to plain pixels, without a jump
                const r = w.getBoundingClientRect();
                off = { x: start.x - r.left, y: start.y - r.top, w: r.width };
                w.classList.add('dragging');
                Object.assign(w.style, { left: r.left + 'px', top: r.top + 'px', right: 'auto', bottom: 'auto' });
                w.style.setProperty('--tx', '0%');
                w.style.setProperty('--ty', '0%');
            }
            w.style.left = clamp(ev.clientX - off.x, 48 - off.w, window.innerWidth - 48) + 'px';
            w.style.top = clamp(ev.clientY - off.y, 0, window.innerHeight - 24) + 'px';
        };
        const end = () => {
            title.removeEventListener('pointermove', move);
            title.removeEventListener('pointerup', end);
            title.removeEventListener('pointercancel', end);
            requestAnimationFrame(() => w.classList.remove('dragging'));
        };
        title.addEventListener('pointermove', move);
        title.addEventListener('pointerup', end);
        title.addEventListener('pointercancel', end);
    });

    title.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) toggleMax(w); });
}

// keep dragged windows reachable when the browser window shrinks
window.addEventListener('resize', () => {
    for (const w of allWins()) {
        if (!w.style.left || w.classList.contains('max')) continue;
        const r = w.getBoundingClientRect();
        w.style.left = clamp(r.left, 48 - r.width, window.innerWidth - 48) + 'px';
        w.style.top = clamp(r.top, 0, window.innerHeight - 24) + 'px';
    }
});

/* ---------- title buttons ---------- */
function setMaxButton(w, isMax) {
    const b = w.querySelector('.win__btn[aria-label="Maximise"], .win__btn[aria-label="Restore"]');
    if (!b) return;
    b.textContent = isMax ? '❐' : '□';
    b.setAttribute('aria-label', isMax ? 'Restore' : 'Maximise');
}
function toggleMax(w) {
    const on = !w.classList.contains('max');
    w.classList.remove('rolled');
    w.classList.toggle('max', on);
    setMaxButton(w, on);
    play(SND.tick, 0.25);
    window.dispatchEvent(new Event('resize'));   // lets canvases re-measure themselves
}
function toggleRoll(w) {
    if (w.classList.contains('max')) { w.classList.remove('max'); setMaxButton(w, false); }
    w.classList.toggle('rolled');
    play(SND.tick, 0.25);
}
async function closeWin(w) {
    // windows marked data-quiet-close (like updates.txt) just close: no dialog, no refresh needed
    if (w.hasAttribute('data-quiet-close')) {
        w.classList.remove('open', 'max', 'rolled');
        setMaxButton(w, false);
        play(SND.tick, 0.25);
        return;
    }
    const yes = await confirmBox({
        title: 'Confirm Window Close',
        text: `Are you sure you want to close '${winName(w).trim()}'?`,
        extra: pick(QUIPS),
    });
    if (!yes) return;
    w.classList.remove('open', 'max', 'rolled');
    setMaxButton(w, false);
    play(SND.close, 0.5);
    setTimeout(openRefresh, 400);                // refresh brings everything back
}

function wireButtons(w) {
    w.querySelectorAll('.win__btn').forEach((b) => {
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            const label = b.getAttribute('aria-label');
            if (label === 'Minimise') toggleRoll(w);
            else if (label === 'Maximise' || label === 'Restore') toggleMax(w);
            else if (label === 'Close') closeWin(w);
        });
    });
}

/* ---------- confirm dialog ---------- */
let dialogOpen = false;
function confirmBox({ title, text, extra }) {
    return new Promise((resolve) => {
        dialogOpen = true;
        play(SND.warn, 0.35);

        const shade = document.createElement('div');
        shade.className = 'dlg-shade';
        shade.innerHTML = `
<div class="dlg bevel-out" role="alertdialog" aria-modal="true" aria-labelledby="_dlg_title" aria-describedby="_dlg_text">
  <div class="win__title"><span id="_dlg_title"></span>
    <div class="win__controls"><button class="win__btn" type="button" aria-label="Close">×</button></div>
  </div>
  <div class="dlg__body">
    <div class="dlg__icon" aria-hidden="true">!</div>
    <div id="_dlg_text"><p class="dlg__text"></p><p class="dlg__extra"></p></div>
  </div>
  <div class="dlg__btns">
    <button class="dlg__btn default" type="button" data-v="1">Yes</button>
    <button class="dlg__btn" type="button" data-v="0">No</button>
  </div>
</div>`;
        shade.querySelector('#_dlg_title').textContent = title;
        shade.querySelector('.dlg__text').textContent = text;
        shade.querySelector('.dlg__extra').textContent = extra || '';
        document.body.appendChild(shade);

        const dlg = shade.querySelector('.dlg');
        const btns = [...shade.querySelectorAll('.dlg__btn')];
        const yesBtn = btns[0];
        const before = document.activeElement;

        const done = (v) => {
            document.removeEventListener('keydown', onKey, true);
            shade.remove();
            dialogOpen = false;
            if (before && before.focus) before.focus();
            resolve(v);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); }
            else if (e.key === 'Tab') {               // keep focus inside the dialog
                e.preventDefault();
                const i = btns.indexOf(document.activeElement);
                btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
            } else if (e.key !== 'Enter' && e.key !== ' ') {
                e.stopPropagation();                  // don't let typing reach the games underneath
            }
        };
        document.addEventListener('keydown', onKey, true);

        btns.forEach((b) => b.addEventListener('click', () => done(b.dataset.v === '1')));
        shade.querySelector('.win__btn').addEventListener('click', () => done(false));

        // clicking outside a modal dialog: beep and flash its title, just like the real thing
        shade.addEventListener('pointerdown', (e) => {
            if (dlg.contains(e.target)) return;
            play(SND.ding, 0.3);
            dlg.classList.remove('flash'); void dlg.offsetWidth; dlg.classList.add('flash');
        });

        // now and then, "Yes" gets shy and scoots away from the mouse (once)
        if (Math.random() < 0.35) {
            const dodge = (e) => {
                if (e.pointerType !== 'mouse') return;
                yesBtn.removeEventListener('pointerenter', dodge);
                const dx = (Math.random() < 0.5 ? -1 : 1) * (50 + Math.random() * 40);
                const dy = (Math.random() - 0.5) * 30;
                yesBtn.style.transform = `translate(${dx}px, ${dy}px)`;
                play(SND.tick, 0.2);
            };
            yesBtn.addEventListener('pointerenter', dodge);
        }

        yesBtn.focus();
    });
}

/* ---------- desktop selection box ---------- */
document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType !== 'mouse') return;
    if (e.target !== document.body && e.target !== document.documentElement) return;
    blurAll();
    const x0 = e.clientX, y0 = e.clientY;
    const box = document.createElement('div');
    box.className = 'marquee';
    document.body.appendChild(box);
    const move = (ev) => {
        Object.assign(box.style, {
            left: Math.min(x0, ev.clientX) + 'px', top: Math.min(y0, ev.clientY) + 'px',
            width: Math.abs(ev.clientX - x0) + 'px', height: Math.abs(ev.clientY - y0) + 'px',
        });
    };
    const end = () => {
        box.remove();
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
});

/* ---------- keyboard for the div "buttons" (refresh, theme) ---------- */
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const b = e.target.closest && e.target.closest('.win-button[role="button"]');
    if (!b) return;
    e.preventDefault();
    (b.querySelector('span') || b).click();       // manager.js listens on the inner span
});

/* ---------- clickable game list ---------- */
document.querySelectorAll('.game-name[data-game]').forEach((b) => {
    b.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('launch-game', { detail: b.dataset.game }));
    });
});

/* ---------- start ---------- */
for (const w of allWins()) {
    makeDraggable(w);
    wireButtons(w);
    w.addEventListener('pointerdown', () => focusWin(w));
}

// a window that opens (e.g. a game) jumps to the front
const opened = new WeakMap();
const watcher = new MutationObserver((records) => {
    for (const r of records) {
        const w = r.target, isOpen = w.classList.contains('open');
        if (isOpen && !opened.get(w)) focusWin(w);
        opened.set(w, isOpen);
    }
});
for (const w of allWins()) {
    opened.set(w, w.classList.contains('open'));
    watcher.observe(w, { attributes: true, attributeFilter: ['class'] });
}

console.log('// desktop ready //');