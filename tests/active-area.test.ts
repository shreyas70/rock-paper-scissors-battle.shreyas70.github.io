import { createEntity, Species } from "../src/entity.js";

// Test helper to create entities at specific positions
const createTestEntity = (species: Species, x: number, y: number) => {
  const entity = createEntity(species, x, y);
  // Override position to exact values for testing
  entity.x = x;
  entity.y = y;
  return entity;
};

// Test active area detection logic
describe("Active Area Detection", () => {
  const canvasWidth = 800;
  const canvasHeight = 600;
  
  // Normal play area (full canvas)
  const fullPlayArea = { 
    left: 0, 
    top: 0, 
    right: canvasWidth, 
    bottom: canvasHeight 
  };
  
  // Shrunk play area (space crunch mode)
  const shrunkPlayArea = { 
    left: 100, 
    top: 100, 
    right: 700, 
    bottom: 500 
  };

  test("entities within full play area should be counted as active", () => {
    const entities = [
      createTestEntity(Species.Rock, 50, 50),     // inside
      createTestEntity(Species.Paper, 400, 300), // center
      createTestEntity(Species.Scissors, 750, 550) // near edge but inside
    ];

    const activeCounts = countActiveEntities(entities, fullPlayArea);
    
    expect(activeCounts.totalActive).toBe(3);
    expect(activeCounts.counts[Species.Rock]).toBe(1);
    expect(activeCounts.counts[Species.Paper]).toBe(1);
    expect(activeCounts.counts[Species.Scissors]).toBe(1);
  });

  test("entities outside shrunk play area should not be counted", () => {
    const entities = [
      createTestEntity(Species.Rock, 50, 50),      // outside (left/top)
      createTestEntity(Species.Paper, 400, 300),  // inside shrunk area
      createTestEntity(Species.Scissors, 750, 550), // outside (right/bottom)
      createTestEntity(Species.Rock, 99, 200),     // outside (just left of boundary)
      createTestEntity(Species.Paper, 101, 200),   // inside (just right of boundary)
    ];

    const activeCounts = countActiveEntities(entities, shrunkPlayArea);
    
    expect(activeCounts.totalActive).toBe(2); // Only 2 entities inside
    expect(activeCounts.counts[Species.Rock]).toBe(0); // Rock entities outside
    expect(activeCounts.counts[Species.Paper]).toBe(2); // 1 inside shrunk + 1 at boundary
    expect(activeCounts.counts[Species.Scissors]).toBe(0); // Scissors outside
  });

  test("boundary conditions - entities exactly on the edge", () => {
    const entities = [
      createTestEntity(Species.Rock, 100, 100),    // exactly on left/top boundary
      createTestEntity(Species.Paper, 700, 500),   // exactly on right/bottom boundary
      createTestEntity(Species.Scissors, 99.9, 100), // just outside left
      createTestEntity(Species.Rock, 700.1, 500),   // just outside right
    ];

    const activeCounts = countActiveEntities(entities, shrunkPlayArea);
    
    expect(activeCounts.totalActive).toBe(2); // Only entities exactly on boundary
    expect(activeCounts.counts[Species.Rock]).toBe(1); // 1 on boundary, 1 outside
    expect(activeCounts.counts[Species.Paper]).toBe(1); // 1 on boundary
    expect(activeCounts.counts[Species.Scissors]).toBe(0); // Outside boundary
  });

  test("winner detection with original logic - zero counts in two categories", () => {
    // Scenario: Only Rock entities are active
    const entitiesWithOnlyRock = [
      createTestEntity(Species.Rock, 200, 200),
      createTestEntity(Species.Rock, 300, 300),
      createTestEntity(Species.Paper, 50, 50),     // outside active area
      createTestEntity(Species.Scissors, 750, 550) // outside active area
    ];

    const activeCounts = countActiveEntities(entitiesWithOnlyRock, shrunkPlayArea);
    const winner = determineWinner(activeCounts.counts);
    
    expect(activeCounts.counts[Species.Rock]).toBe(2);
    expect(activeCounts.counts[Species.Paper]).toBe(0);
    expect(activeCounts.counts[Species.Scissors]).toBe(0);
    expect(winner).toBe(Species.Rock);
  });

  test("no winner when multiple species are active", () => {
    const entitiesWithMultipleSpecies = [
      createTestEntity(Species.Rock, 200, 200),
      createTestEntity(Species.Paper, 300, 300),
      createTestEntity(Species.Scissors, 400, 400),
    ];

    const activeCounts = countActiveEntities(entitiesWithMultipleSpecies, shrunkPlayArea);
    const winner = determineWinner(activeCounts.counts);
    
    expect(activeCounts.counts[Species.Rock]).toBe(1);
    expect(activeCounts.counts[Species.Paper]).toBe(1);
    expect(activeCounts.counts[Species.Scissors]).toBe(1);
    expect(winner).toBe(null); // No winner yet
  });
});

// Helper function that mimics the logic from main.ts
function countActiveEntities(entities: ReturnType<typeof createEntity>[], playAreaBounds: {left: number, top: number, right: number, bottom: number}) {
  const counts = new Array(3).fill(0);
  const activeEntities: ReturnType<typeof createEntity>[] = [];
  
  for (const e of entities) {
    const isInActiveBounds = (
      e.x >= playAreaBounds.left && 
      e.x <= playAreaBounds.right && 
      e.y >= playAreaBounds.top && 
      e.y <= playAreaBounds.bottom
    );
    
    if (isInActiveBounds) {
      counts[e.species]++;
      activeEntities.push(e);
    }
  }
  
  return {
    counts,
    activeEntities,
    totalActive: activeEntities.length
  };
}

// Helper function for winner determination (original logic)
function determineWinner(counts: number[]): Species | null {
  const alive = counts.filter(c => c > 0).length;
  
  if (alive <= 1) {
    // Original logic: declare winner only when 0 active pieces in two categories
    return counts.findIndex(c => c > 0) as Species;
  }
  
  return null; // Game continues
}