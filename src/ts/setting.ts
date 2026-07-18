import utils from './utils';
import { DPlayerInstance } from './types';

class Setting {
    private player: DPlayerInstance;
    loop: boolean;
    showDanmaku: number;
    unlimitDanmaku: number;
    private speedValues: number[];
    currentSpeed: number;

    constructor(player: DPlayerInstance) {
        this.player = player;
        this.loop = false;
        this.showDanmaku = 0;
        this.unlimitDanmaku = 0;
        this.speedValues = player.options.playbackSpeed ?? [0.5, 0.75, 1, 1.25, 1.5, 2];
        this.currentSpeed = 1;

        this._initMask();
        this._initLoop();
        this._initShowDanmaku();
        this._initUnlimitDanmaku();
        this._initSpeedMenu();
        this._initSpeedSlider();
        this._initDanmakuOpacity();
    }

    // -----------------------------------------------------------------------
    // Initialisation helpers
    // -----------------------------------------------------------------------

    private _initMask(): void {
        this.player.template.mask.addEventListener('click', () => {
            this.hide();
            this.hideSpeedPanel();
        });
        this.player.template.settingButton.addEventListener('click', () => {
            this.show();
        });
    }

    private _initLoop(): void {
        this.loop = this.player.options.loop ?? false;
        this.player.template.loopToggle.checked = this.loop;
        this.player.template.loop.addEventListener('click', () => {
            this.player.template.loopToggle.checked = !this.player.template.loopToggle.checked;
            this.loop = this.player.template.loopToggle.checked;
            this.hide();
        });
    }

    private _initShowDanmaku(): void {
        this.showDanmaku = this.player.user.get('danmaku');
        if (!this.showDanmaku) {
            this.player.danmaku?.hide();
        }
        // These elements are only rendered when danmaku is configured
        if (!this.player.template.showDanmaku || !this.player.template.showDanmakuToggle) return;
        this.player.template.showDanmakuToggle.checked = !!this.showDanmaku;
        this.player.template.showDanmaku.addEventListener('click', () => {
            this.player.template.showDanmakuToggle!.checked = !this.player.template.showDanmakuToggle!.checked;
            if (this.player.template.showDanmakuToggle!.checked) {
                this.showDanmaku = 1;
                this.player.danmaku?.show();
            } else {
                this.showDanmaku = 0;
                this.player.danmaku?.hide();
            }
            this.player.user.set('danmaku', this.showDanmaku);
            this.hide();
        });
    }

    private _initUnlimitDanmaku(): void {
        this.unlimitDanmaku = this.player.user.get('unlimited');
        // These elements are only rendered when danmaku is configured
        if (!this.player.template.unlimitDanmaku || !this.player.template.unlimitDanmakuToggle) return;
        this.player.template.unlimitDanmakuToggle.checked = !!this.unlimitDanmaku;
        this.player.template.unlimitDanmaku.addEventListener('click', () => {
            this.player.template.unlimitDanmakuToggle!.checked = !this.player.template.unlimitDanmakuToggle!.checked;
            if (this.player.template.unlimitDanmakuToggle!.checked) {
                this.unlimitDanmaku = 1;
                this.player.danmaku?.unlimit(true);
            } else {
                this.unlimitDanmaku = 0;
                this.player.danmaku?.unlimit(false);
            }
            this.player.user.set('unlimited', this.unlimitDanmaku);
            this.hide();
        });
    }

    private _initSpeedMenu(): void {
        this.player.template.speed.addEventListener('click', () => {
            this.player.template.settingBox.classList.add('dplayer-setting-box-narrow');
            this.player.template.settingBox.classList.add('dplayer-setting-box-speed');
        });

        for (let i = 0; i < this.player.template.speedItem.length; i++) {
            this.player.template.speedItem[i].addEventListener('click', () => {
                const speedStr = (this.player.template.speedItem[i] as HTMLElement & { dataset: DOMStringMap }).dataset.speed ?? '1';
                this.player.speed(parseFloat(speedStr));
                this.updateSpeedPanelActive(parseFloat(speedStr));
                this.hide();
            });
        }

        if (this.player.template.speedIndicator) {
            this.player.template.speedIndicator.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                this.toggleSpeedPanel();
            });
        }

        if (this.player.template.speedPanel) {
            this.player.template.speedPanel.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
            });
        }

        this._positionSpeedTicks();
        this._updateSliderToSpeed(1);
    }

    private _initSpeedSlider(): void {
        // Click on track to set speed at that position
        if (this.player.template.speedSliderTrack) {
            this.player.template.speedSliderTrack.addEventListener('click', (e: MouseEvent) => {
                if (e.target === this.player.template.speedSliderThumb) return;
                const rect = this.player.template.speedSliderTrack.getBoundingClientRect();
                const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const speed = this._getSpeedFromPercentage(percentage);
                this.currentSpeed = speed;
                this._updateSliderToSpeed(speed);
                this.player.speed(speed);
            });
        }

        // Drag the thumb
        if (this.player.template.speedSliderThumb) {
            let lastDragSpeed = this.currentSpeed;

            const thumbDragMove = (e: Event): void => {
                const me = e as MouseEvent & { changedTouches?: TouchList };
                const clientX = me.clientX ?? me.changedTouches?.[0]?.clientX ?? 0;
                const rect = this.player.template.speedSliderTrack.getBoundingClientRect();
                let percentage = (clientX - rect.left) / rect.width;
                percentage = Math.max(0, Math.min(1, percentage));
                const speed = this._getSpeedFromPercentage(percentage);

                if (speed === lastDragSpeed) return;
                lastDragSpeed = speed;
                this.currentSpeed = speed;

                const snapped = this._getPercentageFromSpeed(speed);
                this.player.template.speedSliderThumb.style.left = `${snapped * 100}%`;
                this.player.template.speedSliderFilled.style.width = `${snapped * 100}%`;
                this._highlightActivePreset(speed);

                this.player.video.playbackRate = speed;
                this.player._savedPlaybackRate = speed;
                if (this.player.template.speedIndicator) {
                    this.player.template.speedIndicator.innerText = `${speed}x`;
                }
            };

            const thumbDragEnd = (): void => {
                document.removeEventListener(utils.nameMap.dragMove, thumbDragMove);
                document.removeEventListener(utils.nameMap.dragEnd, thumbDragEnd);
                this.player.template.speedSliderThumb.classList.remove('dplayer-speed-slider-thumb-active');
                this.player.speed(this.currentSpeed);
            };

            const thumbDragStart = (e: Event): void => {
                e.preventDefault();
                e.stopPropagation();
                lastDragSpeed = this.currentSpeed;
                this.player.template.speedSliderThumb.classList.add('dplayer-speed-slider-thumb-active');
                document.addEventListener(utils.nameMap.dragMove, thumbDragMove);
                document.addEventListener(utils.nameMap.dragEnd, thumbDragEnd);
            };

            this.player.template.speedSliderThumb.addEventListener(utils.nameMap.dragStart, thumbDragStart);
        }

        // − / + buttons
        const stepSpeed = (delta: number): void => {
            const next = Math.round((this.currentSpeed + delta) * 20) / 20;
            const min = this.speedValues[0];
            const max = this.speedValues[this.speedValues.length - 1];
            const clamped = Math.min(max, Math.max(min, next));
            this.currentSpeed = clamped;
            this._updateSliderToSpeed(clamped);
            this.player.speed(clamped);
        };

        if (this.player.template.speedSliderBtnMinus) {
            this.player.template.speedSliderBtnMinus.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                stepSpeed(-0.05);
            });
        }
        if (this.player.template.speedSliderBtnPlus) {
            this.player.template.speedSliderBtnPlus.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                stepSpeed(0.05);
            });
        }

        // Label clicks to jump to a preset speed
        for (let i = 0; i < this.player.template.speedSliderLabels.length; i++) {
            this.player.template.speedSliderLabels[i].addEventListener('click', () => {
                const speed = this.speedValues[i];
                this.currentSpeed = speed;
                this._updateSliderToSpeed(speed);
                this.player.speed(speed);
            });
        }
    }

    private _initDanmakuOpacity(): void {
        if (!this.player.danmaku) return;

        const dWidth = 130;

        this.player.on('danmaku_opacity', (percentage) => {
            this.player.bar.set('danmaku', percentage as number, 'width');
            this.player.user.set('opacity', percentage as number);
        });

        this.player.danmaku.opacity(this.player.user.get('opacity'));

        const danmakuMove = (e: Event): void => {
            const me = e as MouseEvent & { changedTouches?: TouchList };
            const clientX = me.clientX ?? me.changedTouches?.[0]?.clientX ?? 0;
            let percentage = (clientX - utils.getBoundingClientRectViewLeft(this.player.template.danmakuOpacityBarWrap)) / dWidth;
            percentage = Math.max(0, Math.min(1, percentage));
            this.player.danmaku!.opacity(percentage);
        };

        const danmakuUp = (): void => {
            document.removeEventListener(utils.nameMap.dragEnd, danmakuUp);
            document.removeEventListener(utils.nameMap.dragMove, danmakuMove);
            this.player.template.danmakuOpacityBox.classList.remove('dplayer-setting-danmaku-active');
        };

        this.player.template.danmakuOpacityBarWrapWrap.addEventListener('click', (e: Event) => {
            const me = e as MouseEvent & { changedTouches?: TouchList };
            const clientX = me.clientX ?? me.changedTouches?.[0]?.clientX ?? 0;
            let percentage = (clientX - utils.getBoundingClientRectViewLeft(this.player.template.danmakuOpacityBarWrap)) / dWidth;
            percentage = Math.max(0, Math.min(1, percentage));
            this.player.danmaku!.opacity(percentage);
        });

        this.player.template.danmakuOpacityBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
            document.addEventListener(utils.nameMap.dragMove, danmakuMove);
            document.addEventListener(utils.nameMap.dragEnd, danmakuUp);
            this.player.template.danmakuOpacityBox.classList.add('dplayer-setting-danmaku-active');
        });
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    hide(): void {
        this.player.template.settingBox.classList.remove('dplayer-setting-box-open');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        setTimeout(() => {
            this.player.template.settingBox.classList.remove('dplayer-setting-box-narrow');
            this.player.template.settingBox.classList.remove('dplayer-setting-box-speed');
        }, 300);
        this.player.controller.disableAutoHide = false;
    }

    show(): void {
        this.player.template.settingBox.classList.add('dplayer-setting-box-open');
        this.player.template.mask.classList.add('dplayer-mask-show');
        this.player.controller.disableAutoHide = true;
    }

    toggleSpeedPanel(): void {
        if (this.player.template.speedPanel.classList.contains('dplayer-speed-panel-open')) {
            this.hideSpeedPanel();
        } else {
            this.showSpeedPanel();
        }
    }

    showSpeedPanel(): void {
        this.hide();
        this.player.template.speedPanel.classList.add('dplayer-speed-panel-open');
        this.player.template.mask.classList.add('dplayer-mask-show');
        this.player.controller.disableAutoHide = true;
    }

    hideSpeedPanel(): void {
        this.player.template.speedPanel.classList.remove('dplayer-speed-panel-open');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        this.player.controller.disableAutoHide = false;
    }

    /** Called externally when speed changes (e.g. from hotkey) to sync slider */
    updateSpeedPanelActive(speed: number): void {
        this.currentSpeed = speed;
        this._updateSliderToSpeed(speed);
    }

    // -----------------------------------------------------------------------
    // Private speed helpers
    // -----------------------------------------------------------------------

    private _positionSpeedTicks(): void {
        const count = this.speedValues.length;
        for (let i = 0; i < this.player.template.speedSliderTicks.length; i++) {
            const percent = count > 1 ? (i / (count - 1)) * 100 : 50;
            this.player.template.speedSliderTicks[i].style.left = `${percent}%`;
        }
        for (let i = 0; i < this.player.template.speedSliderLabels.length; i++) {
            const percent = count > 1 ? (i / (count - 1)) * 100 : 50;
            this.player.template.speedSliderLabels[i].style.left = `${percent}%`;
        }
    }

    private _getSpeedFromPercentage(percentage: number): number {
        const count = this.speedValues.length;
        if (count === 0) return 1;
        if (count === 1) return this.speedValues[0];

        const floatIndex = percentage * (count - 1);
        const lowerIndex = Math.floor(floatIndex);
        const upperIndex = Math.ceil(floatIndex);

        if (lowerIndex === upperIndex || upperIndex >= count) {
            return this.speedValues[Math.min(lowerIndex, count - 1)];
        }

        const fraction = floatIndex - lowerIndex;
        const speed = this.speedValues[lowerIndex] + (this.speedValues[upperIndex] - this.speedValues[lowerIndex]) * fraction;
        return Math.round(speed * 20) / 20;
    }

    private _getPercentageFromSpeed(speed: number): number {
        const count = this.speedValues.length;
        if (count <= 1) return 0.5;
        if (speed <= this.speedValues[0]) return 0;
        if (speed >= this.speedValues[count - 1]) return 1;

        for (let i = 0; i < count - 1; i++) {
            if (speed >= this.speedValues[i] && speed <= this.speedValues[i + 1]) {
                const range = this.speedValues[i + 1] - this.speedValues[i];
                const fraction = range > 0 ? (speed - this.speedValues[i]) / range : 0;
                return (i + fraction) / (count - 1);
            }
        }
        return 0.5;
    }

    private _updateSliderToSpeed(speed: number): void {
        const percentage = this._getPercentageFromSpeed(speed);
        const percent = percentage * 100;
        if (this.player.template.speedSliderThumb) {
            this.player.template.speedSliderThumb.style.left = `${percent}%`;
        }
        if (this.player.template.speedSliderFilled) {
            this.player.template.speedSliderFilled.style.width = `${percent}%`;
        }
        this._highlightActivePreset(speed);
    }

    private _highlightActivePreset(speed: number): void {
        const rounded = Math.round(speed * 20) / 20;

        for (let i = 0; i < this.player.template.speedSliderTicks.length; i++) {
            const tickSpeed = this.speedValues[i];
            this.player.template.speedSliderTicks[i].classList.toggle('dplayer-speed-slider-tick-filled', tickSpeed <= rounded);
            this.player.template.speedSliderTicks[i].classList.toggle('dplayer-speed-slider-tick-active', tickSpeed === rounded);
        }

        for (let i = 0; i < this.player.template.speedSliderLabels.length; i++) {
            this.player.template.speedSliderLabels[i].classList.toggle('dplayer-speed-slider-label-active', this.speedValues[i] === rounded);
        }
    }
}

export default Setting;
