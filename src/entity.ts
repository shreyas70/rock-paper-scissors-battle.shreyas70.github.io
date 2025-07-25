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
  y: number,
  vx: number = 0,
  vy: number = 0
): Entity => ({
  id: nextId++,
  species,
  x,
  y,
  vx,
  vy,
  radius: 6,
});