import { DPlayerInstance } from './types';

class HotKey {
    private player: DPlayerInstance;
    private doHotKeyHandler: (e: KeyboardEvent) => void;
    private cancelFullScreenHandler: (e: KeyboardEvent) => void;

    constructor(player: DPlayerInstance) {
        this.player = player;
        this.doHotKeyHandler = this.doHotKey.bind(this);
        this.cancelFullScreenHandler = this.cancelFullScreen.bind(this);

        if (this.player.options.hotkey) {
            document.addEventListener('keydown', this.doHotKeyHandler);
        }
        document.addEventListener('keydown', this.cancelFullScreenHandler);
    }

    /** Take a screenshot of the current video frame and download it */
    takeScreenshot(): void {
        const video = this.player.video;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);

        const time = video.currentTime;
        const h = String(Math.floor(time / 3600)).padStart(2, '0');
        const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
        const s = String(Math.floor(time % 60)).padStart(2, '0');
        const timestamp = `${h}-${m}-${s}`;

        canvas.toBlob((blob) => {
            if (!blob) return;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `screenshot_${timestamp}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        });

        this.player.notice(`Screenshot: ${timestamp}`);
    }

    /**
     * Change playback speed by a delta, clamped to [0.25, 2.0]
     */
    changeSpeed(delta: number): void {
        let newRate = this.player.video.playbackRate + delta;
        newRate = Math.max(0.25, Math.min(2.0, newRate));
        newRate = Math.round(newRate * 100) / 100;
        this.player.speed(newRate);
    }

    /** Reset playback speed to 1× */
    resetSpeed(): void {
        this.player.speed(1.0);
    }

    /** Seek to a percentage of the total duration */
    seekToPercent(percent: number): void {
        if (this.player.video.duration) {
            const time = (percent / 100) * this.player.video.duration;
            this.player.seek(time, true);
            this.player.notice(`Seek: ${percent}%`);
        }
    }

    private doHotKey(e: KeyboardEvent): void {
        if (!this.player.focus && !this.player.options.globalHotkey) return;

        const tag = (document.activeElement?.tagName ?? '').toUpperCase();
        const editable = document.activeElement?.getAttribute('contenteditable');

        // Do not intercept when user is typing
        if (tag === 'INPUT' || tag === 'TEXTAREA' || editable === '' || editable === 'true') {
            return;
        }

        const key = e.key;
        const keyCode = e.keyCode;

        // ` – increase speed
        if (!e.ctrlKey && !e.altKey && !e.shiftKey && key === '`') {
            e.preventDefault();
            this.changeSpeed(0.05);
            return;
        }

        // ~ (Shift + `) – decrease speed
        if (!e.ctrlKey && !e.altKey && e.shiftKey && key === '~') {
            e.preventDefault();
            this.changeSpeed(-0.05);
            return;
        }

        // Backspace – reset speed
        if (!e.ctrlKey && !e.altKey && !e.shiftKey && keyCode === 8) {
            e.preventDefault();
            this.resetSpeed();
            return;
        }

        // P – screenshot
        if (!e.ctrlKey && !e.altKey && !e.shiftKey && key.toLowerCase() === 'p') {
            e.preventDefault();
            this.takeScreenshot();
            return;
        }

        switch (keyCode) {
            // Space – toggle play/pause
            case 32:
                e.preventDefault();
                this.player.toggle();
                break;

            // Left arrow – rewind 5 s
            case 37:
                e.preventDefault();
                if (!this.player.options.live) {
                    this.player.seek(this.player.video.currentTime - 5);
                    this.player.controller.setAutoHide();
                }
                break;

            // Right arrow – forward 5 s
            case 39:
                e.preventDefault();
                if (!this.player.options.live) {
                    this.player.seek(this.player.video.currentTime + 5);
                    this.player.controller.setAutoHide();
                }
                break;

            // Up arrow – volume up
            case 38:
                e.preventDefault();
                this.player.volume(this.player.volume() + 0.1);
                break;

            // Down arrow – volume down
            case 40:
                e.preventDefault();
                this.player.volume(this.player.volume() - 0.1);
                break;

            // Numpad Enter – reset speed
            case 13:
                if (e.location === 3) {
                    e.preventDefault();
                    this.resetSpeed();
                }
                break;

            default:
                this.handleLetterKeys(e, key);
                break;
        }
    }

    private handleLetterKeys(e: KeyboardEvent, key: string): void {
        const lk = key.toLowerCase();

        switch (lk) {
            // A – rewind 5 s
            case 'a':
                e.preventDefault();
                if (!this.player.options.live) {
                    this.player.seek(Math.max(0, this.player.video.currentTime - 5));
                    this.player.controller.setAutoHide();
                }
                break;

            // D – forward 5 s
            case 'd':
                e.preventDefault();
                if (!this.player.options.live) {
                    const dur = this.player.video.duration;
                    if (dur) {
                        this.player.seek(this.player.video.currentTime + 5 < dur ? this.player.video.currentTime + 5 : dur - 1);
                    }
                    this.player.controller.setAutoHide();
                }
                break;

            // F – toggle browser fullscreen
            case 'f':
                e.preventDefault();
                this.player.fullScreen.toggle('browser');
                break;

            // W – toggle web fullscreen (original behaviour)
            case 'w':
                e.preventDefault();
                this.player.fullScreen.toggle('web');
                break;

            // E – toggle web fullscreen (alias)
            case 'e':
                e.preventDefault();
                this.player.fullScreen.toggle('web');
                break;

            // S – volume down
            case 's':
                e.preventDefault();
                this.player.volume(this.player.volume() - 0.1);
                break;

            // M – toggle mute
            case 'm':
                e.preventDefault();
                if (this.player.video.muted) {
                    this.player.video.muted = false;
                    this.player.notice('Unmuted');
                } else {
                    this.player.video.muted = true;
                    this.player.notice('Muted');
                }
                break;

            // + / = – increase speed
            case '+':
            case '=':
                e.preventDefault();
                this.changeSpeed(0.05);
                break;

            // - – decrease speed
            case '-':
                e.preventDefault();
                this.changeSpeed(-0.05);
                break;

            // 0-9 – seek to percentage
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                if (!this.player.options.live) {
                    this.seekToPercent(parseInt(lk, 10) * 10);
                }
                break;
        }
    }

    private cancelFullScreen(e: KeyboardEvent): void {
        // ESC – exit web fullscreen
        if (e.keyCode === 27) {
            if (this.player.fullScreen.isFullScreen('web')) {
                this.player.fullScreen.cancel('web');
            }
        }
    }

    destroy(): void {
        if (this.player.options.hotkey) {
            document.removeEventListener('keydown', this.doHotKeyHandler);
        }
        document.removeEventListener('keydown', this.cancelFullScreenHandler);
    }
}

export default HotKey;
