import { Entity } from './entity';

const BLAST_RADIUS = 200;
const BLAST_STRENGTH = 400;

export class ForceBlast {
    constructor(
        private x: number,
        private y: number,
        private entities: Entity[]
    ) {}

    public apply(): void {
        this.entities.forEach(entity => {
            const dx = entity.x - this.x;
            const dy = entity.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance < BLAST_RADIUS) {
                const falloffFactor = Math.max(0.1, 1 - (distance / BLAST_RADIUS));
                const forceMagnitude = BLAST_STRENGTH * falloffFactor;

                const forceX = (dx / distance) * forceMagnitude;
                const forceY = (dy / distance) * forceMagnitude;

                entity.vx += forceX * 0.01;
                entity.vy += forceY * 0.01;

                const maxVelocity = 15;
                const currentSpeed = Math.hypot(entity.vx, entity.vy);
                if (currentSpeed > maxVelocity) {
                    entity.vx = (entity.vx / currentSpeed) * maxVelocity;
                    entity.vy = (entity.vy / currentSpeed) * maxVelocity;
                }
            }
        });
    }
}
