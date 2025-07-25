export class PerformanceMonitor {
    private frameCount: number = 0;
    private lastTime: number = 0;
    private fps: number = 0;

    constructor() {
        this.lastTime = performance.now();
    }

    public update(): void {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    public getFPS(): number {
        return this.fps;
    }
}

export const getDynamicMaxEntities = (): number => {
    const width = window.innerWidth;
    if (width <= 480) {
        return 80;
    } else if (width <= 768) {
        return 120;
    } else {
        return 200;
    }
};
