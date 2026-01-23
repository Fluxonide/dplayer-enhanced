/**
 * Enhanced HotKey class with comprehensive keyboard shortcuts
 * Forked from DIYgod/DPlayer
 */
class HotKey {
    constructor(player) {
        this.player = player;
        this.doHotKeyHandler = this.doHotKey.bind(this);
        this.cancelFullScreenHandler = this.cancelFullScreen.bind(this);

        if (this.player.options.hotkey) {
            document.addEventListener('keydown', this.doHotKeyHandler);
        }

        document.addEventListener('keydown', this.cancelFullScreenHandler);
    }

    /**
     * Take a screenshot of the current video frame
     */
    takeScreenshot() {
        const video = this.player.video;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Format timestamp as HH-MM-SS
        const time = video.currentTime;
        const h = String(Math.floor(time / 3600)).padStart(2, '0');
        const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
        const s = String(Math.floor(time % 60)).padStart(2, '0');
        const timestamp = `${h}-${m}-${s}`;

        canvas.toBlob((blob) => {
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
     * Change playback speed
     * @param {number} delta - Amount to change speed by (positive or negative)
     */
    changeSpeed(delta) {
        let newRate = this.player.video.playbackRate + delta;
        // Clamp between 0.25 and 2.0
        newRate = Math.max(0.25, Math.min(2.0, newRate));
        newRate = Math.round(newRate * 100) / 100; // Round to 2 decimal places
        this.player.speed(newRate);
    }

    /**
     * Reset playback speed to 1x
     */
    resetSpeed() {
        this.player.speed(1.0);
    }

    /**
     * Seek to a percentage of the video
     * @param {number} percent - Percentage (0-100)
     */
    seekToPercent(percent) {
        if (this.player.video.duration) {
            const time = (percent / 100) * this.player.video.duration;
            this.player.seek(time, true);
            this.player.notice(`Seek: ${percent}%`);
        }
    }

    doHotKey(e) {
        if (this.player.focus) {
            const tag = document.activeElement.tagName.toUpperCase();
            const editable = document.activeElement.getAttribute('contenteditable');

            // Skip if user is typing in an input
            if (tag === 'INPUT' || tag === 'TEXTAREA' || editable === '' || editable === 'true') {
                return;
            }

            const event = e || window.event;
            const key = event.key;
            const keyCode = event.keyCode;

            // Ctrl+X: Increase speed
            if (event.ctrlKey && key.toLowerCase() === 'x') {
                event.preventDefault();
                this.changeSpeed(0.05);
                return;
            }

            // Ctrl+Z: Decrease speed
            if (event.ctrlKey && key.toLowerCase() === 'z') {
                event.preventDefault();
                this.changeSpeed(-0.05);
                return;
            }

            // Ctrl+Shift: Reset speed
            if (event.ctrlKey && event.shiftKey) {
                event.preventDefault();
                this.resetSpeed();
                return;
            }

            // Shift+S: Take screenshot
            if (event.shiftKey && key.toLowerCase() === 's') {
                event.preventDefault();
                this.takeScreenshot();
                return;
            }

            switch (keyCode) {
                // Space: Toggle play/pause
                case 32:
                    event.preventDefault();
                    this.player.toggle();
                    break;

                // Left Arrow: Rewind 5 seconds
                case 37:
                    event.preventDefault();
                    if (this.player.options.live) break;
                    this.player.seek(this.player.video.currentTime - 5);
                    this.player.controller.setAutoHide();
                    break;

                // Right Arrow: Forward 5 seconds
                case 39:
                    event.preventDefault();
                    if (this.player.options.live) break;
                    this.player.seek(this.player.video.currentTime + 5);
                    this.player.controller.setAutoHide();
                    break;

                // Up Arrow: Volume up
                case 38:
                    event.preventDefault();
                    this.player.volume(this.player.volume() + 0.1);
                    break;

                // Down Arrow: Volume down
                case 40:
                    event.preventDefault();
                    this.player.volume(this.player.volume() - 0.1);
                    break;

                // Numpad Enter: Reset speed
                case 13:
                    if (event.location === 3) {
                        // Numpad
                        event.preventDefault();
                        this.resetSpeed();
                    }
                    break;

                default:
                    // Handle letter keys and other special keys
                    this.handleLetterKeys(event, key);
                    break;
            }
        }
    }

    handleLetterKeys(event, key) {
        const lowerKey = key.toLowerCase();

        switch (lowerKey) {
            // A: Rewind 5 seconds
            case 'a':
                event.preventDefault();
                if (this.player.options.live) break;
                if (this.player.video.currentTime >= 5) {
                    this.player.seek(this.player.video.currentTime - 5);
                } else {
                    this.player.seek(0);
                }
                this.player.controller.setAutoHide();
                break;

            // D: Forward 5 seconds
            case 'd':
                event.preventDefault();
                if (this.player.options.live) break;
                if (this.player.video.duration && this.player.video.currentTime + 5 < this.player.video.duration) {
                    this.player.seek(this.player.video.currentTime + 5);
                } else if (this.player.video.duration) {
                    this.player.seek(this.player.video.duration - 1);
                }
                this.player.controller.setAutoHide();
                break;

            // F: Toggle browser fullscreen
            case 'f':
                event.preventDefault();
                if (this.player.fullScreen.isFullScreen('browser')) {
                    this.player.fullScreen.cancel('browser');
                } else {
                    this.player.fullScreen.request('browser');
                }
                break;

            // W: Toggle web fullscreen
            case 'w':
                event.preventDefault();
                if (this.player.fullScreen.isFullScreen('web')) {
                    this.player.fullScreen.cancel('web');
                } else {
                    this.player.fullScreen.request('web');
                }
                break;

            // M: Toggle mute
            case 'm':
                event.preventDefault();
                if (this.player.video.muted) {
                    this.player.video.muted = false;
                    this.player.notice('Unmuted');
                } else {
                    this.player.video.muted = true;
                    this.player.notice('Muted');
                }
                break;

            // + or =: Increase speed
            case '+':
            case '=':
                event.preventDefault();
                this.changeSpeed(0.05);
                break;

            // -: Decrease speed
            case '-':
                event.preventDefault();
                this.changeSpeed(-0.05);
                break;

            // Number keys 0-9: Seek to percentage
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
                event.preventDefault();
                if (!this.player.options.live) {
                    this.seekToPercent(parseInt(lowerKey) * 10);
                }
                break;
        }
    }

    cancelFullScreen(e) {
        const event = e || window.event;
        // ESC key
        if (event.keyCode === 27) {
            if (this.player.fullScreen.isFullScreen('web')) {
                this.player.fullScreen.cancel('web');
            }
        }
    }

    destroy() {
        if (this.player.options.hotkey) {
            document.removeEventListener('keydown', this.doHotKeyHandler);
        }
        document.removeEventListener('keydown', this.cancelFullScreenHandler);
    }
}

export default HotKey;
