import { Species } from "./entity.js";
const WALL_DAMPING = -0.8;
const EDGE_DISTANCE = 50;
const MIN_VELOCITY = 0.1;
const VELOCITY_BOOST = 0.5;
const applyEdgeVelocityBoost = (entity, width, height) => {
    const nearLeftOrRight = entity.x < EDGE_DISTANCE || entity.x > width - EDGE_DISTANCE;
    const nearTopOrBottom = entity.y < EDGE_DISTANCE || entity.y > height - EDGE_DISTANCE;
    const nearEdge = nearLeftOrRight || nearTopOrBottom;
    const currentSpeed = Math.hypot(entity.vx, entity.vy);
    if (nearEdge && currentSpeed < MIN_VELOCITY) {
        const randomAngle = Math.random() * 2 * Math.PI;
        entity.vx += Math.cos(randomAngle) * VELOCITY_BOOST;
        entity.vy += Math.sin(randomAngle) * VELOCITY_BOOST;
    }
};
export const step = (entities, width, height, playAreaBounds) => {
    // Use provided bounds or default to full canvas
    const bounds = playAreaBounds || { left: 0, top: 0, right: width, bottom: height };
    // apply edge velocity boost to prevent corner sticking
    for (const e of entities) {
        applyEdgeVelocityBoost(e, width, height);
    }
    // move
    for (const e of entities) {
        e.x += e.vx;
        e.y += e.vy;
        // bounce off walls (using shrinking bounds in sudden death)
        if (e.x - e.radius < bounds.left || e.x + e.radius > bounds.right) {
            e.vx *= WALL_DAMPING;
            e.x = Math.max(bounds.left + e.radius, Math.min(bounds.right - e.radius, e.x));
        }
        if (e.y - e.radius < bounds.top || e.y + e.radius > bounds.bottom) {
            e.vy *= WALL_DAMPING;
            e.y = Math.max(bounds.top + e.radius, Math.min(bounds.bottom - e.radius, e.y));
        }
    }
    // collisions
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            const a = entities[i];
            const b = entities[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < a.radius + b.radius) {
                // resolve overlap
                const overlap = a.radius + b.radius - dist;
                const nx = dx / dist;
                const ny = dy / dist;
                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;
                // RPS rules
                const winner = getWinner(a.species, b.species);
                if (winner !== null) {
                    if (winner === a.species)
                        b.species = a.species;
                    else
                        a.species = b.species;
                }
            }
        }
    }
    return entities;
};
const RULES = {
    [Species.Rock]: Species.Scissors,
    [Species.Paper]: Species.Rock,
    [Species.Scissors]: Species.Paper,
};
const getWinner = (a, b) => {
    if (a === b)
        return null;
    return RULES[a] === b ? a : b;
};
