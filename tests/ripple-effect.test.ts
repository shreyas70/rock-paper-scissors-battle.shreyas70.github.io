import { createEntity, Species } from '../src/entity';

describe('Ripple Effect', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <canvas id="canvas"></canvas>
            <div id="joystick-container"></div>
            <button id="restart"></button>
            <div id="entity-selection"></div>
            <div id="game-instruction"></div>
            <div id="rock-count"></div>
            <div id="paper-count"></div>
            <div id="scissors-count"></div>
            <div id="speed-value"></div>
            <div id="countdown-timer"></div>
            <div id="timer-display"></div>
            <div id="timer-label"></div>
            <button id="blast-power"></button>
            <button id="panel-toggle"></button>
            <div id="control-panel"></div>
            <input id="rock" type="range" />
            <input id="paper" type="range" />
            <input id="scissors" type="range" />
            <input id="speed" type="range" />
        `;
    });

    it('should create a blast effect at the specified coordinates', async () => {
        const { createBlastEffect, getBlastEffects } = await import('../src/main');
        createBlastEffect(100, 100);
        const blastEffects = getBlastEffects();
        expect(blastEffects.length).toBe(1);
        expect(blastEffects[0].x).toBe(100);
        expect(blastEffects[0].y).toBe(100);
    });

    it('should apply force to entities within the blast radius', async () => {
        const { ForceBlast } = await import('../src/force-blast');
        const entity = createEntity(Species.Rock, 100, 100, 0, 0);
        new ForceBlast(100, 100, [entity]).apply();
        expect(entity.vx).not.toBe(0);
        expect(entity.vy).not.toBe(0);
    });

    it('should not apply force to entities outside the blast radius', async () => {
        const { ForceBlast } = await import('../src/force-blast');
        const entity = createEntity(Species.Rock, 500, 500, 0, 0);
        new ForceBlast(100, 100, [entity]).apply();
        expect(entity.vx).toBe(0);
        expect(entity.vy).toBe(0);
    });
});
