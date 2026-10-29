/* ============================================================
   Blessed Winds — Full App (Firebase multiplayer)
   ============================================================ */

/* ---------- FIREBASE CONFIG — paste yours from Firebase Console ---------- */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBFc3CjKTWr8XJKW94EP2QlcwGS-BNQXjk",
  authDomain: "winds-51d1b.firebaseapp.com",
  databaseURL: "https://winds-51d1b-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "winds-51d1b",
  storageBucket: "winds-51d1b.firebasestorage.app",
  messagingSenderId: "674754333013",
  appId: "1:674754333013:web:f1e35da432d9900d90c7dc",
  measurementId: "G-RT2SBWGES1"
};
/* ----------------------------------------------------------------------- */

const STORAGE_KEY = 'blessed_winds_v2';
const AVATARS = ['🍃', '🌬️', '🌪️', '☁️', '🦅', '🦋', '✨', '🌊', '⭐', '🔥'];

let firebaseReady = false;
let db = null;
let auth = null;
let roomsRef = null;
let currentRoomRef = null;
let roomPlayersUnsub = null;
let roomChatUnsub = null;
let roomsListUnsub = null;

const TITLES = [
  { min: 1, name: 'Wind Novice' },
  { min: 3, name: 'Breeze Apprentice' },
  { min: 6, name: 'Gust Rider' },
  { min: 10, name: 'Wind Guardian' },
  { min: 15, name: 'Storm Caller' },
  { min: 25, name: 'Blessed Master' }
];

const BADGES = [
  { id: 'first_win', icon: '🏆', name: 'First Win', desc: 'Win any game' },
  { id: 'online', icon: '🌐', name: 'Online Pilot', desc: 'Play an online match' },
  { id: 'shopper', icon: '🛒', name: 'Shopper', desc: 'Buy any item' },
  { id: 'daily', icon: '☀️', name: 'Daily Devotee', desc: 'Claim daily reward' },
  { id: 'level5', icon: '⭐', name: 'Rising Star', desc: 'Reach level 5' },
  { id: 'rich', icon: '💰', name: 'Wind Tycoon', desc: 'Hold 500+ Winds' }
];

const SOLO_GAMES = [
  { id: 'memory', name: 'Wind Memory', icon: '🧠', desc: 'Match pairs of wind symbols. Train your mind.', reward: '10–25', xp: 20 },
  { id: 'spin', name: 'Blessed Spin', icon: '🎡', desc: 'Spin the sacred wheel. Luck decides your Winds!', reward: '0–50', xp: 10 },
  { id: 'sequence', name: 'Wind Sequence', icon: '🔢', desc: 'Remember and repeat the glowing sequence.', reward: '12–28', xp: 18 },
  { id: 'dodge', name: 'Storm Dodge', icon: '⛈️', desc: 'Dodge incoming gusts for as long as you can.', reward: '10–35', xp: 22 }
];

const SHOP_ITEMS = [
  { id: 'boost_xp', name: 'XP Boost', icon: '📈', cat: 'boosts', price: 40, desc: '+50% XP for next 5 games' },
  { id: 'boost_wind', name: 'Wind Magnet', icon: '🧲', cat: 'boosts', price: 55, desc: '+20% Winds from games for 1 hour' },
  { id: 'skin_gold', name: 'Golden Leaf', icon: '🥇', cat: 'cosmetics', price: 80, desc: 'Golden avatar border' },
  { id: 'skin_storm', name: 'Storm Aura', icon: '⚡', cat: 'cosmetics', price: 120, desc: 'Electric particle trail' },
  { id: 'pack_starter', name: 'Starter Pack', icon: '🎁', cat: 'packs', price: 30, desc: '100 Winds + random badge' },
  { id: 'pack_pro', name: 'Pro Pack', icon: '💎', cat: 'packs', price: 150, desc: '300 Winds + XP Boost + Golden Leaf' },
  { id: 'title_custom', name: 'Custom Title', icon: '📜', cat: 'cosmetics', price: 200, desc: 'Unlock a custom profile title' },
  { id: 'boost_double', name: 'Double Claim', icon: '🔄', cat: 'boosts', price: 70, desc: 'Claim daily reward twice today' }
];

const FAQ = [
  { q: 'What are Winds?', a: 'Winds are the in-game currency. Earn them by playing solo or online games, claiming the daily reward, and completing challenges.' },
  { q: 'Is progress saved?', a: 'Yes. Everything is stored in your browser’s localStorage. Clearing site data will reset your account on this device.' },
  { q: 'How does online work?', a: 'Online Color Spin: bet Winds on Green, Red or Blue. More bets on a color grow that slice of the wheel. When it spins, winners who picked the landing color split the full pot by their bet size.' },
  { q: 'Can I play on mobile?', a: 'Absolutely. The site is fully responsive. Touch works great for games and the lobby.' },
  { q: 'Do I need an account?', a: 'Sign up with email for a permanent name, or continue as Guest (anonymous). Progress (Winds, XP) is still saved in your browser.' },
  { q: 'How do I get more Winds fast?', a: 'Play solo games often, join online rooms, claim the daily +50, and buy value packs in the shop when you have enough.' }
];

/* ---------- State ---------- */
let state = {
  winds: 100,
  xp: 0,
  level: 1,
  gamesPlayed: 0,
  wins: 0,
  onlineMatches: 0,
  totalWindsEarned: 100,
  badges: [],
  owned: [],
  dailyClaimed: null,
  user: null, // { username, avatar }
  soundOn: true,
  currentRoom: null,
  rooms: [],
  activeBoosts: {}
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...state, ...saved };
    }
  } catch (e) {}
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    winds: state.winds,
    xp: state.xp,
    level: state.level,
    gamesPlayed: state.gamesPlayed,
    wins: state.wins,
    onlineMatches: state.onlineMatches,
    totalWindsEarned: state.totalWindsEarned,
    badges: state.badges,
    owned: state.owned,
    dailyClaimed: state.dailyClaimed,
    user: state.user,
    soundOn: state.soundOn,
    activeBoosts: state.activeBoosts
  }));
}

/* ---------- Sound (Web Audio API) ---------- */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration = 0.12, type = 'sine', gain = 0.08) {
  if (!state.soundOn) return;
  try {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  click: () => playTone(520, 0.06, 'sine', 0.05),
  success: () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.12), 80); setTimeout(() => playTone(784, 0.15), 160); },
  earn: () => { playTone(440, 0.08); setTimeout(() => playTone(660, 0.12), 70); },
  buy: () => { playTone(392, 0.1, 'triangle'); setTimeout(() => playTone(523, 0.15, 'triangle'), 90); },
  error: () => playTone(180, 0.2, 'sawtooth', 0.06),
  win: () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.1), 100); setTimeout(() => playTone(784, 0.1), 200); setTimeout(() => playTone(1046, 0.25), 300); },
  level: () => { playTone(440, 0.12); setTimeout(() => playTone(554, 0.12), 100); setTimeout(() => playTone(659, 0.12), 200); setTimeout(() => playTone(880, 0.3), 320); },
  spin: () => playTone(300 + Math.random() * 200, 0.05, 'square', 0.04),
  join: () => playTone(600, 0.15, 'sine', 0.07),
  chat: () => playTone(480, 0.04, 'sine', 0.03)
};

/* ---------- Helpers ---------- */

function $(id) { return document.getElementById(id); }
function on(id, evt, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(evt, fn);
}

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function xpForLevel(lv) {
  return 100 + (lv - 1) * 50;
}

function titleForLevel(lv) {
  let t = TITLES[0].name;
  for (const item of TITLES) {
    if (lv >= item.min) t = item.name;
  }
  return t;
}

function addWinds(n, reason) {
  let amount = n;
  if (state.activeBoosts.windMagnet && Date.now() < state.activeBoosts.windMagnet) {
    amount = Math.floor(n * 1.2);
  }
  state.winds += amount;
  state.totalWindsEarned += amount;
  updateUI();
  save();
  SFX.earn();
  toast(`+${amount} 🍃 ${reason || ''}`, 'success');
  checkBadges();
}

function addXP(n) {
  let amount = n;
  if (state.activeBoosts.xpBoost && state.activeBoosts.xpBoost > 0) {
    amount = Math.floor(n * 1.5);
    state.activeBoosts.xpBoost--;
  }
  state.xp += amount;
  let leveled = false;
  while (state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level++;
    leveled = true;
  }
  updateUI();
  save();
  if (leveled) {
    SFX.level();
    toast(`Level up! You are now level ${state.level}`, 'gold');
  }
  checkBadges();
}

function checkBadges() {
  const unlock = (id) => {
    if (!state.badges.includes(id)) {
      state.badges.push(id);
      const b = BADGES.find(x => x.id === id);
      toast(`Badge unlocked: ${b.icon} ${b.name}`, 'gold');
      SFX.success();
      save();
    }
  };
  if (state.wins >= 1) unlock('first_win');
  if (state.onlineMatches >= 1) unlock('online');
  if (state.owned.length >= 1) unlock('shopper');
  if (state.dailyClaimed) unlock('daily');
  if (state.level >= 5) unlock('level5');
  if (state.winds >= 500) unlock('rich');
}

function requireAuth(action) {
  if (!state.user) {
    openAuth();
    toast('Login required for this action', 'error');
    return false;
  }
  return true;
}

/* ---------- UI Update ---------- */
function updateUI() {
  const _wc = document.getElementById('windsCount'); if (_wc) _wc.textContent = state.winds;
  const _sb = document.getElementById('soundBtn');
  if (_sb) { _sb.textContent = state.soundOn ? '🔊' : '🔇'; _sb.classList.toggle('muted', !state.soundOn); }

  const authBtn = document.getElementById('authBtn');
  if (authBtn) authBtn.textContent = state.user ? state.user.username : 'Login';

  // Profile (only on profile page)
  const guest = document.getElementById('profileGuest');
  const logged = document.getElementById('profileLogged');
  if (guest && logged && state.user) {
    guest.classList.add('hidden');
    logged.classList.remove('hidden');
    document.getElementById('userAvatar').textContent = state.user.avatar || '🍃';
    document.getElementById('userName').textContent = state.user.username;
    document.getElementById('userTitle').textContent = titleForLevel(state.level);
    document.getElementById('userLevel').textContent = state.level;
    const need = xpForLevel(state.level);
    document.getElementById('xpText').textContent = `${state.xp} / ${need} XP`;
    document.getElementById('xpBar').style.width = `${Math.min(100, (state.xp / need) * 100)}%`;
    document.getElementById('pGames').textContent = state.gamesPlayed;
    document.getElementById('pWins').textContent = state.wins;
    document.getElementById('pOnline').textContent = state.onlineMatches;
    document.getElementById('pWinds').textContent = state.totalWindsEarned;

    const today = new Date().toDateString();
    const dailyBtn = document.getElementById('dailyClaimBtn');
    if (state.dailyClaimed === today) {
      dailyBtn.disabled = true;
      dailyBtn.textContent = 'Daily claimed ✓';
    } else {
      dailyBtn.disabled = false;
      dailyBtn.textContent = 'Claim Daily +50 🍃';
    }

    const badgesEl = document.getElementById('badgesList');
    badgesEl.innerHTML = BADGES.map(b => {
      const has = state.badges.includes(b.id);
      return `<div class="badge ${has ? '' : 'locked'}" title="${b.desc}">${b.icon} ${b.name}</div>`;
    }).join('');
  } else if (guest && logged) {
    guest.classList.remove('hidden');
    logged.classList.add('hidden');
  }

  // Shop owned state
  renderShop(document.querySelector('.shop-filters .chip.active')?.dataset.shop || 'all');
}

/* ---------- Particles ---------- */
function spawnParticles() {
  const box = document.getElementById('particles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = 8 + Math.random() * 14 + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    p.style.width = p.style.height = 2 + Math.random() * 4 + 'px';
    box.appendChild(p);
  }
}

/* ---------- Solo Games ---------- */
function renderGames() {
  const grid = document.getElementById('gamesGrid');
  grid.innerHTML = SOLO_GAMES.map(g => `
    <div class="game-card" data-id="${g.id}">
      <div class="game-icon">${g.icon}</div>
      <h3>${g.name}</h3>
      <p>${g.desc}</p>
      <div class="game-meta">
        <span class="game-reward">+${g.reward} 🍃</span>
        <span>${g.xp} XP</span>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      SFX.click();
      openSoloGame(card.dataset.id);
    });
  });
}

function openSoloGame(id) {
  const game = SOLO_GAMES.find(g => g.id === id);
  if (!game) return;
  const modal = document.getElementById('gameModal');
  document.getElementById('gameTitle').textContent = game.name;
  const content = document.getElementById('gameContent');
  content.innerHTML = '';
  modal.classList.remove('hidden');

  if (id === 'memory') playMemory(content, game);
  else if (id === 'spin') playSpin(content, game);
  else if (id === 'sequence') playSequence(content, game);
  else if (id === 'dodge') playDodge(content, game);
}

function closeGameModal() {
  document.getElementById('gameModal').classList.add('hidden');
  document.getElementById('gameContent').innerHTML = '';
}

function endSolo(game, score, won) {
  state.gamesPlayed++;
  if (won) state.wins++;
  const winds = Math.max(0, Math.floor(score));
  addWinds(winds, `from ${game.name}`);
  addXP(game.xp);
  save();
  updateUI();
}

/* Memory */
function playMemory(el, game) {
  const symbols = ['🍃', '🌬️', '☁️', '⭐', '🦋', '🌊', '🔥', '💎'];
  const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  let flipped = [], matched = 0, moves = 0, lock = false;
  el.innerHTML = `
    <div class="solo-game">
      <div class="score-row"><span>Moves: <strong id="mMoves">0</strong></span><span>Matched: <strong id="mMatch">0</strong>/8</span></div>
      <div class="memory-grid" id="memGrid"></div>
    </div>`;
  const grid = document.getElementById('memGrid');
  cards.forEach((sym, i) => {
    const c = document.createElement('div');
    c.className = 'memory-card';
    c.dataset.sym = sym;
    c.dataset.i = i;
    c.textContent = '?';
    c.addEventListener('click', () => {
      if (lock || c.classList.contains('flipped') || c.classList.contains('matched')) return;
      SFX.click();
      c.classList.add('flipped');
      c.textContent = sym;
      flipped.push(c);
      if (flipped.length === 2) {
        moves++;
        document.getElementById('mMoves').textContent = moves;
        lock = true;
        if (flipped[0].dataset.sym === flipped[1].dataset.sym) {
          flipped.forEach(x => x.classList.add('matched'));
          matched++;
          document.getElementById('mMatch').textContent = matched;
          SFX.success();
          flipped = [];
          lock = false;
          if (matched === 8) {
            const winds = Math.max(8, 30 - moves);
            endSolo(game, winds, true);
            el.innerHTML += `<p style="margin-top:1rem">Done in ${moves} moves!</p><button class="btn btn-primary" onclick="closeGameModal()">Close</button>`;
          }
        } else {
          setTimeout(() => {
            flipped.forEach(x => { x.classList.remove('flipped'); x.textContent = '?'; });
            flipped = [];
            lock = false;
          }, 700);
        }
      }
    });
    grid.appendChild(c);
  });
}

/* Spin */
function playSpin(el, game) {
  const prizes = [5, 10, 0, 25, 15, 50];
  let spun = false;
  el.innerHTML = `
    <div class="solo-game">
      <div style="position:relative;display:inline-block">
        <div class="spin-pointer">▼</div>
        <div class="spin-wheel" id="wheel">
          <div class="spin-center">SPIN</div>
        </div>
      </div>
      <button class="btn btn-primary" id="spinBtn">Spin the Wheel</button>
      <p id="spinResult" style="margin-top:1rem;min-height:1.5em"></p>
    </div>`;
  document.getElementById('spinBtn').addEventListener('click', () => {
    if (spun) return;
    spun = true;
    const btn = document.getElementById('spinBtn');
    btn.disabled = true;
    const idx = Math.floor(Math.random() * 6);
    const deg = 1440 + idx * 60 + 30;
    const wheel = document.getElementById('wheel');
    wheel.style.transform = `rotate(${deg}deg)`;
    const interval = setInterval(() => SFX.spin(), 120);
    setTimeout(() => {
      clearInterval(interval);
      const prize = prizes[idx];
      document.getElementById('spinResult').textContent = prize > 0 ? `You won ${prize} 🍃!` : 'Better luck next time…';
      endSolo(game, prize, prize > 0);
      if (prize > 0) SFX.win();
      else SFX.error();
      setTimeout(() => {
        el.innerHTML += `<button class="btn btn-primary" onclick="closeGameModal()">Close</button>`;
      }, 400);
    }, 4200);
  });
}

/* Sequence */
function playSequence(el, game) {
  const colors = ['#2dd4bf', '#60a5fa', '#a78bfa', '#fbbf24'];
  let sequence = [], player = [], level = 0, playing = false;
  el.innerHTML = `
    <div class="solo-game">
      <p style="margin-bottom:1rem">Level: <strong id="seqLv">0</strong></p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;max-width:200px;margin:0 auto 1rem">
        ${colors.map((c, i) => `<button class="seq-btn" data-i="${i}" style="height:70px;border-radius:12px;border:none;background:${c};opacity:0.5;cursor:pointer"></button>`).join('')}
      </div>
      <button class="btn btn-primary" id="seqStart">Start</button>
      <p id="seqMsg" style="margin-top:0.75rem;min-height:1.4em"></p>
    </div>`;
  const btns = el.querySelectorAll('.seq-btn');
  const flash = (i) => {
    btns[i].style.opacity = '1';
    SFX.click();
    setTimeout(() => btns[i].style.opacity = '0.5', 350);
  };
  const playSeq = async () => {
    playing = true;
    document.getElementById('seqMsg').textContent = 'Watch…';
    for (const i of sequence) {
      await new Promise(r => setTimeout(r, 500));
      flash(i);
    }
    playing = false;
    player = [];
    document.getElementById('seqMsg').textContent = 'Your turn!';
  };
  document.getElementById('seqStart').addEventListener('click', () => {
    document.getElementById('seqStart').style.display = 'none';
    sequence = [];
    level = 0;
    next();
  });
  function next() {
    level++;
    document.getElementById('seqLv').textContent = level;
    sequence.push(Math.floor(Math.random() * 4));
    playSeq();
  }
  btns.forEach(b => {
    b.addEventListener('click', () => {
      if (playing) return;
      const i = +b.dataset.i;
      flash(i);
      player.push(i);
      if (player[player.length - 1] !== sequence[player.length - 1]) {
        document.getElementById('seqMsg').textContent = `Game over at level ${level}`;
        endSolo(game, level * 4, level >= 4);
        el.innerHTML += `<button class="btn btn-primary" onclick="closeGameModal()">Close</button>`;
        return;
      }
      if (player.length === sequence.length) {
        if (level >= 8) {
          document.getElementById('seqMsg').textContent = 'Amazing!';
          endSolo(game, 28, true);
          el.innerHTML += `<button class="btn btn-primary" onclick="closeGameModal()">Close</button>`;
        } else {
          setTimeout(next, 600);
        }
      }
    });
  });
}

/* Dodge */
function playDodge(el, game) {
  let score = 0, running = true, playerX = 50;
  el.innerHTML = `
    <div class="solo-game">
      <div class="score-row"><span>Survived: <strong id="dScore">0</strong>s</span></div>
      <div id="dodgeArea" style="position:relative;height:200px;background:var(--bg);border-radius:12px;overflow:hidden;cursor:none">
        <div id="dodgePlayer" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:1.8rem;transition:left 0.05s">🍃</div>
      </div>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem">Move mouse / touch to dodge!</p>
    </div>`;
  const area = document.getElementById('dodgeArea');
  const player = document.getElementById('dodgePlayer');
  const move = (clientX) => {
    const rect = area.getBoundingClientRect();
    playerX = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
    player.style.left = playerX + '%';
  };
  area.addEventListener('mousemove', e => move(e.clientX));
  area.addEventListener('touchmove', e => { e.preventDefault(); move(e.touches[0].clientX); }, { passive: false });

  const scoreTimer = setInterval(() => {
    if (!running) return;
    score++;
    document.getElementById('dScore').textContent = score;
  }, 1000);

  const spawn = () => {
    if (!running) return;
    const obs = document.createElement('div');
    obs.textContent = '💨';
    obs.style.cssText = `position:absolute;top:-30px;left:${10 + Math.random() * 80}%;font-size:1.5rem;transition:top 1.2s linear`;
    area.appendChild(obs);
    requestAnimationFrame(() => { obs.style.top = '220px'; });
    setTimeout(() => {
      const ox = parseFloat(obs.style.left);
      if (Math.abs(ox - playerX) < 12 && running) {
        running = false;
        clearInterval(scoreTimer);
        SFX.error();
        endSolo(game, score * 2, score >= 8);
        el.innerHTML += `<p style="margin-top:1rem">Survived ${score}s!</p><button class="btn btn-primary" onclick="closeGameModal()">Close</button>`;
      }
      obs.remove();
    }, 1300);
    if (running) setTimeout(spawn, 600 + Math.random() * 400);
  };
  setTimeout(spawn, 800);
}

/* ---------- Shop ---------- */
function renderShop(filter = 'all') {
  const grid = document.getElementById('shopGrid');
  const items = filter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.cat === filter);
  grid.innerHTML = items.map(item => {
    const owned = state.owned.includes(item.id);
    return `
      <div class="shop-card ${owned ? 'owned' : ''}" data-id="${item.id}">
        <div class="shop-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <div class="shop-price">🍃 ${item.price}</div>
        <button class="btn ${owned ? 'btn-secondary' : 'btn-primary'}" ${owned ? 'disabled' : ''}>
          ${owned ? 'Owned' : 'Buy'}
        </button>
      </div>`;
  }).join('');
  grid.querySelectorAll('.shop-card:not(.owned)').forEach(card => {
    card.querySelector('button').addEventListener('click', () => buyItem(card.dataset.id));
  });
}

function buyItem(id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item || state.owned.includes(id)) return;
  if (state.winds < item.price) {
    SFX.error();
    toast('Not enough Winds!', 'error');
    return;
  }
  state.winds -= item.price;
  state.owned.push(id);
  SFX.buy();
  toast(`Purchased ${item.name}!`, 'success');

  // Apply effects
  if (id === 'boost_xp') state.activeBoosts.xpBoost = 5;
  if (id === 'boost_wind') state.activeBoosts.windMagnet = Date.now() + 3600000;
  if (id === 'pack_starter') {
    addWinds(100, 'from Starter Pack');
  }
  if (id === 'pack_pro') {
    addWinds(300, 'from Pro Pack');
    state.activeBoosts.xpBoost = 5;
    if (!state.owned.includes('skin_gold')) state.owned.push('skin_gold');
  }
  if (id === 'boost_double') {
    state.dailyClaimed = null; // allow another claim
  }

  save();
  updateUI();
  checkBadges();
}

/* ---------- Firebase init ---------- */
function initFirebase() {
  const missing = !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY';
  if (missing) {
    console.warn('Firebase not configured. Paste your config in app.js');
    firebaseReady = false;
    return false;
  }
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.database();
    firebaseReady = true;

    auth.onAuthStateChanged(user => {
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || ('Guest_' + user.uid.slice(0, 5));
        state.user = {
          uid: user.uid,
          username: name,
          avatar: state.user?.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
          isAnonymous: user.isAnonymous
        };
        save();
        updateUI();
        initSpinTable();
      } else {
        if (state.user && !state.user.uid) { /* local only */ }
        else {
          state.user = null;
          updateUI();
        }
      }
    });
    return true;
  } catch (e) {
    console.error(e);
    firebaseReady = false;
    return false;
  }
}

/* ---------- Online Color Spin (Firebase) ---------- */
const SPIN_COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6'
};

let spinState = {
  status: 'betting', // betting | spinning | result
  bets: {},          // uid -> { name, color, amount }
  result: null,
  rotation: 0
};
let spinTableRef = null;
let selectedColor = 'green';
let selectedAmt = 100;
let spinning = false;

function initRooms() {
  // reused name from init — starts spin table
  initSpinTable();
}

function initSpinTable() {
  drawWheel({ green: 1, red: 1, blue: 1 }, 0);
  updateSpinUI();
  if (!firebaseReady || !db) return;
  spinTableRef = db.ref('spinTable');
  spinTableRef.on('value', snap => {
    const val = snap.val();
    if (!val) {
      // initialize empty table once
      spinTableRef.set({
        status: 'betting',
        bets: {},
        result: null,
        rotation: 0,
        updatedAt: Date.now()
      });
      return;
    }
    spinState.status = val.status || 'betting';
    spinState.bets = val.bets || {};
    spinState.result = val.result || null;
    spinState.rotation = val.rotation || 0;
    if (val.status !== 'spinning') {
      const totals = getTotals();
      drawWheel(totals, spinState.rotation);
    }
    updateSpinUI();
    // payout when result arrives (for winners)
    if (val.status === 'result' && val.result && val._payoutRound !== spinState._handledRound) {
      spinState._handledRound = val._payoutRound || val.updatedAt;
      handleLocalPayout(val);
    }
  });
  // chat
  db.ref('spinChat').limitToLast(30).on('child_added', snap => {
    const m = snap.val();
    if (m) addChat(m.who, m.text, true);
  });
}

function getTotals() {
  const t = { green: 0, red: 0, blue: 0 };
  Object.values(spinState.bets || {}).forEach(b => {
    if (t[b.color] !== undefined) t[b.color] += Number(b.amount) || 0;
  });
  return t;
}

function getPot() {
  const t = getTotals();
  return t.green + t.red + t.blue;
}

function drawWheel(totals, rotationDeg) {
  const canvas = document.getElementById('spinCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 4;
  ctx.clearRect(0, 0, w, h);

  const total = totals.green + totals.red + totals.blue || 3;
  const order = ['green', 'red', 'blue'];
  let start = (-90 + (rotationDeg || 0)) * Math.PI / 180;

  order.forEach(col => {
    const val = totals[col] || (total === 3 ? 1 : 0);
    const slice = (val / total) * Math.PI * 2;
    if (slice <= 0) return;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = SPIN_COLORS[col];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // label
    if (slice > 0.25) {
      const mid = start + slice / 2;
      const lx = cx + Math.cos(mid) * r * 0.55;
      const ly = cy + Math.sin(mid) * r * 0.55;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col[0].toUpperCase() + col.slice(1), lx, ly);
    }
    start += slice;
  });

  // center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(45,212,191,0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 11px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPIN', cx, cy);
}

function updateSpinUI() {
  const totals = getTotals();
  const pot = getPot();
  const potEl = document.getElementById('spinPot');
  if (potEl) potEl.textContent = pot;
  const totEl = document.getElementById('spinTotals');
  if (totEl) {
    totEl.innerHTML = `
      <span class="tot green">Green ${totals.green}</span>
      <span class="tot red">Red ${totals.red}</span>
      <span class="tot blue">Blue ${totals.blue}</span>`;
  }
  const statusEl = document.getElementById('spinStatus');
  if (statusEl) {
    if (spinState.status === 'betting') statusEl.textContent = 'Place your bets';
    else if (spinState.status === 'spinning') statusEl.textContent = 'Spinning…';
    else if (spinState.status === 'result') statusEl.textContent = `Result: ${(spinState.result || '').toUpperCase()}`;
  }
  const list = document.getElementById('betsList');
  if (list) {
    const entries = Object.entries(spinState.bets || {});
    if (!entries.length) list.innerHTML = '<p class="muted">No bets yet</p>';
    else {
      list.innerHTML = entries.map(([uid, b]) => {
        const share = totals[b.color] ? Math.round((b.amount / totals[b.color]) * 100) : 0;
        const you = state.user && uid === state.user.uid;
        return `<div class="bet-row">
          <span><span class="c-dot ${b.color}"></span>${you ? 'You' : b.name}</span>
          <span>${b.amount} 🍃 · ${share}%</span>
        </div>`;
      }).join('');
    }
  }
  // chance text
  const chanceEl = document.getElementById('betChance');
  if (chanceEl && state.user) {
    const my = spinState.bets[state.user.uid];
    if (my) {
      const colTotal = totals[my.color] || 1;
      const share = Math.round((my.amount / colTotal) * 100);
      const winProb = pot ? Math.round((totals[my.color] / pot) * 100) : 0;
      chanceEl.textContent = `On ${my.color}: ${share}% of color pot · color has ${winProb}% wheel area`;
    } else {
      chanceEl.textContent = 'Your chance on this color: place a bet';
    }
  }
  const spinBtn = document.getElementById('colorSpinBtn');
  if (spinBtn) {
    spinBtn.disabled = spinning || spinState.status === 'spinning' || pot < 10;
    spinBtn.textContent = spinState.status === 'result' ? '🎡 Next Round' : '🎡 Spin Wheel';
  }
  const hint = document.getElementById('spinHint');
  if (hint) {
    if (!firebaseReady) hint.textContent = 'Configure Firebase (SETUP.md) for real multiplayer — local mode works too';
    else if (!state.user) hint.textContent = 'Login to place bets and play with others';
    else hint.textContent = 'Bets sync live. Spin when ready — winners split the pot.';
  }
}

async function placeBet() {
  if (!requireAuth()) return;
  const amount = Math.floor(Number(document.getElementById('betAmount').value) || 0);
  if (amount < 10) { toast('Minimum bet is 10', 'error'); return; }
  if (amount > state.winds) { toast('Not enough Winds', 'error'); SFX.error(); return; }
  if (spinState.status === 'spinning') { toast('Wait for spin to finish', 'error'); return; }

  // If previous result, clear table first
  if (spinState.status === 'result') {
    await resetSpinTable();
  }

  const uid = state.user.uid || ('local_' + state.user.username);
  const existing = spinState.bets[uid];
  if (existing) {
    toast('You already bet this round', 'error');
    return;
  }

  state.winds -= amount;
  save();
  updateUI();

  const bet = {
    name: state.user.username,
    color: selectedColor,
    amount
  };

  if (firebaseReady && spinTableRef && state.user.uid) {
    await spinTableRef.child('bets/' + uid).set(bet);
    await spinTableRef.update({ status: 'betting', updatedAt: Date.now() });
  } else {
    // local-only
    spinState.bets[uid] = bet;
    spinState.status = 'betting';
    const totals = getTotals();
    drawWheel(totals, 0);
    updateSpinUI();
  }
  SFX.buy();
  toast(`Bet ${amount} on ${selectedColor}`, 'success');
}

async function resetSpinTable() {
  spinState = { status: 'betting', bets: {}, result: null, rotation: 0 };
  if (firebaseReady && spinTableRef) {
    await spinTableRef.set({
      status: 'betting',
      bets: {},
      result: null,
      rotation: 0,
      updatedAt: Date.now()
    });
  } else {
    drawWheel({ green: 1, red: 1, blue: 1 }, 0);
    updateSpinUI();
  }
}

function pickWinnerColor(totals) {
  const pot = totals.green + totals.red + totals.blue;
  if (pot <= 0) return 'green';
  let r = Math.random() * pot;
  for (const c of ['green', 'red', 'blue']) {
    r -= totals[c];
    if (r <= 0) return c;
  }
  return 'blue';
}

async function doSpin() {
  if (spinning) return;
  const pot = getPot();
  if (pot < 10) { toast('Need bets first', 'error'); return; }

  if (spinState.status === 'result') {
    await resetSpinTable();
    return;
  }

  spinning = true;
  spinState.status = 'spinning';
  updateSpinUI();
  SFX.spin();

  const totals = getTotals();
  const winner = pickWinnerColor(totals);

  // compute target rotation so pointer (top) lands in winner slice
  const order = ['green', 'red', 'blue'];
  let acc = 0;
  const segments = order.map(c => {
    const start = acc;
    const size = (totals[c] / pot) * 360;
    acc += size;
    return { c, start, size };
  });
  const seg = segments.find(s => s.c === winner) || segments[0];
  const landAt = seg.start + seg.size * (0.3 + Math.random() * 0.4); // within slice
  // pointer at top = -90deg in our draw; we rotate wheel so landAt moves to top
  const finalRot = 360 * 6 + (360 - landAt);

  // animate
  const canvas = document.getElementById('spinCanvas');
  const startRot = spinState.rotation || 0;
  const duration = 4200;
  const t0 = performance.now();

  function frame(now) {
    const p = Math.min(1, (now - t0) / duration);
    // ease out cubic
    const eased = 1 - Math.pow(1 - p, 3);
    const rot = startRot + (finalRot - startRot) * eased;
    drawWheel(totals, rot);
    if (p < 1) {
      requestAnimationFrame(frame);
      if (Math.random() > 0.7) SFX.spin();
    } else {
      finishSpin(winner, finalRot, pot, totals);
    }
  }
  requestAnimationFrame(frame);

  if (firebaseReady && spinTableRef) {
    await spinTableRef.update({ status: 'spinning', updatedAt: Date.now() });
  }
}

async function finishSpin(winner, rotation, pot, totals) {
  spinning = false;
  spinState.status = 'result';
  spinState.result = winner;
  spinState.rotation = rotation;

  const roundId = Date.now();
  if (firebaseReady && spinTableRef) {
    await spinTableRef.update({
      status: 'result',
      result: winner,
      rotation,
      updatedAt: roundId,
      _payoutRound: roundId,
      _pot: pot
    });
  }

  handleLocalPayout({ result: winner, bets: spinState.bets, _pot: pot });
  drawWheel(totals, rotation);
  updateSpinUI();
  document.getElementById('spinStatus').textContent = `Result: ${winner.toUpperCase()}!`;
  SFX.win();
  addChat('system', `Wheel landed on ${winner.toUpperCase()}! Pot: ${pot} 🍃`);
}

function handleLocalPayout(val) {
  const winner = val.result;
  const bets = val.bets || spinState.bets || {};
  const pot = val._pot || Object.values(bets).reduce((s, b) => s + (b.amount || 0), 0);
  const winners = Object.entries(bets).filter(([, b]) => b.color === winner);
  const winTotal = winners.reduce((s, [, b]) => s + b.amount, 0) || 1;

  if (!state.user) return;
  const uid = state.user.uid || ('local_' + state.user.username);
  const my = bets[uid];
  if (!my) return;

  if (my.color === winner) {
    const share = my.amount / winTotal;
    const prize = Math.floor(pot * share);
    addWinds(prize, `Spin win (${winner})`);
    state.onlineMatches++;
    state.wins++;
    state.gamesPlayed++;
    save();
    updateUI();
    checkBadges();
    toast(`You won ${prize} 🍃!`, 'success');
  } else {
    state.onlineMatches++;
    state.gamesPlayed++;
    save();
    updateUI();
    toast(`Landed on ${winner} — better luck next round`, 'error');
  }
}

function addChat(who, text, fromServer = false) {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = `chat-msg ${who === 'system' ? 'system' : ''}`;
  if (who === 'system') div.textContent = text;
  else div.innerHTML = `<strong>${who}:</strong> ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  if (who !== 'system' && who !== state.user?.username) SFX.chat();

  if (!fromServer && who === state.user?.username && firebaseReady && db) {
    db.ref('spinChat').push({ who, text, ts: Date.now() });
  }
}

/* ---------- Auth (Firebase) ---------- */
function openAuth() {
  document.getElementById('authModal').classList.remove('hidden');
  SFX.click();
}

function closeAuth() {
  document.getElementById('authModal').classList.add('hidden');
}

async function login(email, pass) {
  if (!firebaseReady) {
    toast('Configure Firebase first (SETUP.md)', 'error');
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    closeAuth();
    SFX.success();
    toast('Welcome back!', 'success');
  } catch (e) {
    toast(e.message || 'Login failed', 'error');
    SFX.error();
  }
}

async function signup(displayName, email, pass, pass2) {
  if (!firebaseReady) {
    toast('Configure Firebase first (SETUP.md)', 'error');
    return;
  }
  if (displayName.length < 3) { toast('Name too short', 'error'); return; }
  if (pass.length < 6) { toast('Password min 6 characters', 'error'); return; }
  if (pass !== pass2) { toast('Passwords do not match', 'error'); SFX.error(); return; }
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName });
    state.user = {
      uid: cred.user.uid,
      username: displayName,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    };
    save();
    updateUI();
    closeAuth();
    SFX.success();
    toast(`Welcome, ${displayName}!`, 'success');
  } catch (e) {
    toast(e.message || 'Sign up failed', 'error');
    SFX.error();
  }
}

async function guestLogin() {
  if (!firebaseReady) {
    // Local-only guest (no online)
    state.user = {
      username: 'Guest_' + Math.floor(Math.random() * 9000 + 1000),
      avatar: '👤'
    };
    save();
    updateUI();
    closeAuth();
    toast('Guest (offline mode — configure Firebase for online)', '');
    return;
  }
  try {
    const cred = await auth.signInAnonymously();
    const name = 'Guest_' + cred.user.uid.slice(0, 5);
    await cred.user.updateProfile({ displayName: name });
    state.user = {
      uid: cred.user.uid,
      username: name,
      avatar: '👤',
      isAnonymous: true
    };
    save();
    updateUI();
    closeAuth();
    SFX.click();
    toast('Playing as Guest', '');
  } catch (e) {
    toast(e.message || 'Guest login failed', 'error');
  }
}

/* ---------- FAQ ---------- */
function renderFAQ() {
  const list = document.getElementById('faqList');
  list.innerHTML = FAQ.map((f, i) => `
    <div class="faq-item" data-i="${i}">
      <button class="faq-q">${f.q}</button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>
  `).join('');
  list.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      item.classList.toggle('open');
      SFX.click();
    });
  });
}

/* ---------- Events ---------- */
function bindEvents() {
  // Nav
  // Multi-page: mark active nav by path
  const page = document.body.dataset.page || '';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes(page) && page) link.classList.add('active');
    else if (page === 'home' && (href.endsWith('index.html') || href === './' || href === '/')) link.classList.add('active');
    link.addEventListener('click', () => {
      document.getElementById('nav')?.classList.remove('open');
      SFX.click();
    });
  });
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('nav').classList.toggle('open');
  });

  // Sound
  document.getElementById('soundBtn').addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    save();
    updateUI();
    if (state.soundOn) SFX.click();
  });

  // Auth
  document.getElementById('authBtn').addEventListener('click', async () => {
    if (state.user) {
      if (confirm('Logout?')) {
        if (firebaseReady && auth) await auth.signOut();
        state.user = null;
        save();
        updateUI();
        toast('Logged out');
      }
    } else openAuth();
  });
  on('profileLoginBtn', 'click', openAuth);
  document.getElementById('authClose').addEventListener('click', closeAuth);
  document.getElementById('guestBtn').addEventListener('click', guestLogin);

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
      document.getElementById('signupForm').classList.toggle('hidden', isLogin);
      SFX.click();
    });
  });

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    login(document.getElementById('loginUser').value.trim(), document.getElementById('loginPass').value);
  });
  document.getElementById('signupForm').addEventListener('submit', e => {
    e.preventDefault();
    signup(
      document.getElementById('signupUser').value.trim(),
      document.getElementById('signupEmail').value.trim(),
      document.getElementById('signupPass').value,
      document.getElementById('signupPass2').value
    );
  });

  // Daily
  on('dailyClaimBtn', 'click', () => {
    if (!state.user) return;
    const today = new Date().toDateString();
    if (state.dailyClaimed === today) return;
    state.dailyClaimed = today;
    addWinds(50, 'Daily reward');
    addXP(10);
    save();
    updateUI();
    checkBadges();
  });

  // Avatar
  on('avatarEdit', 'click', () => {
    if (!state.user) return;
    const next = AVATARS[(AVATARS.indexOf(state.user.avatar) + 1) % AVATARS.length];
    state.user.avatar = next;
    save();
    updateUI();
    SFX.click();
  });

  // Shop filters
  document.querySelectorAll('.shop-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.shop-filters .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderShop(chip.dataset.shop);
      SFX.click();
    });
  });

  // Color Spin bets
  document.querySelectorAll('.bet-amt').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.bet-amt').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedAmt = Number(chip.dataset.amt);
      document.getElementById('betAmount').value = selectedAmt;
      SFX.click();
    });
  });
  on('betAmount', 'input', e => {
    selectedAmt = Math.floor(Number(e.target.value) || 0);
  });
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.dataset.color;
      SFX.click();
    });
  });
  on('placeBetBtn', 'click', placeBet);
  on('colorSpinBtn', 'click', doSpin);

  // Chat (synced via Firebase)
  on('chatForm', 'submit', e => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !state.user) return;
    addChat(state.user.username, text);
    input.value = '';
  });

  // Game modal close
  document.getElementById('gameClose').addEventListener('click', closeGameModal);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });
}

/* ---------- Init ---------- */
function init() {
  load();
  initFirebase();
  spawnParticles();
  if (document.getElementById('gamesGrid')) renderGames();
  if (document.getElementById('shopGrid')) renderShop();
  if (document.getElementById('faqList')) renderFAQ();
  if (document.getElementById('spinCanvas')) initRooms();
  updateUI();
  bindEvents();

  const statPlayers = document.getElementById('statPlayers');
  if (statPlayers) {
    setInterval(() => {
      const n = Object.keys(spinState.bets || {}).length + 8;
      statPlayers.textContent = n + '+';
    }, 8000);
  }
}

init();
