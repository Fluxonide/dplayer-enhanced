import utils from './utils';

class Setting {
    constructor(player) {
        this.player = player;

        this.player.template.mask.addEventListener('click', () => {
            this.hide();
            this.hideSpeedPanel();
        });
        this.player.template.settingButton.addEventListener('click', () => {
            this.show();
        });

        // loop
        this.loop = this.player.options.loop;
        this.player.template.loopToggle.checked = this.loop;
        this.player.template.loop.addEventListener('click', () => {
            this.player.template.loopToggle.checked = !this.player.template.loopToggle.checked;
            if (this.player.template.loopToggle.checked) {
                this.loop = true;
            } else {
                this.loop = false;
            }
            this.hide();
        });

        // show danmaku
        this.showDanmaku = this.player.user.get('danmaku');
        if (!this.showDanmaku) {
            this.player.danmaku && this.player.danmaku.hide();
        }
        this.player.template.showDanmakuToggle.checked = this.showDanmaku;
        this.player.template.showDanmaku.addEventListener('click', () => {
            this.player.template.showDanmakuToggle.checked = !this.player.template.showDanmakuToggle.checked;
            if (this.player.template.showDanmakuToggle.checked) {
                this.showDanmaku = true;
                this.player.danmaku.show();
            } else {
                this.showDanmaku = false;
                this.player.danmaku.hide();
            }
            this.player.user.set('danmaku', this.showDanmaku ? 1 : 0);
            this.hide();
        });

        // unlimit danmaku
        this.unlimitDanmaku = this.player.user.get('unlimited');
        this.player.template.unlimitDanmakuToggle.checked = this.unlimitDanmaku;
        this.player.template.unlimitDanmaku.addEventListener('click', () => {
            this.player.template.unlimitDanmakuToggle.checked = !this.player.template.unlimitDanmakuToggle.checked;
            if (this.player.template.unlimitDanmakuToggle.checked) {
                this.unlimitDanmaku = true;
                this.player.danmaku.unlimit(true);
            } else {
                this.unlimitDanmaku = false;
                this.player.danmaku.unlimit(false);
            }
            this.player.user.set('unlimited', this.unlimitDanmaku ? 1 : 0);
            this.hide();
        });

        // speed
        this.player.template.speed.addEventListener('click', () => {
            this.player.template.settingBox.classList.add('dplayer-setting-box-narrow');
            this.player.template.settingBox.classList.add('dplayer-setting-box-speed');
        });
        for (let i = 0; i < this.player.template.speedItem.length; i++) {
            this.player.template.speedItem[i].addEventListener('click', () => {
                this.player.speed(this.player.template.speedItem[i].dataset.speed);
                this.updateSpeedPanelActive(this.player.template.speedItem[i].dataset.speed);
                this.hide();
            });
        }

        // floating speed panel (left-side slider)
        if (this.player.template.speedIndicator) {
            this.player.template.speedIndicator.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSpeedPanel();
            });
        }
        if (this.player.template.speedPanel) {
            this.player.template.speedPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Initialize slider positions
        this.speedValues = this.player.options.playbackSpeed;
        this.currentSpeed = 1;

        // Position ticks on the track
        this._positionSpeedTicks();

        // Set initial slider position to 1x
        this._updateSliderToSpeed(1);

        // Click on track to set speed at that position
        if (this.player.template.speedSliderTrack) {
            this.player.template.speedSliderTrack.addEventListener('click', (e) => {
                if (e.target === this.player.template.speedSliderThumb) {
                    return;
                }
                const rect = this.player.template.speedSliderTrack.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                const speed = this._getSpeedFromPercentage(percentage);
                this.currentSpeed = speed;
                this._updateSliderToSpeed(speed);
                this.player.speed(speed);
            });
        }

        // Drag the thumb
        if (this.player.template.speedSliderThumb) {
            let lastDragSpeed = this.currentSpeed;

            const thumbDragStart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                lastDragSpeed = this.currentSpeed;
                this.player.template.speedSliderThumb.classList.add('dplayer-speed-slider-thumb-active');
                document.addEventListener(utils.nameMap.dragMove, thumbDragMove);
                document.addEventListener(utils.nameMap.dragEnd, thumbDragEnd);
            };

            const thumbDragMove = (e) => {
                const rect = this.player.template.speedSliderTrack.getBoundingClientRect();
                const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
                let percentage = (clientX - rect.left) / rect.width;
                percentage = Math.max(0, Math.min(1, percentage));
                const speed = this._getSpeedFromPercentage(percentage);

                // Only update if speed actually changed (avoids redundant DOM writes)
                if (speed === lastDragSpeed) {
                    return;
                }
                lastDragSpeed = speed;
                this.currentSpeed = speed;

                // Position the slider at the snapped speed position (not raw mouse %)
                const snappedPercentage = this._getPercentageFromSpeed(speed);
                this.player.template.speedSliderThumb.style.left = snappedPercentage * 100 + '%';
                this.player.template.speedSliderFilled.style.width = snappedPercentage * 100 + '%';
                this._highlightActivePreset(speed);

                // Update video speed directly — NO notice during drag, but update indicator live
                this.player.video.playbackRate = speed;
                this.player._savedPlaybackRate = speed;
                if (this.player.template.speedIndicator) {
                    this.player.template.speedIndicator.innerText = `${speed}x`;
                }
            };

            const thumbDragEnd = () => {
                document.removeEventListener(utils.nameMap.dragMove, thumbDragMove);
                document.removeEventListener(utils.nameMap.dragEnd, thumbDragEnd);
                this.player.template.speedSliderThumb.classList.remove('dplayer-speed-slider-thumb-active');
                // Final speed set with notice
                this.player.speed(this.currentSpeed);
            };

            this.player.template.speedSliderThumb.addEventListener(utils.nameMap.dragStart, thumbDragStart);
        }

        // Click on labels to jump to that preset speed
        for (let i = 0; i < this.player.template.speedSliderLabels.length; i++) {
            this.player.template.speedSliderLabels[i].addEventListener('click', () => {
                const speed = this.speedValues[i];
                this.currentSpeed = speed;
                this._updateSliderToSpeed(speed);
                this.player.speed(speed);
            });
        }

        // danmaku opacity
        if (this.player.danmaku) {
            const dWidth = 130;
            this.player.on('danmaku_opacity', (percentage) => {
                this.player.bar.set('danmaku', percentage, 'width');
                this.player.user.set('opacity', percentage);
            });
            this.player.danmaku.opacity(this.player.user.get('opacity'));

            const danmakuMove = (event) => {
                const e = event || window.event;
                let percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.danmakuOpacityBarWrap)) / dWidth;
                percentage = Math.max(percentage, 0);
                percentage = Math.min(percentage, 1);
                this.player.danmaku.opacity(percentage);
            };
            const danmakuUp = () => {
                document.removeEventListener(utils.nameMap.dragEnd, danmakuUp);
                document.removeEventListener(utils.nameMap.dragMove, danmakuMove);
                this.player.template.danmakuOpacityBox.classList.remove('dplayer-setting-danmaku-active');
            };

            this.player.template.danmakuOpacityBarWrapWrap.addEventListener('click', (event) => {
                const e = event || window.event;
                let percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.danmakuOpacityBarWrap)) / dWidth;
                percentage = Math.max(percentage, 0);
                percentage = Math.min(percentage, 1);
                this.player.danmaku.opacity(percentage);
            });
            this.player.template.danmakuOpacityBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
                document.addEventListener(utils.nameMap.dragMove, danmakuMove);
                document.addEventListener(utils.nameMap.dragEnd, danmakuUp);
                this.player.template.danmakuOpacityBox.classList.add('dplayer-setting-danmaku-active');
            });
        }
    }

    hide() {
        this.player.template.settingBox.classList.remove('dplayer-setting-box-open');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        setTimeout(() => {
            this.player.template.settingBox.classList.remove('dplayer-setting-box-narrow');
            this.player.template.settingBox.classList.remove('dplayer-setting-box-speed');
        }, 300);

        this.player.controller.disableAutoHide = false;
    }

    show() {
        this.player.template.settingBox.classList.add('dplayer-setting-box-open');
        this.player.template.mask.classList.add('dplayer-mask-show');

        this.player.controller.disableAutoHide = true;
    }

    toggleSpeedPanel() {
        if (this.player.template.speedPanel.classList.contains('dplayer-speed-panel-open')) {
            this.hideSpeedPanel();
        } else {
            this.showSpeedPanel();
        }
    }

    showSpeedPanel() {
        this.hide();
        this.player.template.speedPanel.classList.add('dplayer-speed-panel-open');
        this.player.template.mask.classList.add('dplayer-mask-show');
        this.player.controller.disableAutoHide = true;
    }

    hideSpeedPanel() {
        this.player.template.speedPanel.classList.remove('dplayer-speed-panel-open');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        this.player.controller.disableAutoHide = false;
    }

    _positionSpeedTicks() {
        const count = this.speedValues.length;
        for (let i = 0; i < this.player.template.speedSliderTicks.length; i++) {
            const percent = count > 1 ? (i / (count - 1)) * 100 : 50;
            this.player.template.speedSliderTicks[i].style.left = percent + '%';
        }
        // Position labels at the same spots as ticks
        for (let i = 0; i < this.player.template.speedSliderLabels.length; i++) {
            const percent = count > 1 ? (i / (count - 1)) * 100 : 50;
            this.player.template.speedSliderLabels[i].style.left = percent + '%';
        }
    }

    // Convert a slider percentage (0–1) to a speed value by interpolating between presets
    _getSpeedFromPercentage(percentage) {
        const count = this.speedValues.length;
        if (count === 0) {
            return 1;
        }
        if (count === 1) {
            return this.speedValues[0];
        }
        // Map percentage to a float index
        const floatIndex = percentage * (count - 1);
        const lowerIndex = Math.floor(floatIndex);
        const upperIndex = Math.ceil(floatIndex);

        if (lowerIndex === upperIndex || upperIndex >= count) {
            return this.speedValues[Math.min(lowerIndex, count - 1)];
        }

        const fraction = floatIndex - lowerIndex;
        const speed = this.speedValues[lowerIndex] + (this.speedValues[upperIndex] - this.speedValues[lowerIndex]) * fraction;
        // Round to 0.05 steps (matching keyboard shortcut increments)
        return Math.round(speed * 20) / 20;
    }

    // Convert a speed value back to a slider percentage (0–1)
    _getPercentageFromSpeed(speed) {
        const count = this.speedValues.length;
        if (count <= 1) {
            return 0.5;
        }
        // Find which two presets this speed falls between
        if (speed <= this.speedValues[0]) {
            return 0;
        }
        if (speed >= this.speedValues[count - 1]) {
            return 1;
        }
        for (let i = 0; i < count - 1; i++) {
            if (speed >= this.speedValues[i] && speed <= this.speedValues[i + 1]) {
                const range = this.speedValues[i + 1] - this.speedValues[i];
                const fraction = range > 0 ? (speed - this.speedValues[i]) / range : 0;
                return (i + fraction) / (count - 1);
            }
        }
        return 0.5;
    }

    // Position slider at a given percentage and update UI for a given speed
    _setSliderAt(percentage, speed) {
        const percent = percentage * 100;

        if (this.player.template.speedSliderThumb) {
            this.player.template.speedSliderThumb.style.left = percent + '%';
        }
        if (this.player.template.speedSliderFilled) {
            this.player.template.speedSliderFilled.style.width = percent + '%';
        }

        this._highlightActivePreset(speed);
    }

    // Convenience: position slider from a speed value
    _updateSliderToSpeed(speed) {
        const percentage = this._getPercentageFromSpeed(speed);
        this._setSliderAt(percentage, speed);
    }

    // Highlight ticks behind the slider as filled, and mark the exact active preset
    _highlightActivePreset(speed) {
        const rounded = Math.round(speed * 20) / 20;

        for (let i = 0; i < this.player.template.speedSliderTicks.length; i++) {
            const tickSpeed = this.speedValues[i];

            // Fill all ticks that the bar has passed over
            if (tickSpeed <= rounded) {
                this.player.template.speedSliderTicks[i].classList.add('dplayer-speed-slider-tick-filled');
            } else {
                this.player.template.speedSliderTicks[i].classList.remove('dplayer-speed-slider-tick-filled');
            }

            // Highlight the exact active tick
            if (tickSpeed === rounded) {
                this.player.template.speedSliderTicks[i].classList.add('dplayer-speed-slider-tick-active');
            } else {
                this.player.template.speedSliderTicks[i].classList.remove('dplayer-speed-slider-tick-active');
            }
        }

        for (let i = 0; i < this.player.template.speedSliderLabels.length; i++) {
            if (this.speedValues[i] === rounded) {
                this.player.template.speedSliderLabels[i].classList.add('dplayer-speed-slider-label-active');
            } else {
                this.player.template.speedSliderLabels[i].classList.remove('dplayer-speed-slider-label-active');
            }
        }
    }

    // Called when speed is changed from the settings menu to sync the slider
    updateSpeedPanelActive(speed) {
        const speedNum = parseFloat(speed);
        this.currentSpeed = speedNum;
        this._updateSliderToSpeed(speedNum);
    }
}

export default Setting;
