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

    // Freeze recovery state
    private lastPresentedFrameTime = Date.now();
    private stalledCount = 0;
    private onActivityReset = (): void => {
        this.lastPresentedFrameTime = Date.now();
        this.stalledCount = 0;
    };

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

        document.addEventListener('visibilitychange', this.onActivityReset);
        this.player.video.addEventListener('play', this.onActivityReset);
        this.player.video.addEventListener('playing', this.onActivityReset);
        this.player.video.addEventListener('seeked', this.onActivityReset);
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
        let lastRecoverTime = 0;

        const trackPresentedFrames = () => {
            const vid = this.player.video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => void };
            if (vid && typeof vid.requestVideoFrameCallback === 'function') {
                vid.requestVideoFrameCallback(() => {
                    this.lastPresentedFrameTime = Date.now();
                    trackPresentedFrames();
                });
            }
        };
        trackPresentedFrames();

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
                    this.stalledCount = 0;
                }

                // Automatic Video Freeze & Stall Recovery Watchdog
                const isNearEnd = this.player.video.duration && currentPlayPos >= this.player.video.duration - 0.5;
                if (!document.hidden && !this.player.video.paused && !this.player.paused && !isNearEnd) {
                    const now = Date.now();
                    const vid = this.player.video as HTMLVideoElement & { requestVideoFrameCallback?: unknown };

                    // 1. Audio clock is progressing, but video decoder is frozen (no frame presented for >1.5s)
                    if (
                        typeof vid.requestVideoFrameCallback === 'function' &&
                        currentPlayPos > 0 &&
                        now - this.lastPresentedFrameTime > 1500 &&
                        now - lastRecoverTime > 3000
                    ) {
                        lastRecoverTime = now;
                        this.lastPresentedFrameTime = now;
                        const nudgeTarget = Math.min(this.player.video.duration || Infinity, currentPlayPos + 0.1);
                        if (this.player.plugins.hls) {
                            const hls = this.player.plugins.hls as { startLoad?: (pos?: number) => void };
                            if (typeof hls.startLoad === 'function') {
                                hls.startLoad(nudgeTarget);
                            }
                        }
                        this.player.seek(nudgeTarget, true);
                        this.player.video.play().catch(() => {});
                    }

                    // 2. Stream buffering stalled (neither audio nor video advancing)
                    if (currentPlayPos === lastPlayPos) {
                        this.stalledCount++;
                        // Level 1: Gentle forward nudge after 1.5s of stall
                        if (this.stalledCount === 15 && now - lastRecoverTime > 3000) {
                            lastRecoverTime = now;
                            this.lastPresentedFrameTime = now;
                            const nudgeTarget = Math.min(this.player.video.duration || Infinity, currentPlayPos + 0.2);
                            if (this.player.plugins.hls) {
                                const hls = this.player.plugins.hls as { startLoad?: (pos?: number) => void };
                                if (typeof hls.startLoad === 'function') {
                                    hls.startLoad(nudgeTarget);
                                }
                            }
                            this.player.seek(nudgeTarget, true);
                            this.player.video.play().catch(() => {});
                        }
                        // Level 2: Keyframe leap + HLS media recovery after 3.5s of persistent stall
                        else if (this.stalledCount >= 35 && now - lastRecoverTime > 2000) {
                            this.stalledCount = 0;
                            lastRecoverTime = now;
                            this.lastPresentedFrameTime = now;
                            const keyframeNudge = Math.min(this.player.video.duration || Infinity, currentPlayPos + 1.0);
                            if (this.player.plugins.hls) {
                                const hls = this.player.plugins.hls as { recoverMediaError?: () => void; startLoad?: (pos?: number) => void };
                                if (typeof hls.recoverMediaError === 'function') {
                                    hls.recoverMediaError();
                                } else if (typeof hls.startLoad === 'function') {
                                    hls.startLoad(keyframeNudge);
                                }
                            }
                            this.player.seek(keyframeNudge, true);
                            this.player.video.play().catch(() => {});
                        }
                    } else {
                        this.stalledCount = 0;
                    }
                } else {
                    this.lastPresentedFrameTime = Date.now();
                    this.stalledCount = 0;
                }

                lastPlayPos = currentPlayPos;
            } else {
                this.lastPresentedFrameTime = Date.now();
                this.stalledCount = 0;
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

        document.removeEventListener('visibilitychange', this.onActivityReset);
        this.player.video.removeEventListener('play', this.onActivityReset);
        this.player.video.removeEventListener('playing', this.onActivityReset);
        this.player.video.removeEventListener('seeked', this.onActivityReset);

        if (this.loadingChecker !== undefined) clearInterval(this.loadingChecker);
        if (this.infoChecker !== undefined) clearInterval(this.infoChecker);
    }
}

export default Timer;
