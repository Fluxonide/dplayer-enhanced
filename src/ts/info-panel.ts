/* global DPLAYER_VERSION GIT_HASH */
import { DPlayerInstance } from './types';
import Template from './template';

class InfoPanel {
    private container: HTMLElement;
    private template: Template;
    private video: HTMLVideoElement;
    private player: DPlayerInstance;
    private beginTime = 0;

    constructor(player: DPlayerInstance) {
        this.container = player.template.infoPanel;
        this.template = player.template;
        this.video = player.video;
        this.player = player;

        this.template.infoPanelClose.addEventListener('click', () => {
            this.hide();
        });
    }

    show(): void {
        this.beginTime = Date.now();
        this.update();
        this.player.timer.enable('info');
        this.player.timer.enable('fps');
        this.container.classList.remove('dplayer-info-panel-hide');
    }

    hide(): void {
        this.player.timer.disable('info');
        this.player.timer.disable('fps');
        this.container.classList.add('dplayer-info-panel-hide');
    }

    triggle(): void {
        if (this.container.classList.contains('dplayer-info-panel-hide')) {
            this.show();
        } else {
            this.hide();
        }
    }

    update(): void {
        this.template.infoVersion.innerHTML = `v${DPLAYER_VERSION} ${GIT_HASH}`;
        this.template.infoType.innerHTML = this.player.type;
        this.template.infoUrl.innerHTML = this.player.options.video.url;
        this.template.infoResolution.innerHTML = `${this.video.videoWidth} x ${this.video.videoHeight}`;
        this.template.infoDuration.innerHTML = String(this.video.duration);

        if (this.player.options.danmaku) {
            this.template.infoDanmakuId.innerHTML = this.player.options.danmaku.id;
            this.template.infoDanmakuApi.innerHTML = this.player.options.danmaku.api;
            this.template.infoDanmakuAmount.innerHTML = String(this.player.danmaku?.dan.length ?? 0);
        }
    }

    fps(value: number): void {
        this.template.infoFPS.innerHTML = value.toFixed(1);
    }
}

export default InfoPanel;
