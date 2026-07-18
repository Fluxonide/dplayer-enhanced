import Icons from './icons';
import utils from './utils';
import { DPlayerOptions, TemplateConstructorOptions } from './types';
import { tplPlayer } from './tpl-player';

class Template {
    container: HTMLElement;
    options: DPlayerOptions;
    index: number;
    tran: (key: string) => string;

    // Volume
    volumeBar!: HTMLElement;
    volumeBarWrap!: HTMLElement;
    volumeBarWrapWrap!: HTMLElement;
    volumeButton!: HTMLElement;
    volumeButtonIcon!: HTMLElement;
    volumeIcon!: HTMLElement;

    // Progress bars
    playedBar!: HTMLElement;
    loadedBar!: HTMLElement;
    playedBarWrap!: HTMLElement;
    playedBarTime!: HTMLElement;

    // Danmaku
    danmaku!: HTMLElement;
    danmakuLoading!: HTMLElement;
    danmakuOpacityBar!: HTMLElement;
    danmakuOpacityBarWrap!: HTMLElement;
    danmakuOpacityBarWrapWrap!: HTMLElement;
    danmakuOpacityBox!: HTMLElement;

    // Video
    video!: HTMLVideoElement;
    videoWrap!: HTMLElement;
    bezel!: HTMLElement;

    // Controls
    playButton!: HTMLElement;
    mobilePlayButton!: HTMLElement;
    controllerMask!: HTMLElement;
    controller!: HTMLElement;
    ptime!: HTMLElement;
    dtime!: HTMLElement;

    // Settings
    settingButton!: HTMLElement;
    settingBox!: HTMLElement;
    mask!: HTMLElement;
    loop!: HTMLElement;
    loopToggle!: HTMLInputElement;
    showDanmaku: HTMLElement | null = null;
    showDanmakuToggle: HTMLInputElement | null = null;
    unlimitDanmaku: HTMLElement | null = null;
    unlimitDanmakuToggle: HTMLInputElement | null = null;
    speed!: HTMLElement;
    speedItem!: NodeListOf<HTMLElement>;

    // Speed panel / slider
    speedIndicator!: HTMLElement;
    speedPanel!: HTMLElement;
    speedSliderTrack!: HTMLElement;
    speedSliderFilled!: HTMLElement;
    speedSliderThumb!: HTMLElement;
    speedSliderTicks!: NodeListOf<HTMLElement>;
    speedSliderLabels!: NodeListOf<HTMLElement>;
    speedSliderBtnMinus!: HTMLElement;
    speedSliderBtnPlus!: HTMLElement;

    // Comment
    commentInput!: HTMLInputElement;
    commentButton!: HTMLElement;
    commentSettingBox!: HTMLElement;
    commentSettingButton!: HTMLElement;
    commentSettingFill!: HTMLElement;
    commentSendButton!: HTMLElement;
    commentSendFill!: HTMLElement;
    commentColorSettingBox!: HTMLElement;

    // Fullscreen
    browserFullButton!: HTMLElement;
    webFullButton!: HTMLElement;

    // Context menu
    menu!: HTMLElement;
    menuItem!: NodeListOf<HTMLElement>;

    // Quality
    qualityList!: HTMLElement;
    qualityButton!: HTMLElement;

    // Media buttons
    camareButton!: HTMLElement;
    airplayButton!: HTMLElement;
    chromecastButton!: HTMLElement;

    // Subtitle
    subtitleButton!: HTMLElement;
    subtitleButtonInner!: HTMLElement;
    subtitlesButton!: HTMLElement;
    subtitlesBox!: HTMLElement;
    subtitlesItem!: NodeListOf<HTMLElement>;
    subtitle!: HTMLElement;
    subtrack!: HTMLTrackElement;

    // Bar / preview
    barPreview!: HTMLElement;
    barWrap!: HTMLElement;

    // Notices
    noticeList!: HTMLElement;

    // Info panel
    infoPanel!: HTMLElement;
    infoPanelClose!: HTMLElement;
    infoVersion!: HTMLElement;
    infoFPS!: HTMLElement;
    infoType!: HTMLElement;
    infoUrl!: HTMLElement;
    infoResolution!: HTMLElement;
    infoDuration!: HTMLElement;
    infoDanmakuId!: HTMLElement;
    infoDanmakuApi!: HTMLElement;
    infoDanmakuAmount!: HTMLElement;

    constructor(options: TemplateConstructorOptions) {
        this.container = options.container;
        this.options = options.options;
        this.index = options.index;
        this.tran = options.tran;
        this.init();
    }

    private init(): void {
        this.container.innerHTML = tplPlayer({
            options: this.options,
            index: this.index,
            tran: this.tran,
            icons: Icons,
            mobile: utils.isMobile,
            video: {
                current: true,
                pic: this.options.video.pic,
                screenshot: this.options.screenshot,
                airplay: utils.isSafari && !utils.isChrome ? this.options.airplay : false,
                chromecast: this.options.chromecast,
                preload: this.options.preload,
                url: this.options.video.url,
                subtitle: this.options.subtitle,
            },
        });

        // Typed helper: query and cast in one call
        const q = <T extends HTMLElement = HTMLElement>(sel: string): T => this.container.querySelector<T>(sel) as T;

        this.volumeBar = q('.dplayer-volume-bar-inner');
        this.volumeBarWrap = q('.dplayer-volume-bar');
        this.volumeBarWrapWrap = q('.dplayer-volume-bar-wrap');
        this.volumeButton = q('.dplayer-volume');
        this.volumeButtonIcon = q('.dplayer-volume-icon');
        this.volumeIcon = q('.dplayer-volume-icon .dplayer-icon-content');
        this.playedBar = q('.dplayer-played');
        this.loadedBar = q('.dplayer-loaded');
        this.playedBarWrap = q('.dplayer-bar-wrap');
        this.playedBarTime = q('.dplayer-bar-time');
        this.danmaku = q('.dplayer-danmaku');
        this.danmakuLoading = q('.dplayer-danloading');
        this.video = q<HTMLVideoElement>('.dplayer-video-current');
        this.bezel = q('.dplayer-bezel-icon');
        this.playButton = q('.dplayer-play-icon');
        this.mobilePlayButton = q('.dplayer-mobile-play');
        this.videoWrap = q('.dplayer-video-wrap');
        this.controllerMask = q('.dplayer-controller-mask');
        this.ptime = q('.dplayer-ptime');
        this.settingButton = q('.dplayer-setting-icon');
        this.settingBox = q('.dplayer-setting-box');
        this.mask = q('.dplayer-mask');
        this.loop = q('.dplayer-setting-loop');
        this.loopToggle = q<HTMLInputElement>('.dplayer-setting-loop .dplayer-toggle-setting-input');
        this.showDanmaku = q('.dplayer-setting-showdan');
        this.showDanmakuToggle = q<HTMLInputElement>('.dplayer-showdan-setting-input');
        this.unlimitDanmaku = q('.dplayer-setting-danunlimit');
        this.unlimitDanmakuToggle = q<HTMLInputElement>('.dplayer-danunlimit-setting-input');
        this.speed = q('.dplayer-setting-speed');
        this.speedItem = this.container.querySelectorAll<HTMLElement>('.dplayer-setting-speed-item');
        this.danmakuOpacityBar = q('.dplayer-danmaku-bar-inner');
        this.danmakuOpacityBarWrap = q('.dplayer-danmaku-bar');
        this.danmakuOpacityBarWrapWrap = q('.dplayer-danmaku-bar-wrap');
        this.danmakuOpacityBox = q('.dplayer-setting-danmaku');
        this.dtime = q('.dplayer-dtime');
        this.speedIndicator = q('.dplayer-speed-indicator');
        this.speedPanel = q('.dplayer-speed-panel');
        this.speedSliderTrack = q('.dplayer-speed-slider-track');
        this.speedSliderFilled = q('.dplayer-speed-slider-filled');
        this.speedSliderThumb = q('.dplayer-speed-slider-thumb');
        this.speedSliderTicks = this.container.querySelectorAll<HTMLElement>('.dplayer-speed-slider-tick');
        this.speedSliderLabels = this.container.querySelectorAll<HTMLElement>('.dplayer-speed-slider-label');
        this.speedSliderBtnMinus = q('.dplayer-speed-slider-btn-minus');
        this.speedSliderBtnPlus = q('.dplayer-speed-slider-btn-plus');
        this.controller = q('.dplayer-controller');
        this.commentInput = q<HTMLInputElement>('.dplayer-comment-input');
        this.commentButton = q('.dplayer-comment-icon');
        this.commentSettingBox = q('.dplayer-comment-setting-box');
        this.commentSettingButton = q('.dplayer-comment-setting-icon');
        this.commentSettingFill = q('.dplayer-comment-setting-icon path');
        this.commentSendButton = q('.dplayer-send-icon');
        this.commentSendFill = q('.dplayer-send-icon path');
        this.commentColorSettingBox = q('.dplayer-comment-setting-color');
        this.browserFullButton = q('.dplayer-full-icon');
        this.webFullButton = q('.dplayer-full-in-icon');
        this.menu = q('.dplayer-menu');
        this.menuItem = this.container.querySelectorAll<HTMLElement>('.dplayer-menu-item');
        this.qualityList = q('.dplayer-quality-list');
        this.camareButton = q('.dplayer-camera-icon');
        this.airplayButton = q('.dplayer-airplay-icon');
        this.chromecastButton = q('.dplayer-chromecast-icon');
        this.subtitleButton = q('.dplayer-subtitle-icon');
        this.subtitleButtonInner = q('.dplayer-subtitle-icon .dplayer-icon-content');
        this.subtitlesButton = q('.dplayer-subtitles-icon');
        this.subtitlesBox = q('.dplayer-subtitles-box');
        this.subtitlesItem = this.container.querySelectorAll<HTMLElement>('.dplayer-subtitles-item');
        this.subtitle = q('.dplayer-subtitle');
        this.subtrack = q<HTMLTrackElement>('.dplayer-subtrack');
        this.qualityButton = q('.dplayer-quality-icon');
        this.barPreview = q('.dplayer-bar-preview');
        this.barWrap = q('.dplayer-bar-wrap');
        this.noticeList = q('.dplayer-notice-list');
        this.infoPanel = q('.dplayer-info-panel');
        this.infoPanelClose = q('.dplayer-info-panel-close');
        this.infoVersion = q('.dplayer-info-panel-item-version .dplayer-info-panel-item-data');
        this.infoFPS = q('.dplayer-info-panel-item-fps .dplayer-info-panel-item-data');
        this.infoType = q('.dplayer-info-panel-item-type .dplayer-info-panel-item-data');
        this.infoUrl = q('.dplayer-info-panel-item-url .dplayer-info-panel-item-data');
        this.infoResolution = q('.dplayer-info-panel-item-resolution .dplayer-info-panel-item-data');
        this.infoDuration = q('.dplayer-info-panel-item-duration .dplayer-info-panel-item-data');
        this.infoDanmakuId = q('.dplayer-info-panel-item-danmaku-id .dplayer-info-panel-item-data');
        this.infoDanmakuApi = q('.dplayer-info-panel-item-danmaku-api .dplayer-info-panel-item-data');
        this.infoDanmakuAmount = q('.dplayer-info-panel-item-danmaku-amount .dplayer-info-panel-item-data');
    }

    /** Create a notice element */
    static NewNotice(text: string, opacity: number, id?: string): HTMLElement {
        const notice = document.createElement('div');
        notice.classList.add('dplayer-notice');
        notice.style.opacity = String(opacity);
        notice.innerText = text;
        if (id) notice.id = `dplayer-notice-${id}`;
        return notice;
    }
}

export default Template;
