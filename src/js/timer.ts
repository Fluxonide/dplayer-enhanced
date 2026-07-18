import { DPlayerInstance } from './types';

type TimerType = 'loading' | 'info' | 'fps';

class Timer {
    private player: DPlayerInstance;
    private readonly types: TimerType[];

    // Dynamic checker enable flags
    private enableloadingChecker = false;
    private enableinfoChecker = false;
    private enablefpsChecker = false;

    // Interval IDs
    private loadingChecker?: ReturnType<typeof setInterval>;
    private infoChecker?: ReturnType<typeof setInterval>;

    // FPS tracking
    private fpsStart: Date | null = null;
    private fpsIndex = 0;

    constructor(player: DPlayerInstance) {
        this.player = player;

        // Polyfill requestAnimationFrame
        window.requestAnimationFrame =
            window.requestAnimationFrame ||
            (window as Window & { webkitRequestAnimationFrame?: typeof requestAnimationFrame }).webkitRequestAnimationFrame ||
            (window as Window & { mozRequestAnimationFrame?: typeof requestAnimationFrame }).mozRequestAnimationFrame ||
            (window as Window & { oRequestAnimationFrame?: typeof requestAnimationFrame }).oRequestAnimationFrame ||
            (window as Window & { msRequestAnimationFrame?: typeof requestAnimationFrame }).msRequestAnimationFrame ||
            ((callback: FrameRequestCallback) => window.setTimeout(callback, 1000 / 60));

        this.types = ['loading', 'info', 'fps'];
        this.init();
    }

    private init(): void {
        this.types.forEach((item) => {
            if (item !== 'fps') {
                this.initChecker(item);
            }
        });
    }

    private initChecker(type: 'loading' | 'info'): void {
        if (type === 'loading') {
            this.initloadingChecker();
        } else {
            this.initinfoChecker();
        }
    }

    private initloadingChecker(): void {
        let lastPlayPos = 0;
        let currentPlayPos = 0;
        let bufferingDetected = false;

        this.loadingChecker = setInterval(() => {
            if (this.enableloadingChecker) {
                currentPlayPos = this.player.video.currentTime;

                if (!bufferingDetected && currentPlayPos === lastPlayPos && !this.player.video.paused) {
                    this.player.container.classList.add('dplayer-loading');
                    bufferingDetected = true;
                }

                if (bufferingDetected && currentPlayPos > lastPlayPos && !this.player.video.paused) {
                    this.player.container.classList.remove('dplayer-loading');
                    bufferingDetected = false;
                }

                lastPlayPos = currentPlayPos;
            }
        }, 100);
    }

    private initfpsChecker(): void {
        window.requestAnimationFrame(() => {
            if (this.enablefpsChecker) {
                this.initfpsChecker();

                if (!this.fpsStart) {
                    this.fpsStart = new Date();
                    this.fpsIndex = 0;
                } else {
                    this.fpsIndex++;
                    const fpsCurrent = new Date();
                    if (fpsCurrent.getTime() - this.fpsStart.getTime() > 1000) {
                        this.player.infoPanel.fps((this.fpsIndex / (fpsCurrent.getTime() - this.fpsStart.getTime())) * 1000);
                        this.fpsStart = new Date();
                        this.fpsIndex = 0;
                    }
                }
            } else {
                this.fpsStart = null;
                this.fpsIndex = 0;
            }
        });
    }

    private initinfoChecker(): void {
        this.infoChecker = setInterval(() => {
            if (this.enableinfoChecker) {
                this.player.infoPanel.update();
            }
        }, 1000);
    }

    enable(type: TimerType): void {
        if (type === 'loading') {
            this.enableloadingChecker = true;
        } else if (type === 'info') {
            this.enableinfoChecker = true;
        } else if (type === 'fps') {
            this.enablefpsChecker = true;
            this.initfpsChecker();
        }
    }

    disable(type: TimerType): void {
        if (type === 'loading') {
            this.enableloadingChecker = false;
        } else if (type === 'info') {
            this.enableinfoChecker = false;
        } else if (type === 'fps') {
            this.enablefpsChecker = false;
        }
    }

    destroy(): void {
        this.enableloadingChecker = false;
        this.enableinfoChecker = false;
        this.enablefpsChecker = false;

        if (this.loadingChecker !== undefined) clearInterval(this.loadingChecker);
        if (this.infoChecker !== undefined) clearInterval(this.infoChecker);
    }
}

export default Timer;
