import StyleSystem from './style.js';

console.log('// manager booted! //\n');

// ---------- assets ----------

const SFX_DIR = './assets/other/sfxs/';
const SFX = {
  boot: 'Windows Print complete.wav',
  reload: 'Windows Recycle.wav',
  youtube: 'Windows Battery Low.wav',
  kofi: 'Windows Battery Critical.wav',
  clockTap: 'Windows Navigation Start.wav',
  glass: 'glass_m1.ogg',
  collapse: 'Windows Startup.wav',
};
const DEFAULT_GAME_ICON = './assets/other/maze/smile.png';   // used by any game without its own icon
const WINDOWS_KEYS = ['Windows Default.wav', 'Windows Ding.wav', 'Windows Error.wav', 'Windows Exclamation.wav'];
const CS_KEYS = ['CS_EXCLA.WAV', 'CS_EMPTY.WAV', 'CS_ASTER.WAV', 'CS_DEFAU.WAV'];

const CLOCK_BREAK_CLICKS = 5;   // the clock breaks on the fifth tap of the centre pin

// ---------- state ----------

// set once something has "broken" the page (the clock fell, or a game took over). Only a reload clears it.
let isBroken = false;
let refreshing = false;
let clickCount = 0;

// ---------- helpers ----------

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const $ = (selector) => document.querySelector(selector);
const byId = (id) => document.getElementById(id);

function playSound(file, volume = 0.25, loop = false) {
  const sound = new Audio(file.startsWith('./') ? file : SFX_DIR + file);
  sound.loop = loop;
  sound.volume = volume;
  sound.play().catch(() => {}); // browsers may block audio before user interaction
  return sound;
}

function changeWebsiteIcon(newIconPath) {
  let iconLink = $("link[rel*='icon']");
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }
  iconLink.href = newIconPath;
}

function openRefresh() {
  const refreshContainer = $('.refresh');
  if (refreshContainer) refreshContainer.classList.add('open');
}

// shows the refresh button and gives it a wiggle ("press me!")
function nudgeRefresh() {
  const refreshContainer = $('.refresh');
  if (!refreshContainer) return;
  openRefresh();
  refreshContainer.classList.remove('nudge');
  void refreshContainer.offsetWidth;         // restart the animation
  refreshContainer.classList.add('nudge');
}

function hideClock() {
  const clockBase = byId('_clock_base');
  if (clockBase) clockBase.style.display = 'none';
}

// true when a key press is meant for a text field, not for the page
const isTyping = (event) => {
  const t = event.target;
  return !!t && (t.isContentEditable || (typeof t.matches === 'function' && t.matches('input, textarea, select')));
};

// Runs a JS file in the global scope
async function runExternalScript(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);
  const jsCode = await response.text();
  (0, eval)(jsCode); // indirect eval = global scope
}

// Fades an element from transparent to targetOpacity using a CSS transition
async function fadeIn(elementId, targetOpacity = 0.85, duration = 2.0) {
  const el = byId(elementId);
  if (!el) return;
  el.style.transition = 'none';
  el.style.opacity = '0';
  void el.offsetWidth;                       // commit the starting opacity before transitioning
  el.style.transition = `opacity ${duration}s ease-in-out`;
  el.classList.add('fade-in');
  el.style.opacity = String(targetOpacity);
  el.style.pointerEvents = 'auto';
  await sleep(duration);
}

// Starts a sound silently and raises it to `volume` over `duration` seconds. Returns the Audio object.
function playAudioWithFadeIn(file, duration = 2.0, steps = 20, loop = true, volume = 1) {
  const sound = playSound(file, 0, loop);
  const target = Math.min(1, Math.max(0, volume));
  (async () => {
    for (let k = 1; k <= steps; k++) {
      await sleep(duration / steps);
      sound.volume = target * (k / steps);
    }
  })();
  return sound;
}

// ---------- screen cover / reload ----------

async function hideScreenCover() {
  const cover = byId('_screen_cover');
  if (!cover) return;
  playSound(SFX.boot, 0.25);
  cover.classList.add('fade-out');
  await sleep(0.5);
}

async function revealScreenCover() {
  const cover = byId('_screen_cover');
  if (!cover) return;
  cover.classList.remove('fade-out');
  cover.classList.add('fade-in');
  await sleep(0.5);
}

async function reloadPage() {
  const refreshContainer = $('.refresh');
  if (!refreshContainer || !refreshContainer.classList.contains('open') || refreshing) return;
  refreshing = true;
  playSound(SFX.reload, 0.75);
  await revealScreenCover();
  await sleep(0.5);
  window.location.reload();
}

// ---------- theme / links ----------

function themeChange() {
  if (!$('.theme')) return;
  const nextTheme = StyleSystem.theme === 'dark' ? 'classic' : 'dark';
  console.log(`-- Theme changed to: ${nextTheme} --`);
  StyleSystem.setTheme(nextTheme);
}

const youtubeLink = () => playSound(SFX.youtube, 0.5);
const kofiLink = () => playSound(SFX.kofi, 0.5);

function followCursor(event) {
  const hitbox = byId('_cursor_box');
  if (!hitbox) return;
  hitbox.style.left = `${event.clientX}px`;
  hitbox.style.top = `${event.clientY}px`;
}

// ---------- hidden games ----------
// Typing a game's code anywhere on the page loads its script and opens its window.
// icon: the tab icon shown while that game is open (falls back to DEFAULT_GAME_ICON if left out).

const GAMES = [
  {
    code: 'maze', title: 'labyrinth', script: './js/games/labyrinth.js',
    icon: './assets/core/icons/smile.png',
    core: '.maze_core', details: '.maze_details', init: 'initMaze', keySfx: CS_KEYS,
  },
  {
    code: 'pico', title: 'pico', script: './js/games/pico.js',
    icon: './assets/core/icons/pico.png',
    core: '.pico_core', details: '.pico_details', init: 'initPlateformer', keySfx: WINDOWS_KEYS,
  },
  {
    code: 'mine', title: 'minesweeper', script: './js/games/minesweeper.js',
    icon: './assets/core/icons/mine.png',
    core: '.mine_core', details: null, init: 'initMinesweeper', keySfx: WINDOWS_KEYS,
  },
];
for (const game of GAMES) game.progress = 0;

async function launchGame(game) {
  const name = game.script.split('/').pop();
  try {
    await runExternalScript(game.script);
    console.log(`// '${name}' loaded! //`);
  } catch (e) {
    console.log(`// Failed to load '${name}'! Error: ${e} //`);
  }

  const core = $(game.core);
  const details = game.details ? $(game.details) : null;
  if (core) {
    await sleep(0.02);
    core.classList.add('open');
    if (details) details.classList.add('open');
  }

  if (typeof window[game.init] === 'function') window[game.init]();

  await sleep(0.85);
  hideClock();
}

async function triggerGame(game) {
  isBroken = true;
  document.title = game.title;
  changeWebsiteIcon(game.icon || DEFAULT_GAME_ICON);
  if ($('.refresh')) {
    await sleep(0.02);
    openRefresh();
  }
  await launchGame(game);
}

function checkGameCodes(event) {
  if (isBroken || event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTyping(event)) return;
  const char = event.key.toLowerCase();

  let loudest = null;                        // only one key sound per press, from the code that's furthest along
  for (const game of GAMES) {
    if (char === game.code[game.progress]) {
      game.progress++;
      if (!loudest || game.progress > loudest.progress) loudest = game;
    } else {
      game.progress = char === game.code[0] ? 1 : 0;
    }
  }
  if (!loudest) return;

  const sfx = loudest.keySfx[loudest.progress - 1];
  if (sfx) playSound(sfx, 0.25);

  if (loudest.progress === loudest.code.length) {
    for (const game of GAMES) game.progress = 0;
    triggerGame(loudest);
  }
}

// Clicking a game in Games.txt (desktop.js sends 'launch-game' with the game's code)
function onLaunchGame(event) {
  const game = GAMES.find((g) => g.code === event.detail);
  if (!game) return;
  if (isBroken) {                            // one surprise per visit: refresh first
    playSound('Windows Error.wav', 0.3);
    nudgeRefresh();
    return;
  }
  for (const g of GAMES) g.progress = 0;
  playSound(game.keySfx[game.keySfx.length - 1], 0.25);
  triggerGame(game);
}

// ---------- clock ----------

async function breakClock() {
  if (isBroken) return;
  playSound(SFX.clockTap, 0.65);
  clickCount++;
  if (clickCount < CLOCK_BREAK_CLICKS) return;

  isBroken = true;
  const clockBase = byId('_clock_base');
  const parts = ['hour-hand', 'minute-hand', 'second-hand', 'center-pin'].map(byId).filter(Boolean);

  document.body.classList.add('screen-shake');
  playSound(SFX.glass, 0.25);
  parts.forEach((el) => el.classList.add('fall'));

  await sleep(0.15);
  if (clockBase) clockBase.classList.add('lean');
  document.title = 'why did you do that for?';

  await sleep(1.0);
  document.body.classList.remove('screen-shake');

  await sleep(1.0);
  openRefresh();
  console.log('// uh oh //');
}

// keeps the clock centred in the window
function clockSystem() {
  if (isBroken) return;
  const clockBase = byId('_clock_base');
  if (!clockBase || clockBase.offsetWidth <= 0 || clockBase.offsetHeight <= 0) return;
  clockBase.style.position = 'absolute';
  clockBase.style.left = `${window.innerWidth / 2}px`;
  clockBase.style.top = `${window.innerHeight / 2}px`;
}

async function clockTicker() {
  const hands = {
    h: byId('hour-hand'),
    m: byId('minute-hand'),
    s: byId('second-hand'),
  };
  if (!hands.h || !hands.m || !hands.s) return;

  const pad = (n) => String(n).padStart(2, '0');
  const turn = (el, deg) => { el.style.transform = `translate(-50%, 0) rotate(${deg}deg)`; };

  while (!isBroken) {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();

    document.title = `${pad(h)}:${pad(m)}:${pad(s)}`;
    turn(hands.s, s * 6);
    turn(hands.m, m * 6 + s * 0.1);
    turn(hands.h, (h % 12) * 30 + m * 0.5);

    await sleep((1000 - now.getMilliseconds()) / 1000);   // wake right on the next second, so the clock never drifts
  }
}

// ---------- click collapse ----------

function collapse(event) {
  const el = event.target.closest('.click-collapse');
  if (el && !el.dataset.physicsStarted) {
    playSound(SFX.collapse, 0.65);
    el.classList.add('fall');
  }
}

// ---------- listeners ----------

function setupListeners() {
  // document.addEventListener('mousemove', followCursor);
  window.addEventListener('resize', clockSystem);
  document.addEventListener('keydown', checkGameCodes);
  document.addEventListener('launch-game', onLaunchGame);

  const clicks = {
    'center-pin': breakClock,
    '_refresh_txt': reloadPage,
    '_theme_txt': themeChange,
    '_youtube_link': youtubeLink,
    '_kofi_link': kofiLink,
  };
  for (const [id, handler] of Object.entries(clicks)) {
    const el = byId(id);
    if (el) el.addEventListener('click', handler);
  }

  document.body.addEventListener('click', collapse);
  console.log('// listeners activated //');
}

// ---------- start ----------

clockSystem();
clockTicker();
hideScreenCover();

if (document.readyState === 'complete') {
  console.log('// site pre-loaded //');
  setupListeners();
} else {
  window.addEventListener('load', setupListeners);
}