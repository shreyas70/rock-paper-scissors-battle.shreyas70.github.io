export enum Species {
  Rock = 0,
  Paper = 1,
  Scissors = 2,
}

export interface Entity {
  id: number;
  species: Species;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

let nextId = 0;
export const createEntity = (
  species: Species,
  x: number,
  y: number
): Entity => ({
  id: nextId++,
  species,
  x,
  y,
  vx: (Math.random() - 0.5) * 4,
  vy: (Math.random() - 0.5) * 4,
  radius: 6,
});