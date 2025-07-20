import { createEntity, Species } from "./entity.js";
import { step } from "./engine.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;
let entities = [];
let gameRunning = false;
let animationId = null;
// Space crunch mode variables
let gameStartTime = 0;
let suddenDeathActive = false;
const SUDDEN_DEATH_TIME = 60000; // 90 seconds in milliseconds
let playAreaBounds = { left: 0, top: 0, right: 800, bottom: 600 };
// UI elements
const rockSlider = document.getElementById("rock");
const paperSlider = document.getElementById("paper");
const scissorsSlider = document.getElementById("scissors");
const speedSlider = document.getElementById("speed");
const rockCount = document.getElementById("rock-count");
const paperCount = document.getElementById("paper-count");
const scissorsCount = document.getElementById("scissors-count");
const speedValue = document.getElementById("speed-value");
const entityCountDisplay = document.getElementById("entity-count");
const countdownTimer = document.getElementById("countdown-timer");
const timerDisplay = document.getElementById("timer-display");
const updateUI = () => {
  // Update count displays
  rockCount.textContent = rockSlider.value;
  paperCount.textContent = paperSlider.value;
  scissorsCount.textContent = scissorsSlider.value;
  speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
  // Update entity count
  entityCountDisplay.textContent = entities.length.toString();
  // Update countdown timer
  if (gameRunning) {
    const elapsed = Date.now() - gameStartTime;
    const remaining = Math.max(0, SUDDEN_DEATH_TIME - elapsed);
    const seconds = Math.ceil(remaining / 1000);
    if (remaining > 0) {
      countdownTimer.textContent = `${seconds}s`;
      timerDisplay.style.display = "block";
    } else {
      countdownTimer.textContent = "SPACE CRUNCH!";
      timerDisplay.classList.add("space-crunch-active");
    }
  } else {
    countdownTimer.textContent = "90s";
    timerDisplay.style.display = "block";
    timerDisplay.classList.remove("space-crunch-active");
  }
};
const init = () => {
  entities = [];
  gameStartTime = Date.now();
  suddenDeathActive = false;
  playAreaBounds = { left: 0, top: 0, right: width, bottom: height };
  const rock = +rockSlider.value;
  const paper = +paperSlider.value;
  const scissors = +scissorsSlider.value;
  // Define three distinct spawn zones
  const zoneSize = 80;
  const zones = [
    { x: zoneSize, y: zoneSize }, // Top-left for Rock
    { x: width - zoneSize, y: zoneSize }, // Top-right for Paper
    { x: width / 2, y: height - zoneSize }, // Bottom-center for Scissors
  ];
  for (let i = 0; i < rock; i++)
    entities.push(
      createEntity(
        Species.Rock,
        zones[0].x + (Math.random() - 0.5) * zoneSize,
        zones[0].y + (Math.random() - 0.5) * zoneSize,
      ),
    );
  for (let i = 0; i < paper; i++)
    entities.push(
      createEntity(
        Species.Paper,
        zones[1].x + (Math.random() - 0.5) * zoneSize,
        zones[1].y + (Math.random() - 0.5) * zoneSize,
      ),
    );
  for (let i = 0; i < scissors; i++)
    entities.push(
      createEntity(
        Species.Scissors,
        zones[2].x + (Math.random() - 0.5) * zoneSize,
        zones[2].y + (Math.random() - 0.5) * zoneSize,
      ),
    );
};
const ICONS = ["🪨", "📄", "✂️"]; // rock, paper, scissors
const draw = () => {
  ctx.clearRect(0, 0, width, height);
  // Draw shrinking play area during space crunch
  if (suddenDeathActive) {
    // Draw danger zone (outside play area)
    ctx.fillStyle = "rgba(233, 69, 96, 0.3)";
    ctx.fillRect(0, 0, width, playAreaBounds.top);
    ctx.fillRect(
      0,
      playAreaBounds.bottom,
      width,
      height - playAreaBounds.bottom,
    );
    ctx.fillRect(
      0,
      playAreaBounds.top,
      playAreaBounds.left,
      playAreaBounds.bottom - playAreaBounds.top,
    );
    ctx.fillRect(
      playAreaBounds.right,
      playAreaBounds.top,
      width - playAreaBounds.right,
      playAreaBounds.bottom - playAreaBounds.top,
    );
    // Draw play area border
    ctx.strokeStyle = "#e94560";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      playAreaBounds.left,
      playAreaBounds.top,
      playAreaBounds.right - playAreaBounds.left,
      playAreaBounds.bottom - playAreaBounds.top,
    );
  }
  // Draw entities
  for (const e of entities) {
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(ICONS[e.species], e.x, e.y);
  }
};
const getSpeed = () => {
  return +document.getElementById("speed").value;
};
const loop = () => {
  if (!gameRunning) return;
  // Check for space crunch mode
  const elapsed = Date.now() - gameStartTime;
  if (elapsed >= SUDDEN_DEATH_TIME && !suddenDeathActive) {
    suddenDeathActive = true;
  }
  // Shrink play area during space crunch
  if (suddenDeathActive) {
    const shrinkTime = elapsed - SUDDEN_DEATH_TIME;
    const shrinkRate = 5; // pixels per second from each side
    const shrinkAmount = (shrinkTime * shrinkRate) / 1000;
    playAreaBounds = {
      left: Math.min(width * 0.4, shrinkAmount),
      top: Math.min(height * 0.4, shrinkAmount),
      right: Math.max(width * 0.6, width - shrinkAmount),
      bottom: Math.max(height * 0.6, height - shrinkAmount),
    };
  }
  step(entities, width, height, playAreaBounds);
  draw();
  updateUI();
  // count species
  const counts = new Array(3).fill(0);
  for (const e of entities) counts[e.species]++;
  const alive = counts.filter((c) => c > 0).length;
  if (alive > 1) {
    const speed = getSpeed();
    const delay = Math.max(1, Math.round(16 / speed)); // Base 16ms (60fps), adjusted by speed
    animationId = setTimeout(loop, delay);
  } else {
    gameRunning = false;
    const winner = counts.findIndex((c) => c > 0);
    // Enhanced winner display
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#e94560";
    ctx.font = "bold 48px Orbitron, monospace";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    const winnerText =
      ["🪨 Rock", "📄 Paper", "✂️ Scissors"][winner] + " Wins!";
    ctx.strokeText(winnerText, width / 2, height / 2 - 20);
    ctx.fillText(winnerText, width / 2, height / 2 - 20);
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Inter, sans-serif";
    ctx.fillText("Click Restart to play again", width / 2, height / 2 + 40);
  }
};
const startGame = () => {
  if (animationId) {
    clearTimeout(animationId);
  }
  gameRunning = true;
  loop();
};
// Event listeners
document.getElementById("restart").addEventListener("click", () => {
  init();
  startGame();
});
// Slider event listeners for real-time UI updates
rockSlider.addEventListener("input", updateUI);
paperSlider.addEventListener("input", updateUI);
scissorsSlider.addEventListener("input", updateUI);
speedSlider.addEventListener("input", updateUI);
// Initialize UI and start game
updateUI();
init();
startGame();
