/* ==========================
   CANVAS SETUP
========================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ==========================
   CONSTANTS
========================== */
const LEFTSIDE_COL_WIDTH = 50;
const RIGHTSIDE_COL_WIDTH = 50;

const FISH_SIZE = 100;
const NET_WIDTH = 180;
const NET_HEIGHT = 160;

const BASE_FISH_SPEED = 3;

/* ==========================
   GAME STATE
========================== */
let score = 0;
let fishSpeed = BASE_FISH_SPEED;
let paused = false;
const MAX_HEARTS = 3;
let hearts = MAX_HEARTS;

// NEW: Array to store floating text particles
let particles = [];

/* ==========================
   FISH STATE
========================== */
let fish = {
  x: 0,
  y: -FISH_SIZE,
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

// document.body.style.cursor = "none";

/* ==========================
   RESIZE
========================== */
function resize() {
  canvas.width = window.innerWidth - 20;
  canvas.height = window.innerHeight - 70;
}
window.addEventListener("resize", resize);
resize();

/* ==========================
   IMAGES
========================== */
/* ==========================
   IMAGES
========================== */
const pond = new Image();
pond.src = "assets/pondlandscape.png";

// You need a boot.png in assets
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

/* ----------------------------------------------------
   DYNAMIC CHARACTER LOADING
   This reads the ?character=... from the URL
---------------------------------------------------- */
const urlParams = new URLSearchParams(window.location.search);
const characterMode = urlParams.get('character'); // 'catol', 'vlad', or 'solo'

let selectedHumanFiles = [];

if (characterMode === 'vlad') {
    // IMAGES FOR VLAD GAME
    // Make sure you have these files in your assets folder!
    selectedHumanFiles = ["vlad1.png", "vlad2.png", "vlad3.png", "vlad4.png"];
} 
else if (characterMode === 'catol') {
    // IMAGES FOR CATOL GAME
    selectedHumanFiles = ["catol1.png", "catol2.png", "catol3.png", "catol4.png"];
} 
else {
    // DEFAULT / SOLO GAME (Original images)
    selectedHumanFiles = ["andrei1.png", "andrei2.png", "andrei3.png", "andrei4.png"];
}

// Load the selected images
const humans = selectedHumanFiles.map(src => {
  const img = new Image();
  // If the file doesn't exist, this might show nothing, so ensure filenames are correct
  img.src = "assets/" + src;
  return img;
});

/* ==========================
   INPUTS
========================== */
canvas.addEventListener("mousemove", e => {
  if (paused) return;
  const rect = canvas.getBoundingClientRect();
  net.x = (e.clientX - rect.left) - NET_WIDTH / 2;
  net.y = (e.clientY - rect.top) - NET_HEIGHT / 2;
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if(paused) {
        if(hearts > 0) paused = false;
    } else {
        paused = true;
    }
  }
});

canvas.addEventListener("touchmove", e => {
  if (paused) return;
  e.preventDefault(); 
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0]; 
  net.x = (touch.clientX - rect.left) - NET_WIDTH / 2;
  net.y = (touch.clientY - rect.top) - NET_HEIGHT / 2;
}, { passive: false });

/* ==========================
   GAME LOGIC
========================== */
function resetFish() {
  const minX = LEFTSIDE_COL_WIDTH;
  const maxX = canvas.width - RIGHTSIDE_COL_WIDTH - FISH_SIZE;

  fish.x = minX + Math.random() * (maxX - minX);
  fish.y = -FISH_SIZE;

  const rand = Math.random(); 

  if (rand < 0.50) {
      // Carp (+1)
      fish.img = fishImages[1]; 
      fish.value = 1;
  } else if (rand < 0.75) {
      // Grasscarp (+3)
      fish.img = fishImages[2]; 
      fish.value = 3;
  } else if (rand < 0.90) {
      // Catfish (+3)
      fish.img = fishImages[3]; 
      fish.value = 3;
  } else {
      // Beta (+5)
      fish.img = fishImages[0]; 
      fish.value = 5;
  }
}

function getHumanImage() {
  if (score >= 50) return humans[3];
  if (score >= 30) return humans[2];
  if (score >= 15) return humans[1];
  return humans[0];
}

// NEW: Function to create a floating text particle
function createFloatingText(x, y, points) {
    let color = "#ffffff"; // Default white
    if (points === 5) color = "#ffd700"; // Gold for rare fish
    else if (points === 3) color = "#4facfe"; // Blue for mid-tier

    particles.push({
        x: x,
        y: y,
        text: "+" + points,
        color: color,
        life: 40, // How many frames it lasts
        speedY: 2 // How fast it floats up
    });
}

function checkCatch() {
  const hit =
    fish.x + FISH_SIZE > net.x &&
    fish.x < net.x + NET_WIDTH &&
    fish.y + FISH_SIZE > net.y &&
    fish.y < net.y + NET_HEIGHT;

  if (hit) {
    score += fish.value;
    
    // Trigger floating text visual
    createFloatingText(fish.x + FISH_SIZE/2, fish.y, fish.value);
    
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
  const startX = 30;

  /* ---------- HEARTS ---------- */
  ctx.save(); 
  ctx.font = "40px 'Poppins', sans-serif"; 
  ctx.fillStyle = "#ff4b4b"; 
  ctx.shadowColor = "#ff0000"; 
  ctx.shadowBlur = 20; 
  for (let i = 0; i < hearts; i++) {
    ctx.fillText("❤", startX + i * 45, 60);
  }
  ctx.restore(); 

  /* ---------- SCORE ---------- */
  ctx.save();
  ctx.font = "600 30px 'Poppins', sans-serif"; 
  ctx.fillStyle = "#ffffff"; 
  ctx.shadowColor = "#4facfe"; 
  ctx.shadowBlur = 15;
  ctx.fillText("Score: " + score, startX, 110);
  ctx.restore();

  /* ---------- HUMAN ---------- */
  ctx.drawImage(getHumanImage(), startX, 220, 140, 240);

  /* ---------- NEW: DRAW PARTICLES ---------- */
  ctx.save();
  ctx.font = "bold 28px sans-serif";
  ctx.shadowColor = "black"; // Outline for visibility
  ctx.shadowBlur = 4;
  
  for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      
      // Update particle physics here
      p.y -= p.speedY; // Move up
      p.life--;        // Reduce life
  }
  
  // Remove dead particles from array
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
    ctx.font = "bold 48px 'Poppins', sans-serif";
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
    ctx.font = "bold 60px 'Poppins', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }
}

function drawGame() {
  if (fish.img) {
    ctx.drawImage(fish.img, fish.x, fish.y, FISH_SIZE, FISH_SIZE);
  }
  if (!paused && hearts > 0) {
    ctx.drawImage(netImg, net.x, net.y, NET_WIDTH, NET_HEIGHT);
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
  particles = []; // Clear floating text on restart
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