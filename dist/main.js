import { createEntity, Species } from "./entity.js";
import { step } from "./engine.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;
let entities = [];
let gameRunning = false;
let animationId = null;
const init = () => {
    entities = [];
    const rock = +document.getElementById("rock").value;
    const paper = +document.getElementById("paper").value;
    const scissors = +document.getElementById("scissors")
        .value;
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
    for (const e of entities) {
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ICONS[e.species], e.x, e.y);
    }
};
const getSpeed = () => {
    return +document.getElementById("speed").value;
};
const loop = () => {
    if (!gameRunning)
        return;
    step(entities, width, height);
    draw();
    // count species
    const counts = new Array(3).fill(0);
    for (const e of entities)
        counts[e.species]++;
    const alive = counts.filter(c => c > 0).length;
    if (alive > 1) {
        const speed = getSpeed();
        const delay = Math.max(1, Math.round(16 / speed)); // Base 16ms (60fps), adjusted by speed
        animationId = setTimeout(loop, delay);
    }
    else {
        gameRunning = false;
        const winner = counts.findIndex(c => c > 0);
        ctx.fillStyle = "#fff";
        ctx.font = "32px monospace";
        ctx.textAlign = "center";
        ctx.fillText(["Rock", "Paper", "Scissors"][winner] + " wins!", width / 2, height / 2);
    }
};
const startGame = () => {
    if (animationId) {
        clearTimeout(animationId);
    }
    gameRunning = true;
    loop();
};
document.getElementById("restart").addEventListener("click", () => {
    init();
    startGame();
});
// Speed control - no need to restart game, just affects next loop iteration
document.getElementById("speed").addEventListener("input", () => {
    // Speed changes take effect automatically on next loop iteration
});
init();
startGame();
