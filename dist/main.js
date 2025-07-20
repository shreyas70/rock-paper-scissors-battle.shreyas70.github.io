import { createEntity, Species } from "./entity.js";
import { step } from "./engine.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// Dynamic canvas sizing
let width;
let height;
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
let entities = [];
let gameRunning = false;
let animationId = null;
// Space crunch mode variables
let gameStartTime = 0;
let suddenDeathActive = false;
const SUDDEN_DEATH_TIME = 45000; // 45 seconds in milliseconds
let playAreaBounds = { left: 0, top: 0, right: 0, bottom: 0 };
// UI elements
const rockSlider = document.getElementById("rock");
const paperSlider = document.getElementById("paper");
const scissorsSlider = document.getElementById("scissors");
const speedSlider = document.getElementById("speed");
const rockCount = document.getElementById("rock-count");
const paperCount = document.getElementById("paper-count");
const scissorsCount = document.getElementById("scissors-count");
const speedValue = document.getElementById("speed-value");
const countdownTimer = document.getElementById("countdown-timer");
const timerDisplay = document.getElementById("timer-display");
const timerLabel = document.getElementById("timer-label");
const blastButton = document.getElementById("blast-power");
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
        }
        else {
            timerLabel.textContent = "Space Crunch";
            countdownTimer.textContent = "ACTIVE";
            timerDisplay.classList.add("space-crunch-active");
        }
    }
    else {
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
    }
    else {
        blastButton.textContent = "💥 Force Blast";
        blastButton.disabled = false;
    }
};
const init = () => {
    entities = [];
    gameStartTime = Date.now();
    suddenDeathActive = false;
    playAreaBounds = { left: 0, top: 0, right: width, bottom: height };
    // Mobile performance optimization - reduce entity counts only on mobile
    const isMobile = window.innerWidth <= 768;
    const maxEntities = isMobile ? 60 : 600; // Increased mobile limit since canvas is fixed size
    let rock = +rockSlider.value;
    let paper = +paperSlider.value;
    let scissors = +scissorsSlider.value;
    // Scale down for mobile only
    if (isMobile) {
        const total = rock + paper + scissors;
        if (total > maxEntities) {
            const scale = maxEntities / total;
            rock = Math.max(1, Math.floor(rock * scale));
            paper = Math.max(1, Math.floor(paper * scale));
            scissors = Math.max(1, Math.floor(scissors * scale));
        }
    }
    // Define three distinct spawn zones
    const zoneSize = 80;
    const zones = [
        { x: zoneSize, y: zoneSize }, // Top-left for Rock
        { x: width - zoneSize, y: zoneSize }, // Top-right for Paper
        { x: width / 2, y: height - zoneSize }, // Bottom-center for Scissors
    ];
    for (let i = 0; i < rock; i++)
        entities.push(createEntity(Species.Rock, zones[0].x + (Math.random() - 0.5) * zoneSize, zones[0].y + (Math.random() - 0.5) * zoneSize));
    for (let i = 0; i < paper; i++)
        entities.push(createEntity(Species.Paper, zones[1].x + (Math.random() - 0.5) * zoneSize, zones[1].y + (Math.random() - 0.5) * zoneSize));
    for (let i = 0; i < scissors; i++)
        entities.push(createEntity(Species.Scissors, zones[2].x + (Math.random() - 0.5) * zoneSize, zones[2].y + (Math.random() - 0.5) * zoneSize));
};
const ICONS = ["🪨", "📄", "✂️"]; // rock, paper, scissors
const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Draw shrinking play area during space crunch
    if (suddenDeathActive) {
        // Draw danger zone (outside play area)
        ctx.fillStyle = "rgba(233, 69, 96, 0.3)";
        ctx.fillRect(0, 0, width, playAreaBounds.top);
        ctx.fillRect(0, playAreaBounds.bottom, width, height - playAreaBounds.bottom);
        ctx.fillRect(0, playAreaBounds.top, playAreaBounds.left, playAreaBounds.bottom - playAreaBounds.top);
        ctx.fillRect(playAreaBounds.right, playAreaBounds.top, width - playAreaBounds.right, playAreaBounds.bottom - playAreaBounds.top);
        // Draw play area border
        ctx.strokeStyle = "#e94560";
        ctx.lineWidth = 3;
        ctx.strokeRect(playAreaBounds.left, playAreaBounds.top, playAreaBounds.right - playAreaBounds.left, playAreaBounds.bottom - playAreaBounds.top);
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
const getSpeed = () => {
    return +document.getElementById("speed").value;
};
const loop = () => {
    if (!gameRunning)
        return;
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
    draw();
    // Mobile optimization - update UI less frequently
    const isMobile = window.innerWidth <= 768;
    const frameCounter = window.frameCounter || 0;
    window.frameCounter = frameCounter + 1;
    if (!isMobile || frameCounter % 3 === 0) {
        // Update UI every 3rd frame on mobile
        updateUI();
    }
    // count species - only count entities within active play area
    const counts = new Array(3).fill(0);
    const activeEntities = [];
    for (const e of entities) {
        // Check if entity is within active play bounds
        const isInActiveBounds = e.x >= playAreaBounds.left &&
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
    const playAreaSize = (playAreaBounds.right - playAreaBounds.left) *
        (playAreaBounds.bottom - playAreaBounds.top);
    const shouldForceEnd = (suddenDeathActive && playAreaSize < 1000) || // Very small area (reduced threshold)
        (suddenDeathActive && elapsed > SUDDEN_DEATH_TIME + 45000); // 45s after space crunch
    // Only end game when exactly one species has active entities (two species have 0 count)
    const speciesWithZeroCounts = counts.filter(c => c === 0).length;
    const hasProperWinner = speciesWithZeroCounts === 2 && alive === 1;
    if (!hasProperWinner && !shouldForceEnd) {
        const speed = getSpeed();
        const delay = Math.max(1, Math.round(16 / speed)); // Base 16ms (60fps), adjusted by speed
        animationId = setTimeout(loop, delay);
    }
    else {
        gameRunning = false;
        // Determine winner
        let winner = counts.findIndex((c) => c > 0);
        if (alive > 1 || counts.every((c) => c === 0)) {
            const maxCount = Math.max(...counts);
            winner = counts.findIndex((c) => c === maxCount);
        }
        // Enhanced winner display
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#e94560";
        ctx.font = "bold 48px Orbitron, monospace";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        const winnerText = ["🪨 Rock", "📄 Paper", "✂️ Scissors"][winner] + " Wins!";
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
// Force blast system
let lastCanvasBlastTime = 0;
let lastButtonBlastTime = 0;
const CANVAS_BLAST_COOLDOWN = 1000; // 1 second for canvas clicks
const BUTTON_BLAST_COOLDOWN = 3000; // 3 seconds for button
const BLAST_RADIUS = 200;
const BLAST_STRENGTH = 400;
let blastEffects = [];
const handleForceBlast = (e) => {
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
    let clientX, clientY;
    if (e instanceof TouchEvent) {
        if (e.touches.length === 0)
            return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        console.log("Touch event at:", clientX, clientY);
    }
    else {
        clientX = e.clientX;
        clientY = e.clientY;
        console.log("Mouse event at:", clientX, clientY);
    }
    // Convert screen coordinates to canvas coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width; // Canvas is always 600x600
    const scaleY = 600 / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    console.log(`Canvas bounds:`, rect);
    console.log(`Scale factors: ${scaleX.toFixed(2)}, ${scaleY.toFixed(2)}`);
    console.log(`Converted to canvas: ${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}`);
    // Apply force blast
    applyForceBlast(canvasX, canvasY);
    createBlastEffect(canvasX, canvasY);
    lastCanvasBlastTime = currentTime;
    console.log(`Canvas force blast applied at: ${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}`);
};
const applyForceBlast = (blastX, blastY) => {
    entities.forEach(entity => {
        const dx = entity.x - blastX;
        const dy = entity.y - blastY;
        const distance = Math.hypot(dx, dy);
        if (distance < BLAST_RADIUS && distance > 0) {
            // Force decreases with distance but remains powerful
            const falloffFactor = Math.max(0.1, 1 - (distance / BLAST_RADIUS)); // 10% minimum force at edge
            const forceMagnitude = BLAST_STRENGTH * falloffFactor;
            // Normalize direction and apply force
            const forceX = (dx / distance) * forceMagnitude;
            const forceY = (dy / distance) * forceMagnitude;
            // Apply force for movement
            entity.vx += forceX * 0.01;
            entity.vy += forceY * 0.01;
            // Cap velocity to prevent entities from flying off screen too fast
            const maxVelocity = 15;
            const currentSpeed = Math.hypot(entity.vx, entity.vy);
            if (currentSpeed > maxVelocity) {
                entity.vx = (entity.vx / currentSpeed) * maxVelocity;
                entity.vy = (entity.vy / currentSpeed) * maxVelocity;
            }
        }
    });
};
const createBlastEffect = (x, y) => {
    blastEffects.push({
        x,
        y,
        radius: 0,
        maxRadius: BLAST_RADIUS,
        opacity: 1,
        startTime: Date.now()
    });
};
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
// Add event listeners for force blast
console.log("Setting up force blast event listeners on canvas:", canvas);
canvas.addEventListener("click", handleForceBlast, { passive: false });
canvas.addEventListener("touchstart", handleForceBlast, { passive: false });
// Button click for random force blast
blastButton.addEventListener("click", () => {
    if (!gameRunning)
        return;
    const currentTime = Date.now();
    if (currentTime - lastButtonBlastTime < BUTTON_BLAST_COOLDOWN)
        return;
    // Random blast location
    const randomX = Math.random() * 600;
    const randomY = Math.random() * 600;
    applyForceBlast(randomX, randomY);
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
// Initialize UI and start game
resizeCanvas(); // Initial canvas size
updateUI();
init();
startGame();
