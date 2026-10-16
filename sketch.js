// ==================================================
// ドット絵レーシングゲーム Complete Code (分身アイテム別枠出現版)
// ==================================================

// --------------------------------------------------
// 1. 変数・アセット管理
// --------------------------------------------------
let carSheets = {};
let carFrames = { yellow: [], purple: [], orange: [], red: [] };
let coinSheet, coinFrames = [];
let coinEffectSheet, coinEffectFrames = [];
let barrierItemSheet, barrierItemFrames = [];
let barrierActiveSheet, barrierActiveFrames = [];
let nitroItemSheet, nitroItemFrames = [];
let nitroActiveSheet, nitroActiveFrames = [];
let cloneItemSheet, cloneItemFrames = [];

const FRAME_W = 32;
const FRAME_H = 32;
const CAR_COLS = 4;
const CAR_COUNTS = { yellow: 17, purple: 17, orange: 17, red: 14 };

const COIN_COLS = 4;
const TOTAL_COIN_FRAMES = 13;
const EFFECT_COLS = 2;
const TOTAL_EFFECT_FRAMES = 5;

const BARRIER_ITEM_COLS = 3;
const BARRIER_ITEM_TOTAL = 10;
const BARRIER_ACTIVE_COLS = 3;
const BARRIER_ACTIVE_TOTAL = 10;

const NITRO_ITEM_COLS = 3;
const TOTAL_NITRO_ITEM_FRAMES = 10;
const NITRO_ACTIVE_COLS = 5;
const TOTAL_NITRO_ACTIVE_FRAMES = 26;
const LOOP_START_INDEX = 7;

const CLONE_ITEM_COLS = 4;
const TOTAL_CLONE_ITEM_FRAMES = 16;

// アニメーション切り替え速度
const CAR_ANIM_SPEED = 6;
const ITEM_ANIM_SPEED = 6;
const EFFECT_ANIM_SPEED = 5;

// ゲーム状態管理
let gameState = "LOADING"; // LOADING -> HOWTO -> SELECT -> START -> PLAY -> GAMEOVER
let selectedChar = 0; // 0: アイテム型(yellow), 1: 分身型(purple), 2: ハード型(orange)
let charTypes = ['yellow', 'purple', 'orange'];
let charNames = ["アイテムマスター", "分身ドライブ", "ハードレーサー"];

let playerX, playerY;
let playerSize = 40;
let basePlayerSpeed = 8;
let playerSpeed = 8;

let obstacles = [];
let obstacleSpeed = 6;

let coinX, coinY;
let coinSize = 25;
let coinSpeed = 5;

// アイテム管理配列（複数アイテムの同時出現に対応）
let items = [];

let boostTimer = 0;
let barrierTimer = 0;
let cloneTimer = 0;

let score = 0;
let highScore = 0;        // 端末ごとの最高スコア
let isNewRecord = false;   // ハイスコア更新フラグ
let justStarted = false;
let gameOverTimer = 0;

let effects = [];

// サウンド用
let bgmOsc;
let audioStarted = false;
let bgmNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
let bgmIndex = 0;

// --------------------------------------------------
// 2. 初期設定（p5.js 2.0 対応 setup）
// --------------------------------------------------
async function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  imageMode(CENTER);
  noSmooth();

  // 端末のローカルストレージから最高記録を読み込み
  let savedHighScore = localStorage.getItem('racing_high_score');
  if (savedHighScore !== null) {
    highScore = parseInt(savedHighScore, 10);
  }

  // サウンド初期化
  bgmOsc = new p5.Oscillator('square');
  bgmOsc.amp(0.05);

  // アセット非同期読み込み
  carSheets.yellow    = await loadImage('New Piskel (2).png');
  carSheets.purple    = await loadImage('New Piskel (3).png');
  carSheets.orange    = await loadImage('New Piskel (4).png');
  carSheets.red       = await loadImage('New Piskel.png');

  coinSheet          = await loadImage('New Piskel.c.png');
  coinEffectSheet    = await loadImage('New Piskel.getting coins_effect.png');
  barrierItemSheet   = await loadImage('New Piskel item.barrier.png');
  barrierActiveSheet = await loadImage('New Piskel.barrier activitying.png');
  nitroItemSheet     = await loadImage('New Piskel.item nitro fuel.png');
  nitroActiveSheet   = await loadImage('New Piskel.nitro activitying.png');
  cloneItemSheet     = await loadImage('New Piskel.clone.png');

  // コマ切り出し処理
  let allCarTypes = ['yellow', 'purple', 'orange', 'red'];
  for (let type of allCarTypes) {
    for (let i = 0; i < CAR_COUNTS[type]; i++) {
      let col = i % CAR_COLS;
      let row = floor(i / CAR_COLS);
      carFrames[type].push(carSheets[type].get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
    }
  }

  for (let i = 0; i < TOTAL_COIN_FRAMES; i++) {
    let col = i % COIN_COLS;
    let row = floor(i / COIN_COLS);
    coinFrames.push(coinSheet.get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
  }

  for (let i = 0; i < TOTAL_EFFECT_FRAMES; i++) {
    let col = i % EFFECT_COLS;
    let row = floor(i / EFFECT_COLS);
    coinEffectFrames.push(coinEffectSheet.get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
  }

  for (let i = 0; i < BARRIER_ITEM_TOTAL; i++) {
    let col = i % BARRIER_ITEM_COLS;
    let row = floor(i / BARRIER_ITEM_COLS);
    barrierItemFrames.push(barrierItemSheet.get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
  }
  for (let i = 0; i < BARRIER_ACTIVE_TOTAL; i++) {
    let col = i % BARRIER_ACTIVE_COLS;
    let row = floor(i / BARRIER_ACTIVE_COLS);
    barrierActiveFrames.push(barrierActiveSheet.get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
  }

  for (let i = 0; i < TOTAL_NITRO_ITEM_FRAMES; i++) {
    let col = i % NITRO_ITEM_COLS;
    let row = floor(i / NITRO_ITEM_COLS);
    nitroItemFrames.push(nitroItemSheet.get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
  }
  for (let i = 0; i < TOTAL_NITRO_ACTIVE_FRAMES; i++) {
    let col = i % NITRO_ACTIVE_COLS;
    let row = floor(i / NITRO_ACTIVE_COLS);
    nitroActiveFrames.push(nitroActiveSheet.get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
  }

  for (let i = 0; i < TOTAL_CLONE_ITEM_FRAMES; i++) {
    let col = i % CLONE_ITEM_COLS;
    let row = floor(i / CLONE_ITEM_COLS);
    cloneItemFrames.push(cloneItemSheet.get(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H));
  }

  resetGame();
  gameState = "HOWTO";
}

// --------------------------------------------------
// 3. 描画・メイン処理（draw）
// --------------------------------------------------
function draw() {
  background(50);

  // BGM制御
  if (audioStarted && gameState === "PLAY") {
    let tempo = (boostTimer > 0) ? 8 : 12;
    if (frameCount % tempo === 0) {
      let freq = bgmNotes[bgmIndex];
      if (boostTimer > 0) freq *= 1.25;
      bgmOsc.freq(freq);
      bgmIndex = (bgmIndex + 1) % bgmNotes.length;
    }
  }

  if (gameState === "LOADING") {
    fill(255);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("ローディング中...", width / 2, height / 2);

  } else if (gameState === "HOWTO") {
    drawHowToPlay();

  } else if (gameState === "SELECT") {
    drawCharacterSelect();

  } else if (gameState === "START") {
    fill(255);
    textSize(26);
    textAlign(CENTER, CENTER);
    text(charNames[selectedChar] + " で出撃！", width / 2, height / 3);

    let carTypeKey = charTypes[selectedChar];
    let frameIdx = floor(frameCount / CAR_ANIM_SPEED) % CAR_COUNTS[carTypeKey];
    image(carFrames[carTypeKey][frameIdx], width / 2, height / 3 + 60, 64, 64);

    textSize(14);
    fill(200);
    let desc = "";
    if (selectedChar === 0) {
      desc = "特徴: 通常アイテムの出現間隔が短い！\nアイテムをたくさん獲得して有利に進めよう！";
    } else if (selectedChar === 1) {
      desc = "特徴: 通常アイテム枠とは【別枠】で\n専用「分身アイテム」が独立出現する！";
    } else if (selectedChar === 2) {
      desc = "特徴: 敵車両の数が激増（2〜4台）！\n難易度は高いが獲得スコアが常に2倍！";
    }
    text(desc, width / 2, height / 2 + 30);

    textSize(18);
    fill(255);
    text("画面タップ または キー入力でスタート！", width / 2, height * 0.75);

  } else if (gameState === "PLAY") {

    // --- ① パワーアップタイマー制御 ---
    if (boostTimer > 0) {
      boostTimer--;
      playerSpeed = basePlayerSpeed * 1.6;
    } else {
      playerSpeed = basePlayerSpeed;
    }

    if (barrierTimer > 0) barrierTimer--;
    if (cloneTimer > 0) cloneTimer--;

    // --- ② プレイヤー移動制御 ---
    let moveLeft = keyIsDown(LEFT_ARROW) || keyIsDown(65) || keyIsDown(97) || (keyIsPressed && (key === 'a' || key === 'A'));
    let moveRight = keyIsDown(RIGHT_ARROW) || keyIsDown(68) || keyIsDown(100) || (keyIsPressed && (key === 'd' || key === 'D'));

    if (mouseIsPressed && !justStarted) {
      if (mouseX < width / 2) moveLeft = true;
      else moveRight = true;
    }

    if (moveLeft) playerX -= playerSpeed;
    if (moveRight) playerX += playerSpeed;

    if (!mouseIsPressed) justStarted = false;

    playerX = constrain(playerX, 40, width - 40);

    // --- ③ 障害物の目標数管理 ---
    let targetObstacleCount = 1;
    if (selectedChar === 2) {
      targetObstacleCount = (score >= 500) ? 4 : 2;
    } else {
      targetObstacleCount = (score >= 500) ? 3 : 1;
    }

    while (obstacles.length < targetObstacleCount) {
      let newObs = getSafeObstaclePosition(obstacles);
      obstacles.push(newObs);
    }

    // --- ④ 障害物（赤・対向車）の移動と判定 ---
    for (let i = 0; i < obstacles.length; i++) {
      let obs = obstacles[i];
      obs.y += obstacleSpeed;

      let redFrameIdx = floor(frameCount / CAR_ANIM_SPEED) % CAR_COUNTS['red'];
      push();
      translate(obs.x, obs.y);
      rotate(PI);
      image(carFrames['red'][redFrameIdx], 0, 0, 64, 64);
      pop();

      if (obs.y > height + 40) {
        let resetPos = getSafeObstaclePosition(obstacles, i);
        obs.x = resetPos.x;
        obs.y = resetPos.y;

        let baseAdd = (selectedChar === 2) ? 20 : 10;
        if (boostTimer > 0) baseAdd *= 2;
        score += baseAdd;

        if (cloneTimer > 0) {
          let leftCloneX = playerX - 110;
          let rightCloneX = playerX + 110;
          if (abs(obs.x - leftCloneX) > playerSize) score += 10;
          if (abs(obs.x - rightCloneX) > playerSize) score += 10;
        }

        obstacleSpeed += 0.15;
      }

      let d = dist(playerX, playerY, obs.x, obs.y);
      if (d < (playerSize / 2 + 20)) {
        if (barrierTimer > 0) {
          playBarrierBreakSound();
          effects.push(new VisualEffect(obs.x, obs.y, coinEffectFrames, 60));
          let resetPos = getSafeObstaclePosition(obstacles, i);
          obs.x = resetPos.x;
          obs.y = resetPos.y;
          score += 20;
        } else {
          playCrashSound();
          stopBGM();
          
          if (score > highScore) {
            highScore = score;
            isNewRecord = true;
            localStorage.setItem('racing_high_score', highScore);
          } else {
            isNewRecord = false;
          }

          gameState = "GAMEOVER";
          gameOverTimer = 0;
        }
      }
    }

    // --- ⑤ コインの処理 ---
    coinY += coinSpeed;
    if (coinY > height + 40) spawnCoin();

    let coinFrameIdx = floor(frameCount / ITEM_ANIM_SPEED) % TOTAL_COIN_FRAMES;
    image(coinFrames[coinFrameIdx], coinX, coinY, 32, 32);

    let hitCoin = checkHitWithClones(coinX, coinY, coinSize);
    if (hitCoin) {
      playCoinSound();
      effects.push(new VisualEffect(coinX, coinY, coinEffectFrames, 48));
      score += 50;
      spawnCoin();
    }

    // --- ⑥ パワーアップアイテムの出現タイマー＆移動処理 ---
    // 枠1: 通常アイテムのタイマー処理（キャラ0は頻度高め）
    let itemSpawnInterval = (selectedChar === 0) ? 180 : 300; // フレーム単位
    if (frameCount % itemSpawnInterval === 0) {
      spawnNormalItem();
    }

    // 枠2: 分身キャラ（キャラ1）専用の【別枠】タイマー処理
    if (selectedChar === 1 && frameCount % 360 === 0) {
      if (random() < 0.7) {
        spawnCloneItem();
      }
    }

    // アイテム配列の更新と描画・当たり判定
    for (let i = items.length - 1; i >= 0; i--) {
      let itm = items[i];
      itm.y += itm.speed;

      // 描画
      if (itm.type === "BOOST") {
        let idx = floor(frameCount / ITEM_ANIM_SPEED) % TOTAL_NITRO_ITEM_FRAMES;
        image(nitroItemFrames[idx], itm.x, itm.y, 40, 40);
      } else if (itm.type === "BARRIER") {
        let idx = floor(frameCount / ITEM_ANIM_SPEED) % BARRIER_ITEM_TOTAL;
        image(barrierItemFrames[idx], itm.x, itm.y, 40, 40);
      } else if (itm.type === "CLONE") {
        let idx = floor(frameCount / ITEM_ANIM_SPEED) % TOTAL_CLONE_ITEM_FRAMES;
        image(cloneItemFrames[idx], itm.x, itm.y, 40, 40);
      }

      // 当たり判定
      let hitItem = checkHitWithClones(itm.x, itm.y, 25);
      if (hitItem) {
        playItemSound();
        if (itm.type === "BOOST") boostTimer = 180;
        else if (itm.type === "BARRIER") barrierTimer = 180;
        else if (itm.type === "CLONE") cloneTimer = 300;

        items.splice(i, 1);
      } else if (itm.y > height + 40) {
        items.splice(i, 1);
      }
    }

    // --- ⑦ 中央線描画 ---
    stroke(255, 100);
    strokeWeight(4);
    line(width / 2, 0, width / 2, height);
    noStroke();

    // --- ⑧ 自機・分身・オーラ描画 ---
    let myTypeKey = charTypes[selectedChar];
    let myCarIdx = floor(frameCount / CAR_ANIM_SPEED) % CAR_COUNTS[myTypeKey];
    let myCarImg = carFrames[myTypeKey][myCarIdx];

    if (boostTimer > 0) {
      let loopLen = TOTAL_NITRO_ACTIVE_FRAMES - LOOP_START_INDEX;
      let nitroIdx = LOOP_START_INDEX + (floor(frameCount / 4) % loopLen);
      image(nitroActiveFrames[nitroIdx], playerX, playerY + 35, 48, 64);
    }

    if (cloneTimer > 0) {
      push();
      tint(255, 160);
      image(myCarImg, playerX - 110, playerY, 64, 64);
      image(myCarImg, playerX + 110, playerY, 64, 64);
      pop();
    }

    image(myCarImg, playerX, playerY, 64, 64);

    if (barrierTimer > 0) {
      let bIdx = floor(frameCount / ITEM_ANIM_SPEED) % BARRIER_ACTIVE_TOTAL;
      push();
      tint(255, 210);
      image(barrierActiveFrames[bIdx], playerX, playerY, 80, 80);
      pop();
    }

    for (let i = effects.length - 1; i >= 0; i--) {
      effects[i].update();
      effects[i].display();
      if (effects[i].isFinished) effects.splice(i, 1);
    }

    // --- ⑨ UI表示（スコア ＆ ベストスコア） ---
    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text("スコア: " + score, 20, 20);

    fill(255, 215, 0); // 金色
    textSize(14);
    text("ベスト: " + Math.max(score, highScore), 20, 48);

    textSize(14);
    let uiY = 72;
    if (boostTimer > 0) {
      fill(0, 230, 255);
      text("🚀 スピードUP: " + ceil(boostTimer / 60) + "秒", 20, uiY);
      uiY += 22;
    }
    if (barrierTimer > 0) {
      fill(50, 255, 100);
      text("🛡️ バリア: " + ceil(barrierTimer / 60) + "秒", 20, uiY);
      uiY += 22;
    }
    if (cloneTimer > 0) {
      fill(200, 50, 255);
      text("👥 分身: " + ceil(cloneTimer / 60) + "秒", 20, uiY);
    }

  } else if (gameState === "GAMEOVER") {
    gameOverTimer++;

    fill(255, 50, 50);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 3 - 20); // ★ あえて英語のまま維持！

    fill(255);
    textSize(22);
    text("スコア: " + score, width / 2, height / 2 - 40);

    if (isNewRecord) {
      fill(255, 215, 0);
      textSize(20);
      text("🎉 新記録! 🎉", width / 2, height / 2 - 10);
    } else {
      fill(200);
      textSize(16);
      text("ベストスコア: " + highScore, width / 2, height / 2 - 10);
    }

    let rank = "D (無免許ドライバー)";
    if (score >= 3500)      rank = "S+ (神ドライバー)";
    else if (score >= 2000) rank = "S (伝説のドライバー)";
    else if (score >= 1000) rank = "A (プロドライバー)";
    else if (score >= 400)  rank = "B (一般ドライバー)";
    else if (score >= 100)  rank = "C (教習所ドライバー)";

    textSize(18);
    fill(255, 215, 0);
    text("ランク評価: " + rank, width / 2, height * 0.58);

    let alphaVal = map(gameOverTimer, 0, 60, 0, 180, true);
    textSize(15);
    fill(180, alphaVal);
    text("画面タップ または キー入力でタイトルへ", width / 2, height * 0.75);
  }
}

// --------------------------------------------------
// 4. 操作説明（遊び方）描画
// --------------------------------------------------
function drawHowToPlay() {
  fill(255);
  textSize(28);
  textAlign(CENTER, CENTER);
  text("遊び方", width / 2, height * 0.15);

  stroke(150);
  strokeWeight(2);
  line(width / 2, height * 0.25, width / 2, height * 0.55);
  noStroke();

  fill(255, 255, 255, 20);
  rect(width / 4, height * 0.4, width * 0.4, height * 0.3, 10);
  rect(width * 0.75, height * 0.4, width * 0.4, height * 0.3, 10);

  fill(255);
  textSize(20);
  text("← 左に移動", width / 4, height * 0.35);
  text("右に移動 →", width * 0.75, height * 0.35);

  textSize(13);
  fill(200);
  text("PC: A キー / ← キー\nスマホ: 画面左側長押し", width / 4, height * 0.45);
  text("PC: D キー / → キー\nスマホ: 画面右側長押し", width * 0.75, height * 0.45);

  fill(255);
  textSize(16);
  let instY = height * 0.62;
  text("【 操作のコツ 】", width / 2, instY);

  textSize(14);
  fill(220);
  text("・押し続けるとなめらかに走行できます", width / 2, instY + 35);
  text("・一瞬タップ／入力することで細かい微調整が可能です", width / 2, instY + 65);

  let btnW = min(width * 0.8, 280);
  fill(0, 180, 255);
  rect(width / 2, height * 0.85, btnW, 50, 25);

  fill(255);
  textSize(18);
  text("次へ（マシン選択）", width / 2, height * 0.85);
}

// --------------------------------------------------
// 5. キャラクター選択画面
// --------------------------------------------------
function drawCharacterSelect() {
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("マシンを選択してください", width / 2, height * 0.10);

  fill(255, 215, 0);
  textSize(15);
  text("🏆 今までのベストスコア: " + highScore, width / 2, height * 0.16);

  let boxWidth = min(width * 0.85, 340);
  let boxHeight = 90;
  let startY = height * 0.28;

  for (let i = 0; i < 3; i++) {
    let y = startY + i * 110;
    let typeKey = charTypes[i];

    fill(selectedChar === i ? 80 : 40);
    stroke(selectedChar === i ? color(255, 215, 0) : 100);
    strokeWeight(selectedChar === i ? 3 : 1);
    rect(width / 2, y, boxWidth, boxHeight, 10);
    noStroke();

    let fIdx = floor(frameCount / CAR_ANIM_SPEED) % CAR_COUNTS[typeKey];
    image(carFrames[typeKey][fIdx], width / 2 - boxWidth / 2 + 40, y, 48, 48);

    textAlign(LEFT, CENTER);
    fill(255);
    textSize(18);
    text(charNames[i], width / 2 - boxWidth / 2 + 75, y - 15);

    fill(180);
    textSize(12);
    let sub = "";
    if (i === 0) sub = "通常アイテムの出現率UP！";
    if (i === 1) sub = "別枠で「分身」アイテムが出現！";
    if (i === 2) sub = "難易度高 / 回避スコア2倍！";
    text(sub, width / 2 - boxWidth / 2 + 75, y + 15);
  }

  fill(0, 180, 255);
  rect(width / 2, height * 0.85, boxWidth, 50, 25);
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("このマシンでスタート", width / 2, height * 0.85);
}

// --------------------------------------------------
// 6. サウンド合成処理
// --------------------------------------------------
function initAudio() {
  if (!audioStarted) {
    userStartAudio();
    audioStarted = true;
  }
}

function startBGM() {
  if (audioStarted) bgmOsc.start();
}

function stopBGM() {
  bgmOsc.stop();
}

function playCoinSound() {
  if (!audioStarted) return;
  let osc = new p5.Oscillator('triangle');
  osc.start();
  osc.freq(987.77);
  osc.amp(0.15);
  setTimeout(() => { osc.freq(1318.51); }, 60);
  setTimeout(() => { osc.stop(); }, 160);
}

function playItemSound() {
  if (!audioStarted) return;
  let osc = new p5.Oscillator('square');
  osc.start();
  osc.amp(0.12);
  let freqs = [523.25, 659.25, 783.99, 1046.50];
  freqs.forEach((f, idx) => {
    setTimeout(() => { osc.freq(f); }, idx * 40);
  });
  setTimeout(() => { osc.stop(); }, 200);
}

function playBarrierBreakSound() {
  if (!audioStarted) return;
  let osc = new p5.Oscillator('sawtooth');
  osc.start();
  osc.freq(400);
  osc.amp(0.2);
  osc.freq(100, 0.1);
  setTimeout(() => { osc.stop(); }, 100);
}

function playCrashSound() {
  if (!audioStarted) return;
  let noise = new p5.Noise('brown');
  noise.start();
  noise.amp(0.3);
  noise.amp(0, 0.4);
  setTimeout(() => { noise.stop(); }, 400);
}

// --------------------------------------------------
// 7. パーティクルエフェクトクラス
// --------------------------------------------------
class VisualEffect {
  constructor(x, y, framesArray, renderSize = 48) {
    this.x = x;
    this.y = y;
    this.frames = framesArray;
    this.renderSize = renderSize;
    this.currentFrame = 0;
    this.counter = 0;
    this.isFinished = false;
  }

  update() {
    this.counter++;
    if (this.counter >= EFFECT_ANIM_SPEED) {
      this.counter = 0;
      this.currentFrame++;
      if (this.currentFrame >= this.frames.length) {
        this.isFinished = true;
      }
    }
  }

  display() {
    if (!this.isFinished) {
      image(this.frames[this.currentFrame], this.x, this.y, this.renderSize, this.renderSize);
    }
  }
}

// --------------------------------------------------
// 8. 各種判定 & 操作・イベント関数
// --------------------------------------------------
function checkHitWithClones(targetX, targetY, targetSize) {
  let hitRadius = playerSize / 2 + targetSize / 2;
  if (dist(playerX, playerY, targetX, targetY) < hitRadius) return true;

  if (cloneTimer > 0) {
    let dLeft = dist(playerX - 110, playerY, targetX, targetY);
    let dRight = dist(playerX + 110, playerY, targetX, targetY);
    if (dLeft < hitRadius || dRight < hitRadius) return true;
  }
  return false;
}

function handleAdvanceState() {
  initAudio();

  if (gameState === "HOWTO") {
    gameState = "SELECT";
  } else if (gameState === "SELECT") {
    resetGame();
    gameState = "START";
  } else if (gameState === "START") {
    resetGame();
    gameState = "PLAY";
    justStarted = true;
    startBGM();
  } else if (gameState === "GAMEOVER") {
    if (gameOverTimer >= 60) {
      gameState = "SELECT";
    }
  }
}

function mousePressed() {
  initAudio();

  if (gameState === "HOWTO") {
    let btnW = min(width * 0.8, 280);
    if (abs(mouseX - width / 2) < btnW / 2 && abs(mouseY - height * 0.85) < 25) {
      gameState = "SELECT";
    }

  } else if (gameState === "SELECT") {
    let boxWidth = min(width * 0.85, 340);
    let startY = height * 0.28;

    for (let i = 0; i < 3; i++) {
      let y = startY + i * 110;
      if (abs(mouseX - width / 2) < boxWidth / 2 && abs(mouseY - y) < 45) {
        selectedChar = i;
      }
    }

    if (abs(mouseX - width / 2) < boxWidth / 2 && abs(mouseY - height * 0.85) < 25) {
      resetGame();
      gameState = "START";
    }

  } else if (gameState === "START") {
    resetGame();
    gameState = "PLAY";
    justStarted = true;
    startBGM();

  } else if (gameState === "GAMEOVER") {
    if (gameOverTimer >= 60) {
      gameState = "SELECT";
    }
  }
}

function keyPressed() {
  if (gameState !== "PLAY") {
    if (keyCode === ENTER || keyCode === 32) {
      handleAdvanceState();
    }
  }
}

function getSafeObstaclePosition(existingObstacles, ignoreIndex = -1) {
  let safeX, safeY;
  let isOverlap = true;
  let attempts = 0;

  while (isOverlap && attempts < 50) {
    safeX = random(50, width - 50);
    safeY = random(-350, -60);
    isOverlap = false;

    for (let j = 0; j < existingObstacles.length; j++) {
      if (j === ignoreIndex) continue;
      let other = existingObstacles[j];
      if (abs(safeX - other.x) < 60 && abs(safeY - other.y) < 80) {
        isOverlap = true;
        break;
      }
    }
    attempts++;
  }
  return { x: safeX, y: safeY };
}

function spawnCoin() {
  coinX = random(50, width - 50);
  coinY = random(-200, -100);
  coinSpeed = random(4, 7);
}

// 枠1: 通常アイテム生成（スピードUP または バリア）
function spawnNormalItem() {
  let type = random() < 0.5 ? "BOOST" : "BARRIER";
  items.push({
    x: random(50, width - 50),
    y: random(-200, -80),
    type: type,
    speed: random(4, 7)
  });
}

// 枠2: 分身型専用の【別枠】分身アイテム生成
function spawnCloneItem() {
  items.push({
    x: random(50, width - 50),
    y: random(-300, -150),
    type: "CLONE",
    speed: random(4, 7)
  });
}

function resetGame() {
  playerX = width / 2;
  playerY = height - 120;

  obstacles = [];
  items = [];
  effects = [];
  obstacleSpeed = 6;

  boostTimer = 0;
  barrierTimer = 0;
  cloneTimer = 0;
  gameOverTimer = 0;

  spawnCoin();
  spawnNormalItem();
  score = 0;
  justStarted = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}