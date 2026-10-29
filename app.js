/* ============================================================
   Blessed Winds — Full App (Firebase multiplayer)
   ============================================================ */

/* ---------- FIREBASE CONFIG — paste yours from Firebase Console ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBFc3CjKTWr8XJKW94EP2QlcwGS-BNQXjk",
  authDomain: "winds-51d1b.firebaseapp.com",
  databaseURL: "https://winds-51d1b-default-rtdb.asia-southeast1.firebasedatabase.app/"
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
  { q: 'How does online work?', a: 'Real multiplayer via Firebase. Create or join rooms, chat, and play Wind Race, Gust Duel, or Memory Match with other people. Host can start the match when ready.' },
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
  document.getElementById('windsCount').textContent = state.winds;
  document.getElementById('soundBtn').textContent = state.soundOn ? '🔊' : '🔇';
  document.getElementById('soundBtn').classList.toggle('muted', !state.soundOn);

  const authBtn = document.getElementById('authBtn');
  if (state.user) {
    authBtn.textContent = state.user.username;
  } else {
    authBtn.textContent = 'Login';
  }

  // Profile
  const guest = document.getElementById('profileGuest');
  const logged = document.getElementById('profileLogged');
  if (state.user) {
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
  } else {
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
    roomsRef = db.ref('rooms');
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
        listenRooms();
      } else {
        // keep local guest session if any; online requires login
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

/* ---------- Online System (Firebase Realtime Database) ---------- */
function initRooms() {
  state.rooms = [];
  renderRooms();
  if (firebaseReady) listenRooms();
}

function listenRooms() {
  if (!roomsRef) return;
  if (roomsListUnsub) roomsRef.off('value', roomsListUnsub);
  roomsListUnsub = roomsRef.on('value', snap => {
    const val = snap.val() || {};
    state.rooms = Object.keys(val).map(id => {
      const r = val[id];
      const players = r.players ? Object.keys(r.players).map(uid => ({
        uid,
        name: r.players[uid].name,
        avatar: r.players[uid].avatar,
        host: !!r.players[uid].host,
        you: state.user && uid === state.user.uid
      })) : [];
      return {
        id,
        name: r.name,
        mode: r.mode,
        icon: r.icon || '🌬️',
        max: r.max || 4,
        status: r.status || 'open',
        hostUid: r.hostUid,
        started: !!r.started,
        players
      };
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderRooms(document.querySelector('.room-filters .chip.active')?.dataset.filter || 'all');
  });
}

function renderRooms(filter = 'all') {
  const list = document.getElementById('roomsList');
  let rooms = state.rooms;
  if (filter === 'open') rooms = rooms.filter(r => r.status === 'open');
  else if (filter === 'racing') rooms = rooms.filter(r => r.mode === 'racing');
  else if (filter === 'duel') rooms = rooms.filter(r => r.mode === 'duel');

  if (!firebaseReady) {
    list.innerHTML = `<p style="padding:1.5rem;text-align:center;color:var(--text-muted)">
      Firebase not configured yet.<br>Open <strong>SETUP.md</strong> and paste your config in app.js
    </p>`;
    return;
  }

  if (!rooms.length) {
    list.innerHTML = '<p style="padding:1.5rem;text-align:center;color:var(--text-muted)">No rooms yet — create one!</p>';
    return;
  }
  list.innerHTML = rooms.map(r => `
    <div class="room-item" data-id="${r.id}">
      <div class="room-icon">${r.icon}</div>
      <div class="room-info">
        <strong>${r.name}</strong>
        <span>${r.players.length}/${r.max} · ${r.mode} · ${r.status}</span>
      </div>
      <button class="btn btn-sm btn-primary join-btn" ${r.status === 'full' || r.started || state.currentRoom ? 'disabled' : ''}>Join</button>
    </div>
  `).join('');

  list.querySelectorAll('.room-item').forEach(item => {
    const btn = item.querySelector('.join-btn');
    if (btn && !btn.disabled) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        joinRoom(item.dataset.id);
      });
    }
  });
}

async function joinRoom(id) {
  if (!requireAuth()) return;
  if (!firebaseReady) { toast('Firebase not configured', 'error'); return; }
  if (state.currentRoom) { toast('Leave current room first', 'error'); return; }

  const room = state.rooms.find(r => r.id === id);
  if (!room || room.status === 'full' || room.started) return;

  const uid = state.user.uid;
  const ref = db.ref('rooms/' + id);
  await ref.child('players/' + uid).set({
    name: state.user.username,
    avatar: state.user.avatar,
    host: false
  });

  const playersSnap = await ref.child('players').once('value');
  const count = playersSnap.numChildren();
  if (count >= room.max) await ref.update({ status: 'full' });

  state.currentRoom = { ...room, id };
  currentRoomRef = ref;
  SFX.join();
  toast(`Joined ${room.name}`);
  showMatchPanel();
  attachRoomListeners(id);
}

async function createRoom(name, mode, max) {
  if (!requireAuth()) return;
  if (!firebaseReady) { toast('Firebase not configured — see SETUP.md', 'error'); return; }

  const icons = { racing: '🏁', duel: '⚔️', memory: '🧠' };
  const uid = state.user.uid;
  const ref = roomsRef.push();
  const roomData = {
    name: name || 'My Room',
    mode,
    icon: icons[mode] || '🌬️',
    max: +max,
    status: 'open',
    hostUid: uid,
    createdAt: Date.now(),
    started: false,
    players: {
      [uid]: {
        name: state.user.username,
        avatar: state.user.avatar,
        host: true
      }
    }
  };
  await ref.set(roomData);

  state.currentRoom = { id: ref.key, ...roomData, players: [{
    uid, name: state.user.username, avatar: state.user.avatar, host: true, you: true
  }] };
  currentRoomRef = ref;
  SFX.join();
  toast('Room created!');
  document.getElementById('createRoomModal').classList.add('hidden');
  showMatchPanel();
  attachRoomListeners(ref.key);
}

function attachRoomListeners(roomId) {
  const ref = db.ref('rooms/' + roomId);

  ref.child('players').on('value', snap => {
    if (!state.currentRoom || state.currentRoom.id !== roomId) return;
    const val = snap.val() || {};
    state.currentRoom.players = Object.keys(val).map(uid => ({
      uid,
      name: val[uid].name,
      avatar: val[uid].avatar,
      host: !!val[uid].host,
      you: uid === state.user.uid
    }));
    updatePlayersRow();
    const st = document.getElementById('matchStatus');
    if (st && !state.currentRoom.started) {
      st.textContent = `Waiting… (${state.currentRoom.players.length}/${state.currentRoom.max})`;
    }
  });

  ref.child('chat').limitToLast(40).on('child_added', snap => {
    if (!state.currentRoom || state.currentRoom.id !== roomId) return;
    const m = snap.val();
    if (!m) return;
    addChat(m.who, m.text, true);
  });

  ref.child('started').on('value', snap => {
    if (!state.currentRoom || state.currentRoom.id !== roomId) return;
    if (snap.val() === true && !state.currentRoom._matchBegan) {
      state.currentRoom._matchBegan = true;
      state.currentRoom.started = true;
      beginMatch(state.currentRoom);
    }
  });
}

function showMatchPanel() {
  document.getElementById('matchEmpty').classList.add('hidden');
  document.getElementById('matchActive').classList.remove('hidden');
  const room = state.currentRoom;
  document.getElementById('roomName').textContent = room.name;
  document.getElementById('roomMeta').textContent = `${room.players?.length || 1}/${room.max} players · ${room.mode}`;
  updatePlayersRow();
  document.getElementById('matchStatus').textContent =
    `Waiting for players… Host can start anytime`;
  const isHost = room.hostUid === state.user?.uid || room.players?.some(p => p.you && p.host);
  document.getElementById('matchGameArea').innerHTML = isHost
    ? `<button class="btn btn-primary" id="startMatchBtn" style="margin-top:0.5rem">▶ Start Match</button>
       <p style="margin-top:0.6rem;font-size:0.85rem;color:var(--text-muted)">Share this site URL so friends can join your room.</p>`
    : `<p style="margin-top:0.6rem;font-size:0.85rem;color:var(--text-muted)">Waiting for host to start…</p>`;
  document.getElementById('chatMessages').innerHTML = '';
  const startBtn = document.getElementById('startMatchBtn');
  if (startBtn) {
    startBtn.onclick = async () => {
      if (!currentRoomRef) return;
      startBtn.disabled = true;
      await currentRoomRef.update({ started: true, status: 'live' });
    };
  }
}

function updatePlayersRow() {
  const row = document.getElementById('playersRow');
  const room = state.currentRoom;
  if (!room) return;
  row.innerHTML = room.players.map(p => `
    <div class="player-chip ${p.you ? 'you' : ''} ${p.host ? 'host' : ''}">
      ${p.avatar} ${p.name}
    </div>
  `).join('');
  document.getElementById('roomMeta').textContent = `${room.players.length}/${room.max} players · ${room.mode}`;
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

  // Push to Firebase when local user sends
  if (!fromServer && who === state.user?.username && currentRoomRef) {
    currentRoomRef.child('chat').push({ who, text, ts: Date.now() });
  }
}

async function leaveRoom() {
  if (!state.currentRoom) return;
  const room = state.currentRoom;
  const uid = state.user?.uid;

  if (firebaseReady && currentRoomRef && uid) {
    await currentRoomRef.child('players/' + uid).remove();
    const snap = await currentRoomRef.child('players').once('value');
    if (!snap.exists() || snap.numChildren() === 0) {
      await currentRoomRef.remove();
    } else {
      await currentRoomRef.update({ status: 'open', started: false });
    }
  }

  currentRoomRef = null;
  state.currentRoom = null;
  document.getElementById('matchActive').classList.add('hidden');
  document.getElementById('matchEmpty').classList.remove('hidden');
  renderRooms();
  toast('Left room');
  SFX.click();
}

function startRoomLogic(room) {
  // Host starts via button; Firebase started flag triggers beginMatch for everyone
}

function beginMatch(room) {
  document.getElementById('matchStatus').textContent = 'Match starting in 3…';
  addChat('system', 'Match is starting!');
  let c = 3;
  const countdown = setInterval(() => {
    c--;
    if (c > 0) {
      document.getElementById('matchStatus').textContent = `Match starting in ${c}…`;
    } else {
      clearInterval(countdown);
      document.getElementById('matchStatus').textContent = 'Live!';
      if (room.mode === 'racing') runRace(room);
      else if (room.mode === 'duel') runDuel(room);
      else runOnlineMemory(room);
    }
  }, 1000);
}

/* Online Race */
function runRace(room) {
  const area = document.getElementById('matchGameArea');
  const players = room.players.map(p => ({ ...p, progress: 0, finished: false }));
  area.innerHTML = `
    <div class="race-track" id="raceTrack">
      ${players.map((p, i) => `
        <div class="race-lane">
          <div class="race-name">${p.you ? 'You' : p.name}</div>
          <div class="race-bar"><div class="race-fill ${p.you ? 'you' : ''}" id="rf${i}"></div></div>
        </div>
      `).join('')}
    </div>
    <p style="margin-top:1rem;color:var(--text-muted);font-size:0.85rem">Spam the button or spacebar!</p>
    <button class="btn btn-primary" id="raceTap" style="margin-top:0.5rem">💨 Gust!</button>
  `;
  let finished = false;
  const youIdx = players.findIndex(p => p.you);

  const tick = () => {
    if (finished) return;
    players.forEach((p, i) => {
      if (p.finished) return;
      if (!p.you) {
        p.progress += 0.4 + Math.random() * 1.2;
      }
      if (p.progress >= 100) {
        p.progress = 100;
        p.finished = true;
      }
      const fill = document.getElementById('rf' + i);
      if (fill) fill.style.width = p.progress + '%';
    });
    const done = players.filter(p => p.finished);
    if (done.length === players.length || (done.length > 0 && done.some(p => p.you))) {
      // wait a bit more or finish when all done / you finished
    }
    if (players.every(p => p.finished)) {
      finished = true;
      finishRace(players);
      return;
    }
    requestAnimationFrame(tick);
  };

  const boost = () => {
    if (finished || youIdx < 0) return;
    players[youIdx].progress += 2.2 + Math.random() * 1.5;
    if (players[youIdx].progress >= 100) {
      players[youIdx].progress = 100;
      players[youIdx].finished = true;
    }
    SFX.click();
  };
  document.getElementById('raceTap').addEventListener('click', boost);
  const keyHandler = (e) => { if (e.code === 'Space') { e.preventDefault(); boost(); } };
  window.addEventListener('keydown', keyHandler);

  // AI finish helper
  const checkEnd = setInterval(() => {
    if (players.every(p => p.finished)) {
      clearInterval(checkEnd);
      window.removeEventListener('keydown', keyHandler);
      finished = true;
      finishRace(players);
    }
  }, 200);

  requestAnimationFrame(tick);
}

function finishRace(players) {
  players.sort((a, b) => b.progress - a.progress || (a.you ? -1 : 1));
  const place = players.findIndex(p => p.you) + 1;
  const winds = place === 1 ? 35 : place === 2 ? 20 : 10;
  state.onlineMatches++;
  state.gamesPlayed++;
  if (place === 1) state.wins++;
  addWinds(winds, `Race #${place}`);
  addXP(25);
  document.getElementById('matchStatus').textContent = `Finished #${place}! +${winds} 🍃`;
  addChat('system', `Race over — you placed #${place}`);
  document.getElementById('matchGameArea').innerHTML += `
    <button class="btn btn-secondary" style="margin-top:1rem" id="rematchBtn">Back to Lobby</button>`;
  document.getElementById('rematchBtn')?.addEventListener('click', leaveRoom);
  save();
  updateUI();
  checkBadges();
  if (place === 1) SFX.win();
}

/* Online Duel */
function runDuel(room) {
  const you = room.players.find(p => p.you) || room.players[0];
  // Practice opponent only when no other real player is in the room
  const realFoe = room.players.find(p => !p.you);
  const foe = realFoe || { name: 'Training Dummy', avatar: '🎯', you: false };
  let youHP = 100, foeHP = 100;
  const area = document.getElementById('matchGameArea');
  area.innerHTML = `
    <div class="duel-arena">
      <div class="duel-hp">
        <div class="duel-fighter">
          <div class="name">${you.name} (You)</div>
          <div class="hp-bar"><div class="hp-fill" id="youHP" style="width:100%"></div></div>
        </div>
        <div class="duel-fighter">
          <div class="name">${foe.name}${realFoe ? '' : ' (practice)'}</div>
          <div class="hp-bar"><div class="hp-fill" id="foeHP" style="width:100%"></div></div>
        </div>
      </div>
      <div class="duel-actions">
        <button class="btn btn-primary" data-move="gust">💨 Gust (15-25)</button>
        <button class="btn btn-secondary" data-move="shield">🛡️ Shield</button>
        <button class="btn btn-secondary" data-move="blast">🌪️ Blast (30)</button>
      </div>
      <p id="duelLog" style="margin-top:1rem;min-height:1.4em;color:var(--text-muted)"></p>
    </div>`;
  let yourTurn = true;
  let shield = false;

  const updateHP = () => {
    document.getElementById('youHP').style.width = youHP + '%';
    document.getElementById('foeHP').style.width = foeHP + '%';
    document.getElementById('youHP').classList.toggle('low', youHP < 30);
    document.getElementById('foeHP').classList.toggle('low', foeHP < 30);
  };

  const endDuel = (won) => {
    state.onlineMatches++;
    state.gamesPlayed++;
    if (won) state.wins++;
    const winds = won ? 40 : 12;
    addWinds(winds, won ? 'Duel victory' : 'Duel participation');
    addXP(22);
    document.getElementById('matchStatus').textContent = won ? 'Victory!' : 'Defeat…';
    document.getElementById('duelLog').textContent = won ? 'You win the duel!' : 'You were blown away…';
    area.querySelector('.duel-actions').innerHTML = `<button class="btn btn-secondary" id="rematchBtn">Back to Lobby</button>`;
    document.getElementById('rematchBtn')?.addEventListener('click', leaveRoom);
    save();
    updateUI();
    checkBadges();
    if (won) SFX.win(); else SFX.error();
  };

  const enemyTurn = () => {
    yourTurn = false;
    setTimeout(() => {
      const moves = ['gust', 'gust', 'blast', 'shield'];
      const move = moves[Math.floor(Math.random() * moves.length)];
      let dmg = 0;
      if (move === 'gust') dmg = 12 + Math.floor(Math.random() * 10);
      if (move === 'blast') dmg = 28;
      if (move === 'shield') {
        document.getElementById('duelLog').textContent = `${foe.name} raises a shield!`;
      } else {
        if (shield) { dmg = Math.floor(dmg * 0.4); shield = false; }
        youHP = Math.max(0, youHP - dmg);
        document.getElementById('duelLog').textContent = `${foe.name} hits you for ${dmg}!`;
        SFX.click();
      }
      updateHP();
      if (youHP <= 0) endDuel(false);
      else yourTurn = true;
    }, 900);
  };

  area.querySelectorAll('[data-move]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!yourTurn || youHP <= 0 || foeHP <= 0) return;
      const move = btn.dataset.move;
      let dmg = 0;
      if (move === 'gust') dmg = 15 + Math.floor(Math.random() * 11);
      if (move === 'blast') dmg = 30;
      if (move === 'shield') {
        shield = true;
        document.getElementById('duelLog').textContent = 'Shield up!';
        SFX.click();
        enemyTurn();
        return;
      }
      foeHP = Math.max(0, foeHP - dmg);
      document.getElementById('duelLog').textContent = `You hit for ${dmg}!`;
      SFX.click();
      updateHP();
      if (foeHP <= 0) endDuel(true);
      else enemyTurn();
    });
  });
}

/* Online Memory (simplified race to match) */
function runOnlineMemory(room) {
  const area = document.getElementById('matchGameArea');
  let yourScore = 0, foeScore = 0;
  const foe = room.players.find(p => !p.you);
  area.innerHTML = `
    <div class="solo-game">
      <div class="score-row">
        <span>You: <strong id="omYou">0</strong></span>
        <span>${foe?.name || 'Rival'}: <strong id="omFoe">0</strong></span>
      </div>
      <p style="color:var(--text-muted)">Click as many matching pairs as you can in 20s!</p>
      <div class="memory-grid" id="omGrid" style="margin-top:1rem"></div>
      <p>Time: <strong id="omTime">20</strong>s</p>
    </div>`;
  const symbols = ['🍃', '🌬️', '☁️', '⭐', '🦋', '🌊'];
  const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  const grid = document.getElementById('omGrid');
  let flipped = [], lock = false, time = 20;
  cards.forEach((sym, i) => {
    const c = document.createElement('div');
    c.className = 'memory-card';
    c.dataset.sym = sym;
    c.textContent = '?';
    c.addEventListener('click', () => {
      if (lock || c.classList.contains('flipped') || c.classList.contains('matched') || time <= 0) return;
      c.classList.add('flipped');
      c.textContent = sym;
      flipped.push(c);
      SFX.click();
      if (flipped.length === 2) {
        lock = true;
        if (flipped[0].dataset.sym === flipped[1].dataset.sym) {
          flipped.forEach(x => x.classList.add('matched'));
          yourScore++;
          document.getElementById('omYou').textContent = yourScore;
          flipped = [];
          lock = false;
          SFX.success();
        } else {
          setTimeout(() => {
            flipped.forEach(x => { x.classList.remove('flipped'); x.textContent = '?'; });
            flipped = [];
            lock = false;
          }, 500);
        }
      }
    });
    grid.appendChild(c);
  });

  // AI scoring
  const ai = setInterval(() => {
    if (time <= 0) return;
    if (Math.random() > 0.55) {
      foeScore++;
      document.getElementById('omFoe').textContent = foeScore;
    }
  }, 1800);

  const timer = setInterval(() => {
    time--;
    document.getElementById('omTime').textContent = time;
    if (time <= 0) {
      clearInterval(timer);
      clearInterval(ai);
      const won = yourScore >= foeScore;
      state.onlineMatches++;
      state.gamesPlayed++;
      if (won) state.wins++;
      const winds = won ? 30 : 12;
      addWinds(winds, won ? 'Memory win' : 'Memory play');
      addXP(18);
      document.getElementById('matchStatus').textContent = won ? 'You win!' : 'Close one!';
      area.innerHTML += `<button class="btn btn-secondary" style="margin-top:1rem" id="rematchBtn">Back to Lobby</button>`;
      document.getElementById('rematchBtn')?.addEventListener('click', leaveRoom);
      save();
      updateUI();
      checkBadges();
      if (won) SFX.win();
    }
  }, 1000);
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
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.getElementById('nav').classList.remove('open');
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
        if (state.currentRoom) await leaveRoom();
        if (firebaseReady && auth) await auth.signOut();
        state.user = null;
        save();
        updateUI();
        toast('Logged out');
      }
    } else openAuth();
  });
  document.getElementById('profileLoginBtn').addEventListener('click', openAuth);
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
  document.getElementById('dailyClaimBtn').addEventListener('click', () => {
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
  document.getElementById('avatarEdit').addEventListener('click', () => {
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

  // Room filters
  document.querySelectorAll('.room-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.room-filters .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderRooms(chip.dataset.filter);
      SFX.click();
    });
  });

  // Create room
  document.getElementById('createRoomBtn').addEventListener('click', () => {
    if (!requireAuth()) return;
    document.getElementById('createRoomModal').classList.remove('hidden');
    SFX.click();
  });
  document.getElementById('createRoomClose').addEventListener('click', () => {
    document.getElementById('createRoomModal').classList.add('hidden');
  });
  document.getElementById('createRoomForm').addEventListener('submit', e => {
    e.preventDefault();
    createRoom(
      document.getElementById('newRoomName').value.trim(),
      document.getElementById('newRoomMode').value,
      document.getElementById('newRoomMax').value
    );
  });

  document.getElementById('leaveRoomBtn').addEventListener('click', leaveRoom);

  // Chat (synced via Firebase)
  document.getElementById('chatForm').addEventListener('submit', e => {
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
  renderGames();
  renderShop();
  renderFAQ();
  initRooms();
  updateUI();
  bindEvents();

  setInterval(() => {
    const n = (state.rooms?.reduce((s, r) => s + (r.players?.length || 0), 0) || 0) + 12;
    document.getElementById('statPlayers').textContent = n + '+';
  }, 8000);
}

init();
