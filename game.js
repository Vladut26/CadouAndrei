/* ==========================
   CANVAS SETUP
========================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ==========================
   CONSTANTS & VARIABLES
========================== */
// Base sizes (Laptop view)
const BASE_FISH_SIZE = 100;
const BASE_NET_WIDTH = 180;
const BASE_NET_HEIGHT = 160;
const LEFTSIDE_COL_WIDTH = 50;
const RIGHTSIDE_COL_WIDTH = 50;

// Dynamic sizes (will change on resize)
let fishSize = BASE_FISH_SIZE;
let netWidth = BASE_NET_WIDTH;
let netHeight = BASE_NET_HEIGHT;
let globalScale = 1; // 1 for laptop, < 1 for mobile

const BASE_FISH_SPEED = 3;

/* ==========================
   GAME STATE
========================== */
let score = 0;
let fishSpeed = BASE_FISH_SPEED;
let paused = false;
const MAX_HEARTS = 3;
let hearts = MAX_HEARTS;
let particles = [];

/* ==========================
   FISH STATE
========================== */
let fish = {
  x: 0,
  y: -BASE_FISH_SIZE,
  img: null,
  value: 0 
};

/* ==========================
   NET STATE
========================== */
let net = {
  x: 0,
  y: 0
};

/* ==========================
   RESIZE & RESPONSIVENESS
========================== */
function resize() {
  const container = document.getElementById('game-container');
  // Use container dimensions to fit perfectly within the div
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  // Determine Scale Factor
  // If width is less than 900px (Mobile landscape), scale down
  if (canvas.width < 900) {
      // Calculate a ratio based on 900px, but clamp it so it doesn't get too tiny
      globalScale = Math.max(0.5, canvas.width / 1100); 
  } else {
      globalScale = 1; // Laptop/Desktop remains perfect
  }

  // Update game object dimensions based on scale
  fishSize = BASE_FISH_SIZE * globalScale;
  netWidth = BASE_NET_WIDTH * globalScale;
  netHeight = BASE_NET_HEIGHT * globalScale;
}

window.addEventListener("resize", resize);
// Call resize immediately after load
window.addEventListener("load", resize);
resize();

/* ==========================
   IMAGES
========================== */
const pond = new Image();
pond.src = "assets/pondlandscape.png";

const bootImg = new Image();
bootImg.src = "assets/boot.png"; 

// Fish Images
const fishImages = ["beta.png", "carp.png", "grasscarp.png", "catfish.png"].map(src => {
  const img = new Image();
  img.src = "assets/" + src;
  return img;
});

const netImg = new Image();
netImg.src = "assets/net1bg.png";

// Character Loading
const urlParams = new URLSearchParams(window.location.search);
const characterMode = urlParams.get('character');

let selectedHumanFiles = [];
if (characterMode === 'vlad') {
    selectedHumanFiles = ["vlad1.png", "vlad2.png", "vlad3.png", "vlad4.png"];
} else if (characterMode === 'catol') {
    selectedHumanFiles = ["catol1.png", "catol2.png", "catol3.png", "catol4.png"];
} else {
    selectedHumanFiles = ["andrei1.png", "andrei2.png", "andrei3.png", "andrei4.png"];
}

const humans = selectedHumanFiles.map(src => {
  const img = new Image();
  img.src = "assets/" + src;
  return img;
});

/* ==========================
   INPUTS
========================== */
// Mouse
canvas.addEventListener("mousemove", e => {
  if (paused) return;
  const rect = canvas.getBoundingClientRect();
  // Center net on mouse
  net.x = (e.clientX - rect.left) - netWidth / 2;
  net.y = (e.clientY - rect.top) - netHeight / 2;
});

// Keyboard
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if(paused) {
        if(hearts > 0) paused = false;
    } else {
        paused = true;
    }
  }
});

// Touch
canvas.addEventListener("touchmove", e => {
  if (paused) return;
  e.preventDefault(); 
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0]; 
  // Center net on touch
  net.x = (touch.clientX - rect.left) - netWidth / 2;
  net.y = (touch.clientY - rect.top) - netHeight / 2;
}, { passive: false });

/* ==========================
   GAME LOGIC
========================== */
function resetFish() {
  const minX = LEFTSIDE_COL_WIDTH;
  const maxX = canvas.width - RIGHTSIDE_COL_WIDTH - fishSize;

  fish.x = minX + Math.random() * (maxX - minX);
  fish.y = -fishSize; // Start above screen

  const rand = Math.random(); 

  if (rand < 0.50) {
      fish.img = fishImages[1]; 
      fish.value = 1;
  } else if (rand < 0.75) {
      fish.img = fishImages[2]; 
      fish.value = 3;
  } else if (rand < 0.90) {
      fish.img = fishImages[3]; 
      fish.value = 3;
  } else {
      fish.img = fishImages[0]; 
      fish.value = 5;
  }
}

function getHumanImage() {
  if (score >= 100) return humans[3];
  if (score >= 50) return humans[2];
  if (score >= 20) return humans[1];
  return humans[0];
}

function createFloatingText(x, y, points) {
    let color = "#ffffff";
    if (points === 5) color = "#ffd700";
    else if (points === 3) color = "#4facfe";

    particles.push({
        x: x,
        y: y,
        text: "+" + points,
        color: color,
        life: 40,
        speedY: 2
    });
}

function checkCatch() {
  // Simple AABB Collision Detection
  // Note: Using dynamic fishSize/netWidth variables now
  const hit =
    fish.x + fishSize > net.x &&
    fish.x < net.x + netWidth &&
    fish.y + fishSize > net.y &&
    fish.y < net.y + netHeight;

  if (hit) {
    score += fish.value;
    createFloatingText(fish.x + fishSize/2, fish.y, fish.value);
    fishSpeed += 0.2;
    resetFish();
  }
}

/* ==========================
   DRAW
========================== */
function drawBackground() {
  ctx.drawImage(pond, 0, 0, canvas.width, canvas.height);
}

function drawUI() {
  // Scale UI positions and font sizes
  const startX = 30 * globalScale; 
  const heartSpacing = 45 * globalScale;
  const heartY = 60 * globalScale;
  const scoreY = 110 * globalScale;
  const avatarY = 220 * globalScale;
  
  // Font sizes
  const heartSize = Math.floor(40 * globalScale);
  const scoreSize = Math.floor(30 * globalScale);
  const avatarW = 140 * globalScale;
  const avatarH = 240 * globalScale;

  /* ---------- HEARTS ---------- */
  ctx.save(); 
  ctx.font = `${heartSize}px 'Poppins', sans-serif`; 
  ctx.fillStyle = "#ff4b4b"; 
  ctx.shadowColor = "#ff0000"; 
  ctx.shadowBlur = 20; 
  for (let i = 0; i < hearts; i++) {
    ctx.fillText("❤", startX + i * heartSpacing, heartY);
  }
  ctx.restore(); 

  /* ---------- SCORE ---------- */
  ctx.save();
  ctx.font = `600 ${scoreSize}px 'Poppins', sans-serif`; 
  ctx.fillStyle = "#ffffff"; 
  ctx.shadowColor = "#4facfe"; 
  ctx.shadowBlur = 15;
  ctx.fillText("Score: " + score, startX, scoreY);
  ctx.restore();

  /* ---------- HUMAN ---------- */
  ctx.drawImage(getHumanImage(), startX, avatarY, avatarW, avatarH);

  /* ---------- PARTICLES ---------- */
  ctx.save();
  ctx.font = `bold ${Math.floor(28 * globalScale)}px sans-serif`;
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;
  
  for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      
      p.y -= p.speedY;
      p.life--;       
  }
  particles = particles.filter(p => p.life > 0);
  ctx.restore();


  /* ---------- GAME OVER ---------- */
  if (hearts <= 0) {
    ctx.fillStyle = "rgba(0,0,0,0.7)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.shadowColor = "white";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "white";
    // Scale Game Over text too
    ctx.font = `bold ${Math.floor(48 * globalScale)}px 'Poppins', sans-serif`;
    ctx.textAlign = "center"; 
    
    ctx.fillText(
      "Sugi pula, ai pierdut!",
      canvas.width / 2, 
      canvas.height / 2 
    );
    ctx.restore();
  }

  /* ---------- PAUSED ---------- */
  if (paused && hearts > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.shadowColor = "#4facfe";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "white";
    ctx.font = `bold ${Math.floor(60 * globalScale)}px 'Poppins', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }
}

function drawGame() {
  if (fish.img) {
    // Draw fish with dynamic size
    ctx.drawImage(fish.img, fish.x, fish.y, fishSize, fishSize);
  }
  if (!paused && hearts > 0) {
    // Draw net with dynamic size
    ctx.drawImage(netImg, net.x, net.y, netWidth, netHeight);
  }
}

/* ==========================
   GAME LOOP
========================== */
function update() {
  if (paused || hearts <= 0) return;

  fish.y += fishSpeed;

  if (fish.y > canvas.height) {
    hearts--;
    resetFish();
  }

  checkCatch();
}

function loop() {
  drawBackground();
  update();
  drawGame();
  drawUI();

  requestAnimationFrame(loop);
}

/* ==========================
   NAVBAR ACTIONS
========================== */
function restartGame() {
  score = 0;
  fishSpeed = BASE_FISH_SPEED;
  hearts = MAX_HEARTS;
  paused = false;
  particles = [];
  resetFish();
}

function goHome() {
  window.location.href = "index.html";
}

function openInfo() {
  const modal = document.getElementById("infoModal");
  if(modal) modal.style.display = "flex";
  document.body.style.cursor = "default";
  paused = true;
}

function closeInfo() {
  const modal = document.getElementById("infoModal");
  if(modal) modal.style.display = "none";
  document.body.style.cursor = "none";
  paused = false;
}

/* expose to HTML */
window.restartGame = restartGame;
window.goHome = goHome;
window.openInfo = openInfo;
window.closeInfo = closeInfo;

/* ==========================
   START
========================== */
resetFish();
loop();