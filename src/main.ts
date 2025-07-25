import { createEntity, Species } from "./entity.js";
import { step } from "./engine.js";
import { Joystick } from "./joystick.js";
import { PerformanceMonitor, getDynamicMaxEntities } from "./performance.js";
import { ForceBlast } from "./force-blast.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Dynamic canvas sizing
let width: number;
let height: number;

const resizeCanvas = () => {
  // Always use fixed 600x600 canvas - let CSS handle responsive scaling
  width = 600;
  height = 600;

  canvas.width = width;
  canvas.height = height;
  // Remove inline styles - let CSS handle all sizing
  canvas.style.width = "";
  canvas.style.height = "";

  // Update play area bounds for space crunch
  playAreaBounds = { left: 0, top: 0, right: width, bottom: height };
};

let entities: ReturnType<typeof createEntity>[] = [];
let gameRunning = false;
let animationId: ReturnType<typeof setTimeout> | null = null;

// Game state management
type GameState = 'entity-selection' | 'playing' | 'finished';
let gameState: GameState = 'entity-selection';
let userSelectedEntity: Species | null = null;

// Space crunch mode variables
let gameStartTime = 0;
let suddenDeathActive = false;
const SUDDEN_DEATH_TIME = 45000; // 45 seconds in milliseconds
let playAreaBounds = { left: 0, top: 0, right: 0, bottom: 0 };

// UI elements
const rockSlider = document.getElementById("rock") as HTMLInputElement;
const paperSlider = document.getElementById("paper") as HTMLInputElement;
const scissorsSlider = document.getElementById("scissors") as HTMLInputElement;
const speedSlider = document.getElementById("speed") as HTMLInputElement;

const rockCount = document.getElementById("rock-count") as HTMLElement;
const paperCount = document.getElementById("paper-count") as HTMLElement;
const scissorsCount = document.getElementById("scissors-count") as HTMLElement;
const speedValue = document.getElementById("speed-value") as HTMLElement;
const countdownTimer = document.getElementById(
  "countdown-timer",
) as HTMLElement;
const timerDisplay = document.getElementById("timer-display") as HTMLElement;
const timerLabel = document.getElementById("timer-label") as HTMLElement;
const blastButton = document.getElementById("blast-power") as HTMLButtonElement;
const panelToggle = document.getElementById("panel-toggle") as HTMLButtonElement;
const controlPanel = document.getElementById("control-panel") as HTMLElement;

// Game state UI elements
const gameInstruction = document.getElementById("game-instruction") as HTMLElement;
const entitySelection = document.getElementById("entity-selection") as HTMLElement;
const entityChoices = document.querySelectorAll(".entity-choice") as NodeListOf<HTMLButtonElement>;

const joystick = new Joystick("joystick-container");
const performanceMonitor = new PerformanceMonitor();

const updateUI = () => {
  // Update count displays
  rockCount.textContent = rockSlider.value;
  paperCount.textContent = paperSlider.value;
  scissorsCount.textContent = scissorsSlider.value;
  speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;

  // Update countdown timer
  if (gameRunning) {
    const elapsed = Date.now() - gameStartTime;
    const remaining = Math.max(0, SUDDEN_DEATH_TIME - elapsed);
    const seconds = Math.ceil(remaining / 1000);

    if (remaining > 0) {
      timerLabel.textContent = "Surprise timer";
      countdownTimer.textContent = `${seconds}s`;
      timerDisplay.style.display = "block";
      timerDisplay.classList.remove("space-crunch-active");
    } else {
      timerLabel.textContent = "Space Crunch";
      countdownTimer.textContent = "ACTIVE";
      timerDisplay.classList.add("space-crunch-active");
    }
  } else {
    timerLabel.textContent = "Surprise timer";
    countdownTimer.textContent = "Surprise";
    timerDisplay.style.display = "block";
    timerDisplay.classList.remove("space-crunch-active");
  }
  
  // Update blast button cooldown
  updateBlastCooldown();
};

const updateBlastCooldown = () => {
  const currentTime = Date.now();
  const remaining = Math.max(0, BUTTON_BLAST_COOLDOWN - (currentTime - lastButtonBlastTime));
  const seconds = Math.ceil(remaining / 1000);
  
  if (remaining > 0) {
    blastButton.textContent = `💥 Force Blast (${seconds}s)`;
    blastButton.disabled = true;
  } else {
    blastButton.textContent = "💥 Force Blast";
    blastButton.disabled = false;
  }
};

const handleEntitySelection = (selectedEntity: Species) => {
  userSelectedEntity = selectedEntity;
  gameState = 'playing';
  
  // Update UI
  entityChoices.forEach((choice, index) => {
    choice.classList.toggle('selected', index === selectedEntity);
  });
  
  // Hide selection and update instruction
  entitySelection.classList.add('hidden');
  gameInstruction.textContent = "Tap screen to create ripples - use strategically to secure your win!";
  
  // Start the game
  init();
  startGame();
};

const init = () => {
  entities = [];
  gameStartTime = Date.now();
  suddenDeathActive = false;
  playAreaBounds = { left: 0, top: 0, right: width, bottom: height };
  
  // Only initialize entities if we're in playing state
  if (gameState !== 'playing') {
    return;
  }

  const maxEntities = getDynamicMaxEntities();

  let rock = +rockSlider.value;
  let paper = +paperSlider.value;
  let scissors = +scissorsSlider.value;

  const total = rock + paper + scissors;
  if (total > maxEntities) {
    const scale = maxEntities / total;
    rock = Math.max(1, Math.floor(rock * scale));
    paper = Math.max(1, Math.floor(paper * scale));
    scissors = Math.max(1, Math.floor(scissors * scale));
  }

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
  
  // Draw blast effects on top
  drawBlastEffects();
};

const getSpeed = (): number => {
  return +(document.getElementById("speed") as HTMLInputElement).value;
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
    const shrinkRate = 10; // pixels per second from each side
    const shrinkAmount = (shrinkTime * shrinkRate) / 1000;

    playAreaBounds = {
      left: Math.min(width * 0.4, shrinkAmount),
      top: Math.min(height * 0.4, shrinkAmount),
      right: Math.max(width * 0.6, width - shrinkAmount),
      bottom: Math.max(height * 0.6, height - shrinkAmount),
    };
  }

  step(entities, width, height, playAreaBounds);

  if (joystick.deltaX !== 0 || joystick.deltaY !== 0) {
    const blastX = width / 2 + joystick.deltaX * (width / 2);
    const blastY = height / 2 + joystick.deltaY * (height / 2);
    new ForceBlast(blastX, blastY, entities).apply();
    createBlastEffect(blastX, blastY);
  }

  draw();

  performanceMonitor.update();

  // Display FPS
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`FPS: ${performanceMonitor.getFPS()}`, 10, 20);

  // Mobile optimization - update UI less frequently
  const isMobile = window.innerWidth <= 768;
  const frameCounter = (window as any).frameCounter || 0;
  (window as any).frameCounter = frameCounter + 1;

  if (!isMobile || frameCounter % 3 === 0) {
    // Update UI every 3rd frame on mobile
    updateUI();
  }

  // count species - only count entities within active play area
  const counts = new Array(3).fill(0);
  const activeEntities: ReturnType<typeof createEntity>[] = [];

  for (const e of entities) {
    // Check if entity is within active play bounds
    const isInActiveBounds =
      e.x >= playAreaBounds.left &&
      e.x <= playAreaBounds.right &&
      e.y >= playAreaBounds.top &&
      e.y <= playAreaBounds.bottom;

    if (isInActiveBounds) {
      counts[e.species]++;
      activeEntities.push(e);
    }
  }

  const alive = counts.filter((c) => c > 0).length;
  const totalActiveEntities = activeEntities.length;

  // Failsafe: Force end game if space crunch area is too small or time limit exceeded
  const playAreaSize =
    (playAreaBounds.right - playAreaBounds.left) *
    (playAreaBounds.bottom - playAreaBounds.top);
  const shouldForceEnd =
    (suddenDeathActive && playAreaSize < 1000) || // Very small area (reduced threshold)
    (suddenDeathActive && elapsed > SUDDEN_DEATH_TIME + 45000); // 45s after space crunch

  // Only end game when exactly one species has active entities (two species have 0 count)
  const speciesWithZeroCounts = counts.filter(c => c === 0).length;
  const hasProperWinner = speciesWithZeroCounts === 2 && alive === 1;

  if (!hasProperWinner && !shouldForceEnd) {
    const speed = getSpeed();
    const delay = Math.max(1, Math.round(16 / speed)); // Base 16ms (60fps), adjusted by speed
    animationId = setTimeout(loop, delay);
  } else {
    gameRunning = false;
    gameState = 'finished';

    // Determine winner
    let winner = counts.findIndex((c) => c > 0);
    if (alive > 1 || counts.every((c) => c === 0)) {
      const maxCount = Math.max(...counts);
      winner = counts.findIndex((c) => c === maxCount);
    }

    // Check if user won
    const userWon = userSelectedEntity === winner;

    // Enhanced winner display
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = userWon ? "#2ecc71" : "#e94560";
    ctx.font = "bold 48px Orbitron, monospace";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    const resultText = userWon ? "You Win!" : "You Lose!";
    ctx.strokeText(resultText, width / 2, height / 2 - 40);
    ctx.fillText(resultText, width / 2, height / 2 - 40);

    // Show which entity won
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Inter, sans-serif";
    const winnerText = ["🪨 Rock", "📄 Paper", "✂️ Scissors"][winner] + " Wins!";
    ctx.fillText(winnerText, width / 2, height / 2);
    
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
document.getElementById("restart")!.addEventListener("click", () => {
  // Reset to entity selection state
  gameState = 'entity-selection';
  userSelectedEntity = null;
  gameRunning = false;
  
  if (animationId) {
    clearTimeout(animationId);
    animationId = null;
  }
  
  // Reset UI
  entitySelection.classList.remove('hidden');
  gameInstruction.textContent = "Pick Rock/Paper/Scissors";
  entityChoices.forEach(choice => choice.classList.remove('selected'));
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  entities = [];
});

// Entity selection event listeners
entityChoices.forEach((choice, index) => {
  choice.addEventListener("click", () => {
    handleEntitySelection(index as Species);
  });
});

// Slider event listeners for real-time UI updates
rockSlider.addEventListener("input", updateUI);
paperSlider.addEventListener("input", updateUI);
scissorsSlider.addEventListener("input", updateUI);
speedSlider.addEventListener("input", updateUI);

// Force blast system
let lastCanvasBlastTime = 0;
let lastButtonBlastTime = 0;
const CANVAS_BLAST_COOLDOWN = 1000; // 1 second for canvas clicks
const BUTTON_BLAST_COOLDOWN = 3000; // 3 seconds for button
const BLAST_RADIUS = 200;
const BLAST_STRENGTH = 400;

// Blast visual effects
interface BlastEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  startTime: number;
}

let blastEffects: BlastEffect[] = [];

const handleForceBlast = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  console.log("Force blast event triggered:", e.type);
  
  if (!gameRunning) {
    console.log("Game not running, blast ignored");
    return;
  }
  
  const currentTime = Date.now();
  if (currentTime - lastCanvasBlastTime < CANVAS_BLAST_COOLDOWN) {
    console.log("Canvas blast on cooldown, ignored");
    return;
  }
  
  // Get click/touch coordinates
  let clientX: number, clientY: number;
  if (e instanceof TouchEvent) {
    if (e.touches.length === 0) return;
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
    console.log("Touch event at:", clientX, clientY);
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
    console.log("Mouse event at:", clientX, clientY);
  }
  
  // Convert screen coordinates to canvas coordinates
  const rect = canvas.getBoundingClientRect();
  const scaleX = 600 / rect.width;  // Canvas is always 600x600
  const scaleY = 600 / rect.height;
  
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  
  console.log(`Canvas bounds:`, rect);
  console.log(`Scale factors: ${scaleX.toFixed(2)}, ${scaleY.toFixed(2)}`);
  console.log(`Converted to canvas: ${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}`);
  
  // Apply force blast
  new ForceBlast(canvasX, canvasY, entities).apply();
  createBlastEffect(canvasX, canvasY);
  lastCanvasBlastTime = currentTime;
  
  console.log(`Canvas force blast applied at: ${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}`);
};

export const createBlastEffect = (x: number, y: number) => {
  blastEffects.push({
    x,
    y,
    radius: 0,
    maxRadius: BLAST_RADIUS,
    opacity: 1,
    startTime: Date.now()
  });
};

export const getBlastEffects = () => blastEffects;

const drawBlastEffects = () => {
  blastEffects.forEach((blast, index) => {
    const elapsed = Date.now() - blast.startTime;
    const progress = Math.min(elapsed / 500, 1); // 500ms animation
    
    blast.radius = progress * blast.maxRadius;
    blast.opacity = 1 - progress;
    
    if (progress >= 1) {
      blastEffects.splice(index, 1);
      return;
    }
    
    // Draw expanding circle with gradient effect
    ctx.save();
    ctx.globalAlpha = blast.opacity;
    
    // Outer ring
    ctx.strokeStyle = "#ffff00"; // Yellow
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(blast.x, blast.y, blast.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner ring (smaller, more intense)
    if (blast.radius > 10) {
      ctx.strokeStyle = "#ff4444"; // Red
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(blast.x, blast.y, blast.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  });
};

// Button click for random force blast
blastButton.addEventListener("click", () => {
  if (!gameRunning) return;
  
  const currentTime = Date.now();
  if (currentTime - lastButtonBlastTime < BUTTON_BLAST_COOLDOWN) return;
  
  // Random blast location
  const randomX = Math.random() * 600;
  const randomY = Math.random() * 600;
  
  new ForceBlast(randomX, randomY, entities).apply();
  createBlastEffect(randomX, randomY);
  lastButtonBlastTime = currentTime;
  
  console.log(`Button force blast applied at: ${randomX.toFixed(1)}, ${randomY.toFixed(1)}`);
});

// Window resize handler
window.addEventListener("resize", () => {
  resizeCanvas();
  if (gameRunning) {
    draw(); // Redraw immediately on resize
  }
});

// Panel toggle handler
panelToggle.addEventListener("click", () => {
    controlPanel.classList.toggle("open");
});

canvas.addEventListener("click", handleForceBlast, { passive: false });
canvas.addEventListener("touchstart", handleForceBlast, { passive: false });

// Initialize UI but don't start game - wait for entity selection
resizeCanvas(); // Initial canvas size
updateUI();
