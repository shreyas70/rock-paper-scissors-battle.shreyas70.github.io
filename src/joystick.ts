export class Joystick {
    private container: HTMLElement;
    private knob: HTMLElement;
    private active: boolean = false;
    private touchId: number | null = null;
    public deltaX: number = 0;
    public deltaY: number = 0;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId)!;
        this.knob = this.createKnob();
        this.container.appendChild(this.knob);

        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.container.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    }

    private createKnob(): HTMLElement {
        const knob = document.createElement('div');
        knob.style.width = '50px';
        knob.style.height = '50px';
        knob.style.borderRadius = '50%';
        knob.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        knob.style.position = 'absolute';
        knob.style.left = '25px';
        knob.style.top = '25px';
        knob.style.transform = 'translate(-50%, -50%)';
        return knob;
    }

    private handleTouchStart(e: TouchEvent) {
        e.preventDefault();
        if (this.active) return;
        this.active = true;
        this.touchId = e.changedTouches[0].identifier;
        this.updateKnobPosition(e.changedTouches[0]);
    }

    private handleTouchMove(e: TouchEvent) {
        if (!this.active) return;
        const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchId);
        if (touch) {
            this.updateKnobPosition(touch);
        }
    }

    private handleTouchEnd(e: TouchEvent) {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchId);
        if (touch) {
            this.active = false;
            this.touchId = null;
            this.deltaX = 0;
            this.deltaY = 0;
            this.knob.style.left = '50%';
            this.knob.style.top = '50%';
        }
    }

    private updateKnobPosition(touch: Touch) {
        const rect = this.container.getBoundingClientRect();
        let x = touch.clientX - rect.left;
        let y = touch.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        let dx = x - centerX;
        let dy = y - centerY;

        const dist = Math.hypot(dx, dy);
        const maxDist = rect.width / 2;

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        this.knob.style.left = `${centerX + dx}px`;
        this.knob.style.top = `${centerY + dy}px`;

        this.deltaX = dx / maxDist;
        this.deltaY = dy / maxDist;
    }
}
