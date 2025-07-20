export var Species;
(function (Species) {
    Species[Species["Rock"] = 0] = "Rock";
    Species[Species["Paper"] = 1] = "Paper";
    Species[Species["Scissors"] = 2] = "Scissors";
})(Species || (Species = {}));
let nextId = 0;
export const createEntity = (species, x, y) => ({
    id: nextId++,
    species,
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    radius: 6,
});
