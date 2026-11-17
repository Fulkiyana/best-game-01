import http from "node:http";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RhythmFun</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0f;
    color: #fff;
    font-family: 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
  }
  h1 {
    font-size: 2.5rem;
    letter-spacing: 0.3em;
    background: linear-gradient(90deg, #ff6ec7, #a78bfa, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }
  #hud {
    display: flex;
    gap: 3rem;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #a78bfa;
  }
  #hud span { font-size: 1.5rem; color: #fff; font-weight: bold; }
  #stage {
    position: relative;
    width: 480px;
    height: 500px;
    background: #12121a;
    border: 2px solid #2a2a3a;
    border-radius: 12px;
    overflow: hidden;
  }
  /* lane dividers */
  .lane-bg {
    position: absolute;
    top: 0; bottom: 0;
    width: 120px;
    border-right: 1px solid #1e1e2e;
  }
  .lane-bg:nth-child(1) { left: 0;   background: rgba(255,110,199,0.03); }
  .lane-bg:nth-child(2) { left: 120px; background: rgba(167,139,250,0.03); }
  .lane-bg:nth-child(3) { left: 240px; background: rgba(56,189,248,0.03); }
  .lane-bg:nth-child(4) { left: 360px; background: rgba(52,211,153,0.03); }
  /* hit zone */
  #hitzone {
    position: absolute;
    bottom: 70px;
    left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ff6ec7, #a78bfa, #38bdf8, #34d399);
    box-shadow: 0 0 12px rgba(167,139,250,0.6);
  }
  /* notes */
  .note {
    position: absolute;
    width: 90px;
    height: 28px;
    border-radius: 8px;
    left: 15px;
    transform: translateX(0);
    transition: none;
  }
  .note.lane0 { left: 15px;  background: linear-gradient(135deg,#ff6ec7,#c026d3); box-shadow: 0 0 8px #ff6ec7aa; }
  .note.lane1 { left: 135px; background: linear-gradient(135deg,#a78bfa,#7c3aed); box-shadow: 0 0 8px #a78bfaaa; }
  .note.lane2 { left: 255px; background: linear-gradient(135deg,#38bdf8,#0284c7); box-shadow: 0 0 8px #38bdf8aa; }
  .note.lane3 { left: 375px; background: linear-gradient(135deg,#34d399,#059669); box-shadow: 0 0 8px #34d399aa; }
  /* key indicators */
  #keys {
    position: absolute;
    bottom: 10px;
    left: 0; right: 0;
    display: flex;
  }
  .key-btn {
    flex: 1;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    font-weight: bold;
    border-radius: 8px;
    margin: 0 6px;
    background: #1e1e2e;
    border: 2px solid #2a2a3a;
    color: #666;
    transition: all 0.08s;
    user-select: none;
    cursor: pointer;
  }
  .key-btn.lane0 { border-color: #ff6ec7; }
  .key-btn.lane1 { border-color: #a78bfa; }
  .key-btn.lane2 { border-color: #38bdf8; }
  .key-btn.lane3 { border-color: #34d399; }
  .key-btn.pressed {
    transform: scale(0.92);
    filter: brightness(1.8);
    background: #2a2a3a;
  }
  /* judgment popup */
  #judgment {
    position: absolute;
    top: 180px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.8rem;
    font-weight: bold;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  #judgment.show { opacity: 1; }
  #judgment.perfect { color: #fbbf24; text-shadow: 0 0 10px #fbbf24; }
  #judgment.good    { color: #34d399; text-shadow: 0 0 10px #34d399; }
  #judgment.miss    { color: #f87171; text-shadow: 0 0 10px #f87171; }
  /* combo */
  #combo {
    position: absolute;
    top: 220px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.1rem;
    color: #a78bfa;
    pointer-events: none;
  }
  /* particles */
  .particle {
    position: absolute;
    width: 6px; height: 6px;
    border-radius: 50%;
    pointer-events: none;
  }
  /* overlay */
  #overlay {
    position: absolute;
    inset: 0;
    background: rgba(10,10,15,0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    border-radius: 10px;
  }
  #overlay h2 { font-size: 2rem; color: #a78bfa; }
  #overlay p  { color: #888; font-size: 0.95rem; text-align: center; line-height: 1.6; }
  #overlay .result { font-size: 1.2rem; color: #fff; }
  button.start-btn {
    margin-top: 0.5rem;
    padding: 0.7rem 2.5rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #a78bfa, #38bdf8);
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    letter-spacing: 0.1em;
    transition: transform 0.1s, filter 0.1s;
  }
  button.start-btn:hover { filter: brightness(1.15); transform: scale(1.04); }
  /* progress bar */
  #progressbar {
    width: 480px;
    height: 5px;
    background: #1e1e2e;
    border-radius: 999px;
    margin-top: 0.4rem;
    overflow: hidden;
  }
  #progressfill {
    height: 100%;
    background: linear-gradient(90deg, #a78bfa, #38bdf8);
    width: 0%;
    transition: width 0.2s linear;
  }
</style>
</head>
<body>
<h1>RHYTHMFUN</h1>
<div id="hud">
  <div>SCORE <span id="scoreVal">0</span></div>
  <div>COMBO <span id="comboVal">0</span></div>
  <div>PERFECT <span id="perfectVal">0</span></div>
</div>
<div id="stage">
  <div class="lane-bg"></div>
  <div class="lane-bg"></div>
  <div class="lane-bg"></div>
  <div class="lane-bg"></div>
  <div id="hitzone"></div>
  <div id="judgment"></div>
  <div id="combo"></div>
  <div id="keys">
    <div class="key-btn lane0" data-lane="0">D</div>
    <div class="key-btn lane1" data-lane="1">F</div>
    <div class="key-btn lane2" data-lane="2">J</div>
    <div class="key-btn lane3" data-lane="3">K</div>
  </div>
  <div id="overlay">
    <h2>🎵 RHYTHMFUN</h2>
    <p>Hit the notes as they reach the glowing line!<br>Keys: <b>D F J K</b> for each lane<br>Or tap the buttons below.</p>
    <button class="start-btn" id="startBtn">START</button>
  </div>
</div>
<div id="progressbar"><div id="progressfill"></div></div>

<script>
const LANES = 4;
const STAGE_H = 500;
const HIT_Y = STAGE_H - 70 - 14; // center of note at hitzone
const NOTE_SPEED = 220; // px/sec
const PERFECT_WIN = 36;
const GOOD_WIN = 72;
const SONG_DURATION = 60; // seconds

// Generate a beat map: [time_seconds, lane]
function makeBeatmap() {
  const beats = [];
  const bpm = 128;
  const step = 60 / bpm;
  const half = step / 2;
  const quarter = step / 4;
  for (let t = 1.5; t < SONG_DURATION - 2; t += step) {
    // kick on every beat
    beats.push([t, Math.floor(Math.random() * LANES)]);
    // snare on 2 & 4
    if (Math.round(t / step) % 2 === 1) {
      beats.push([t + half, (Math.floor(Math.random() * LANES) + 2) % LANES]);
    }
    // hi-hat 16ths
    if (Math.random() < 0.6) {
      beats.push([t + quarter, Math.floor(Math.random() * LANES)]);
    }
    if (Math.random() < 0.4) {
      beats.push([t + 3 * quarter, Math.floor(Math.random() * LANES)]);
    }
  }
  beats.sort((a, b) => a[0] - b[0]);
  return beats;
}

const BEATMAP = makeBeatmap();

// State
let running = false;
let startTime = 0;
let score = 0;
let combo = 0;
let perfect = 0;
let miss = 0;
let activeNotes = []; // {el, lane, hitTime}
let spawnIndex = 0;
let raf = null;
let judgeTimer = null;

const stage = document.getElementById('stage');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const scoreVal = document.getElementById('scoreVal');
const comboVal = document.getElementById('comboVal');
const perfectVal = document.getElementById('perfectVal');
const judgment = document.getElementById('judgment');
const comboEl = document.getElementById('combo');
const progressFill = document.getElementById('progressfill');

function spawnNote(lane, hitTime) {
  const el = document.createElement('div');
  el.className = 'note lane' + lane;
  el.style.top = '-28px';
  stage.appendChild(el);
  activeNotes.push({ el, lane, hitTime });
}

function updateNotes(now) {
  const elapsed = (now - startTime) / 1000;
  // spawn upcoming notes
  while (spawnIndex < BEATMAP.length) {
    const [t, lane] = BEATMAP[spawnIndex];
    const travelTime = (HIT_Y + 28) / NOTE_SPEED;
    if (t - elapsed <= travelTime + 0.1) {
      spawnNote(lane, t);
      spawnIndex++;
    } else break;
  }
  // move notes
  for (let i = activeNotes.length - 1; i >= 0; i--) {
    const n = activeNotes[i];
    const timeToHit = n.hitTime - elapsed;
    const y = HIT_Y - timeToHit * NOTE_SPEED;
    n.el.style.top = y + 'px';
    // auto-miss
    if (timeToHit < -(GOOD_WIN / NOTE_SPEED)) {
      n.el.remove();
      activeNotes.splice(i, 1);
      registerJudge('miss');
    }
  }
}

function registerJudge(type) {
  if (type === 'perfect') {
    score += 300 + combo * 2;
    combo++;
    perfect++;
    showJudge('PERFECT!', 'perfect');
  } else if (type === 'good') {
    score += 100 + combo;
    combo++;
    showJudge('GOOD', 'good');
  } else {
    combo = 0;
    miss++;
    showJudge('MISS', 'miss');
  }
  scoreVal.textContent = score;
  comboVal.textContent = combo;
  perfectVal.textContent = perfect;
  if (combo >= 4) {
    comboEl.textContent = combo + 'x COMBO!';
    comboEl.style.opacity = '1';
  } else {
    comboEl.style.opacity = '0';
  }
}

function showJudge(text, cls) {
  judgment.textContent = text;
  judgment.className = 'show ' + cls;
  clearTimeout(judgeTimer);
  judgeTimer = setTimeout(() => { judgment.className = ''; }, 500);
}

function hitLane(lane) {
  if (!running) return;
  const elapsed = (performance.now() - startTime) / 1000;
  // find closest note in lane
  let best = null, bestDist = Infinity;
  for (const n of activeNotes) {
    if (n.lane !== lane) continue;
    const diff = Math.abs(n.hitTime - elapsed);
    if (diff < bestDist) { bestDist = diff; best = n; }
  }
  // visual press
  const btn = document.querySelector('.key-btn[data-lane="' + lane + '"]');
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);

  if (!best) return;
  const distPx = bestDist * NOTE_SPEED;
  if (distPx <= PERFECT_WIN) {
    spawnParticles(lane, 'perfect');
    best.el.remove();
    activeNotes.splice(activeNotes.indexOf(best), 1);
    registerJudge('perfect');
  } else if (distPx <= GOOD_WIN) {
    spawnParticles(lane, 'good');
    best.el.remove();
    activeNotes.splice(activeNotes.indexOf(best), 1);
    registerJudge('good');
  }
}

const laneColors = ['#ff6ec7','#a78bfa','#38bdf8','#34d399'];
function spawnParticles(lane, type) {
  const x = 15 + lane * 120 + 45;
  const y = HIT_Y;
  const color = laneColors[lane];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.background = color;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    stage.appendChild(p);
    const angle = (i / 8) * Math.PI * 2;
    const speed = 60 + Math.random() * 60;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    let start = null;
    function animP(ts) {
      if (!start) start = ts;
      const t = (ts - start) / 500;
      if (t >= 1) { p.remove(); return; }
      p.style.left = (x + dx * t) + 'px';
      p.style.top  = (y + dy * t + 60 * t * t) + 'px';
      p.style.opacity = 1 - t;
      requestAnimationFrame(animP);
    }
    requestAnimationFrame(animP);
  }
}

function gameLoop(ts) {
  const elapsed = (ts - startTime) / 1000;
  if (elapsed >= SONG_DURATION) {
    endGame();
    return;
  }
  progressFill.style.width = (elapsed / SONG_DURATION * 100) + '%';
  updateNotes(ts);
  raf = requestAnimationFrame(gameLoop);
}

function startGame() {
  score = 0; combo = 0; perfect = 0; miss = 0;
  spawnIndex = 0; activeNotes = [];
  scoreVal.textContent = '0';
  comboVal.textContent = '0';
  perfectVal.textContent = '0';
  progressFill.style.width = '0%';
  // remove leftover notes
  stage.querySelectorAll('.note').forEach(n => n.remove());
  overlay.style.display = 'none';
  running = true;
  startTime = performance.now();
  raf = requestAnimationFrame(gameLoop);
}

function endGame() {
  running = false;
  cancelAnimationFrame(raf);
  const total = perfect + miss + (activeNotes.length);
  const acc = total > 0 ? Math.round(perfect / total * 100) : 0;
  let grade = acc >= 95 ? 'S' : acc >= 85 ? 'A' : acc >= 70 ? 'B' : acc >= 50 ? 'C' : 'D';
  overlay.innerHTML = \`
    <h2>🎉 RESULT</h2>
    <div class="result">Grade: <b style="font-size:2rem;color:#fbbf24">\${grade}</b></div>
    <div class="result">Score: \${score.toLocaleString()}</div>
    <div class="result">Perfect: \${perfect} &nbsp; Miss: \${miss} &nbsp; Accuracy: \${acc}%</div>
    <button class="start-btn" id="startBtn">PLAY AGAIN</button>
  \`;
  overlay.style.display = 'flex';
  document.getElementById('startBtn').addEventListener('click', startGame);
}

startBtn.addEventListener('click', startGame);

// keyboard
const KEY_MAP = { d: 0, f: 1, j: 2, k: 3 };
document.addEventListener('keydown', e => {
  const lane = KEY_MAP[e.key.toLowerCase()];
  if (lane !== undefined) hitLane(lane);
});

// touch / click on key buttons
document.querySelectorAll('.key-btn').forEach(btn => {
  const lane = parseInt(btn.dataset.lane);
  btn.addEventListener('pointerdown', e => { e.preventDefault(); hitLane(lane); });
});

// visual audio pulse using AudioContext
let actx = null;
function initAudio() {
  actx = new (window.AudioContext || window.webkitAudioContext)();
}
document.addEventListener('keydown', () => { if (!actx) initAudio(); }, { once: true });
startBtn.addEventListener('click', () => { if (!actx) initAudio(); }, { once: true });

// Simple synthesized beat tick
function playTick(lane) {
  if (!actx) return;
  const freqs = [220, 330, 440, 550];
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.connect(g); g.connect(actx.destination);
  o.frequency.value = freqs[lane];
  o.type = 'square';
  g.gain.setValueAtTime(0.08, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.1);
  o.start(); o.stop(actx.currentTime + 0.1);
}

// patch hitLane to also play tick
const _hitLane = hitLane;
window.hitLane = function(lane) { playTick(lane); _hitLane(lane); };
document.addEventListener('keydown', e => {
  const lane = KEY_MAP[e.key.toLowerCase()];
  if (lane !== undefined) playTick(lane);
});
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(HTML);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`RhythmFun running at http://localhost:${PORT}`);
});
