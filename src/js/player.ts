/* global DPLAYER_VERSION */
import Promise from 'promise-polyfill';

import utils from './utils';
import handleOption from './options';
import { i18n } from './i18n';
import Template from './template';
import Icons from './icons';
import Danmaku from './danmaku';
import Events from './events';
import FullScreen from './fullscreen';
import User from './user';
import Subtitle from './subtitle';
import Subtitles from './subtitles';
import Bar from './bar';
import Timer from './timer';
import Bezel from './bezel';
import Controller from './controller';
import Setting from './setting';
import Comment from './comment';
import HotKey from './hotkey';
import ContextMenu from './contextmenu';
import InfoPanel from './info-panel';

import { DPlayerOptions, VideoOptions, VideoQualityOption, DanmakuOptions, AllEventName, EventCallback } from './types';

import { tplVideo } from './tpl-video';

let index = 0;
const instances: DPlayer[] = [];

class DPlayer {
    options: DPlayerOptions;
    video: HTMLVideoElement;
    prevVideo: HTMLVideoElement | null = null;
    container: HTMLElement;
    paused = true;
    focus: boolean;
    moveBar = false;
    type = '';
    qualityIndex = 0;
    prevIndex = 0;
    quality: VideoQualityOption | undefined;
    switchingQuality = false;
    arrow: boolean;
    noticeList: Record<string, ReturnType<typeof setTimeout> | null> = {};
    _savedPlaybackRate = 1;
    plugins: Record<string, unknown> = {};
    docClickFun: (() => void) | null = null;
    containerClickFun: (() => void) | null = null;

    tran: (key: string) => string;
    events: Events;
    user: User;
    template: Template;
    bar: Bar;
    bezel: Bezel;
    fullScreen: FullScreen;
    controller: Controller;
    danmaku?: Danmaku;
    comment?: Comment;
    setting!: Setting;
    hotkey!: HotKey;
    contextmenu!: ContextMenu;
    infoPanel!: InfoPanel;
    timer!: Timer;
    subtitle?: Subtitle;
    subtitles?: Subtitles;

    constructor(options: Partial<DPlayerOptions> & { video: VideoOptions }) {
        this.options = handleOption({
            preload: options.video.type === 'webtorrent' ? 'none' : 'metadata',
            ...options,
        });

        if (this.options.video.quality) {
            this.qualityIndex = this.options.video.defaultQuality ?? 0;
            this.quality = this.options.video.quality[this.qualityIndex];
        }

        this.tran = new i18n(this.options.lang!).tran;
        this.events = new Events();
        this.user = new User(this);
        this.container = this.options.container;
        this.noticeList = {};

        this.container.classList.add('dplayer');
        if (!this.options.danmaku) this.container.classList.add('dplayer-no-danmaku');
        if (this.options.live) {
            this.container.classList.add('dplayer-live');
        } else {
            this.container.classList.remove('dplayer-live');
        }
        if (utils.isMobile) this.container.classList.add('dplayer-mobile');

        this.arrow = this.container.offsetWidth <= 500;
        if (this.arrow) this.container.classList.add('dplayer-arrow');

        // Multi-subtitle: resolve default subtitle index
        if (this.options.subtitle && Array.isArray(this.options.subtitle.url)) {
            const offSubtitle = { subtitle: '', lang: 'off' };
            this.options.subtitle.url.push(offSubtitle as typeof offSubtitle & { name?: string });

            if (this.options.subtitle.defaultSubtitle !== undefined) {
                const ds = this.options.subtitle.defaultSubtitle;
                if (typeof ds === 'string') {
                    this.options.subtitle.index = (this.options.subtitle.url as Array<{ lang?: string; name?: string }>).findIndex((sub) => sub.lang === ds || sub.name === ds);
                } else if (typeof ds === 'number') {
                    this.options.subtitle.index = ds;
                }
            }

            const urls = this.options.subtitle.url as Array<{ lang?: string }>;
            if (this.options.subtitle.index === -1 || !this.options.subtitle.index || this.options.subtitle.index > urls.length - 1) {
                this.options.subtitle.index = urls.findIndex((sub) => sub.lang === this.options.lang);
            }
            if (this.options.subtitle.index === -1) {
                this.options.subtitle.index = urls.length - 1;
            }
        }

        this.template = new Template({
            container: this.container,
            options: this.options,
            index,
            tran: this.tran,
        });

        this.video = this.template.video;
        this.bar = new Bar(this.template);
        this.bezel = new Bezel(this.template.bezel);
        this.fullScreen = new FullScreen(this);
        this.controller = new Controller(this);

        if (this.options.danmaku) {
            this.danmaku = new Danmaku({
                player: this,
                container: this.template.danmaku,
                opacity: this.user.get('opacity'),
                callback: () => {
                    setTimeout(() => {
                        this.template.danmakuLoading.style.display = 'none';
                        if (this.options.autoplay) this.play();
                    }, 0);
                },
                error: (msg) => {
                    this.notice(msg ?? '');
                },
                apiBackend: this.options.apiBackend!,
                borderColor: this.options.theme!,
                height: this.arrow ? 24 : 30,
                time: () => this.video.currentTime,
                unlimited: this.user.get('unlimited'),
                api: {
                    id: this.options.danmaku.id,
                    address: this.options.danmaku.api,
                    token: this.options.danmaku.token,
                    maximum: this.options.danmaku.maximum,
                    addition: this.options.danmaku.addition,
                    user: this.options.danmaku.user,
                    speedRate: this.options.danmaku.speedRate,
                },
                events: this.events,
                tran: (msg) => this.tran(msg),
            });
            this.comment = new Comment(this);
        }

        this.setting = new Setting(this);
        this.plugins = {};

        if (this.options.globalHotkey) {
            this.focus = true;
            this.docClickFun = null;
            this.containerClickFun = null;
        } else {
            this.focus = false;
            this.docClickFun = () => {
                this.focus = false;
            };
            this.containerClickFun = () => {
                this.focus = true;
            };
            document.addEventListener('click', this.docClickFun, true);
            this.container.addEventListener('click', this.containerClickFun, true);
        }

        this.paused = true;
        this.timer = new Timer(this);
        this.hotkey = new HotKey(this);
        this.contextmenu = new ContextMenu(this);

        this.initVideo(this.video, this.quality?.type ?? this.options.video.type ?? 'auto');

        this.infoPanel = new InfoPanel(this);

        if (!this.danmaku && this.options.autoplay) {
            this.play();
        }

        this.moveBar = false;
        index++;
        instances.push(this);
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /** Seek to a time (in seconds) */
    seek(time: number, nonotice = false): void {
        time = Math.max(time, 0);
        if (this.video.duration) {
            time = Math.min(time, this.video.duration);
        }
        if (!nonotice) {
            const timeText = utils.secondToTime(time);
            const durationText = this.video.duration ? utils.secondToTime(this.video.duration) : '00:00';
            this.notice(`${timeText} / ${durationText}`);
        }

        this.video.currentTime = time;
        this.danmaku?.seek();
        this.bar.set('played', time / this.video.duration, 'width');
        this.template.ptime.innerHTML = utils.secondToTime(time);
    }

    /** Start playback */
    play(fromNative?: boolean): void {
        this.paused = false;

        if (this.video.paused && !utils.isMobile) {
            this.bezel.switch(Icons.play);
        }

        this.template.playButton.innerHTML = Icons.pause;
        this.template.mobilePlayButton.innerHTML = Icons.pause;

        if (!fromNative) {
            const playedPromise = Promise.resolve(this.video.play());
            playedPromise
                .catch(() => {
                    this.pause();
                })
                .then(() => {});
        }

        this.timer.enable('loading');
        this.container.classList.remove('dplayer-paused');
        this.container.classList.add('dplayer-playing');
        this.danmaku?.play();

        if (this.options.mutex) {
            instances.forEach((inst) => {
                if (inst !== this) inst.pause();
            });
        }
    }

    /** Pause playback */
    pause(fromNative?: boolean): void {
        this.paused = true;
        this.container.classList.remove('dplayer-loading');

        if (!this.video.paused && !utils.isMobile) {
            this.bezel.switch(Icons.pause);
        }

        this.template.playButton.innerHTML = Icons.play;
        this.template.mobilePlayButton.innerHTML = Icons.play;

        if (!fromNative) this.video.pause();

        this.timer.disable('loading');
        this.container.classList.remove('dplayer-playing');
        this.container.classList.add('dplayer-paused');
        this.danmaku?.pause();
    }

    switchVolumeIcon(): void {
        if (this.volume() >= 0.95) {
            this.template.volumeIcon.innerHTML = Icons.volumeUp;
        } else if (this.volume() > 0) {
            this.template.volumeIcon.innerHTML = Icons.volumeDown;
        } else {
            this.template.volumeIcon.innerHTML = Icons.volumeOff;
        }
    }

    /**
     * Get or set volume.
     * Called with no argument it returns the current volume.
     */
    volume(percentage?: number, nostorage?: boolean, nonotice?: boolean): number {
        if (percentage !== undefined) {
            const p = Math.max(0, Math.min(1, parseFloat(String(percentage))));
            if (!isNaN(p)) {
                this.bar.set('volume', p, 'width');
                const formatted = `${(p * 100).toFixed(0)}%`;
                this.template.volumeBarWrapWrap.dataset['balloon'] = formatted;
                if (!nostorage) this.user.set('volume', p);
                if (!nonotice) {
                    this.notice(`${this.tran('volume')} ${(p * 100).toFixed(0)}%`, undefined, undefined, 'volume');
                }
                this.video.volume = p;
                if (this.video.muted) this.video.muted = false;
                this.switchVolumeIcon();
            }
        }
        return this.video.volume;
    }

    /** Toggle play / pause */
    toggle(): void {
        if (this.video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    /** Attach an event listener */
    on(name: AllEventName, callback: EventCallback): void {
        this.events.on(name, callback);
    }

    /** Switch to a different video source */
    switchVideo(video: VideoOptions, danmakuAPI?: DanmakuOptions): void {
        this.pause();
        this.video.poster = video.pic ?? '';
        this.video.src = video.url;
        this.initMSE(this.video, video.type ?? 'auto');

        if (danmakuAPI) {
            this.template.danmakuLoading.style.display = 'block';
            this.bar.set('played', 0, 'width');
            this.bar.set('loaded', 0, 'width');
            this.template.ptime.innerHTML = '00:00';
            this.template.danmaku.innerHTML = '';
            this.danmaku?.reload({
                id: danmakuAPI.id,
                address: danmakuAPI.api,
                token: danmakuAPI.token,
                maximum: danmakuAPI.maximum,
                addition: danmakuAPI.addition,
                user: danmakuAPI.user,
            });
        }
    }

    initMSE(video: HTMLVideoElement, type: string): void {
        this.type = type;

        if (this.options.video.customType?.[type]) {
            if (typeof this.options.video.customType[type] === 'function') {
                this.options.video.customType[type](this.video, this);
            } else {
                console.error(`Illegal customType: ${type}`);
            }
            return;
        }

        if (this.type === 'auto') {
            if (/m3u8(#|\?|$)/i.exec(video.src)) {
                this.type = 'hls';
            } else if (/.flv(#|\?|$)/i.exec(video.src)) {
                this.type = 'flv';
            } else if (/.mpd(#|\?|$)/i.exec(video.src)) {
                this.type = 'dash';
            } else {
                this.type = 'normal';
            }
        }

        if (this.type === 'hls' && (video.canPlayType('application/x-mpegURL') || video.canPlayType('application/vnd.apple.mpegURL'))) {
            this.type = 'normal';
        }

        type HlsLib = { isSupported(): boolean; new (opts: unknown): { loadSource(src: string): void; attachMedia(v: HTMLVideoElement): void; destroy(): void } };
        type FlvLib = { isSupported(): boolean; createPlayer(ds: unknown, cfg: unknown): { attachMediaElement(v: HTMLVideoElement): void; load(): void; unload(): void; detachMediaElement(): void; destroy(): void } };
        type DashLib = { MediaPlayer(): { create(): { initialize(v: HTMLVideoElement, src: string, autoplay: boolean, startTime: number): void; updateSettings(o: unknown): void }; reset(): void } };
        type WTLib = {
            WEBRTC_SUPPORT: boolean;
            new (opts: unknown): { add(id: string, cb: (t: { files: Array<{ name: string; renderTo(v: HTMLVideoElement, o: unknown): void }> }) => void): void; remove(id: string): void; destroy(): void };
        };

        const win = window as typeof window & { Hls?: HlsLib; flvjs?: FlvLib; dashjs?: DashLib; WebTorrent?: WTLib };

        switch (this.type) {
            case 'hls':
                if (win.Hls) {
                    if (win.Hls.isSupported()) {
                        const hls = new win.Hls(this.options.pluginOptions?.hls ?? {});
                        this.plugins.hls = hls;
                        hls.loadSource(video.src);
                        hls.attachMedia(video);
                        this.events.on('destroy', () => {
                            hls.destroy();
                            delete this.plugins.hls;
                        });
                    } else {
                        this.notice('Error: Hls is not supported.');
                    }
                } else {
                    this.notice("Error: Can't find Hls.");
                }
                break;

            case 'flv':
                if (win.flvjs) {
                    if (win.flvjs.isSupported()) {
                        const flvPlayer = win.flvjs.createPlayer(Object.assign(this.options.pluginOptions?.flv?.mediaDataSource ?? {}, { type: 'flv', url: video.src }), this.options.pluginOptions?.flv?.config);
                        this.plugins.flvjs = flvPlayer;
                        flvPlayer.attachMediaElement(video);
                        flvPlayer.load();
                        this.events.on('destroy', () => {
                            flvPlayer.unload();
                            flvPlayer.detachMediaElement();
                            flvPlayer.destroy();
                            delete this.plugins.flvjs;
                        });
                    } else {
                        this.notice('Error: flvjs is not supported.');
                    }
                } else {
                    this.notice("Error: Can't find flvjs.");
                }
                break;

            case 'dash':
                if (win.dashjs) {
                    const dashjsPlayer = win.dashjs.MediaPlayer().create();
                    dashjsPlayer.initialize(video, video.src, false, 0);
                    dashjsPlayer.updateSettings(this.options.pluginOptions?.dash ?? {});
                    this.plugins.dash = dashjsPlayer;
                    this.events.on('destroy', () => {
                        win.dashjs!.MediaPlayer().reset();
                        delete this.plugins.dash;
                    });
                } else {
                    this.notice("Error: Can't find dashjs.");
                }
                break;

            case 'webtorrent':
                if (win.WebTorrent) {
                    if (win.WebTorrent.WEBRTC_SUPPORT) {
                        this.container.classList.add('dplayer-loading');
                        const client = new win.WebTorrent(this.options.pluginOptions?.webtorrent ?? {});
                        this.plugins.webtorrent = client;
                        const torrentId = video.src;
                        video.src = '';
                        video.preload = 'metadata';
                        video.addEventListener('durationchange', () => this.container.classList.remove('dplayer-loading'), { once: true });
                        client.add(torrentId, (torrent) => {
                            const file = torrent.files.find((f) => f.name.endsWith('.mp4'));
                            file?.renderTo(this.video, {
                                autoplay: this.options.autoplay,
                                controls: false,
                            });
                        });
                        this.events.on('destroy', () => {
                            client.remove(torrentId);
                            client.destroy();
                            delete this.plugins.webtorrent;
                        });
                    } else {
                        this.notice('Error: Webtorrent is not supported.');
                    }
                } else {
                    this.notice("Error: Can't find Webtorrent.");
                }
                break;
        }
    }

    initVideo(video: HTMLVideoElement, type: string): void {
        this.initMSE(video, type);

        // Duration
        this.on('durationchange', () => {
            if (video.duration !== 1 && video.duration !== Infinity) {
                this.template.dtime.innerHTML = utils.secondToTime(video.duration);
            }
        });

        // Buffer progress
        this.on('progress', () => {
            const pct = video.buffered.length ? video.buffered.end(video.buffered.length - 1) / video.duration : 0;
            this.bar.set('loaded', pct, 'width');
        });

        // Error
        this.on('error', () => {
            if (!this.video.error) return;
            if (this.tran && this.type !== 'webtorrent') {
                this.notice(this.tran('video-failed'));
            }
        });

        // Ended
        this.on('ended', () => {
            this.bar.set('played', 1, 'width');
            if (!this.setting.loop) {
                this.pause();
            } else {
                this.seek(0);
                this.play();
            }
            if (this.danmaku) this.danmaku.danIndex = 0;
        });

        this.on('play', () => {
            if (this.paused) this.play(true);
        });

        this.on('pause', () => {
            if (!this.paused) this.pause(true);
        });

        // Preserve playback rate when browser resets it (e.g. 3-finger tap on macOS)
        this.on('ratechange', () => {
            if (this._savedPlaybackRate && this.video.playbackRate !== this._savedPlaybackRate) {
                const target = this._savedPlaybackRate;
                setTimeout(() => {
                    if (this._savedPlaybackRate === target && this.video.playbackRate !== target) {
                        this.video.playbackRate = target;
                    }
                }, 0);
            }
        });

        this.on('timeupdate', () => {
            if (!this.moveBar) {
                this.bar.set('played', this.video.currentTime / this.video.duration, 'width');
            }
            const currentTime = utils.secondToTime(this.video.currentTime);
            if (this.template.ptime.innerHTML !== currentTime) {
                this.template.ptime.innerHTML = currentTime;
            }
        });

        for (const eventName of this.events.videoEvents) {
            video.addEventListener(eventName, (e: Event) => {
                this.events.trigger(eventName, e);
            });
        }

        this.volume(this.user.get('volume'), true, true);

        if (this.options.subtitle) {
            this.subtitle = new Subtitle(this.template.subtitle, this.video, this.options.subtitle, this.events);
            if (Array.isArray(this.options.subtitle.url)) {
                this.subtitles = new Subtitles(this);
            }
            if (!this.user.get('subtitle')) {
                this.subtitle.hide();
            }
        }
    }

    switchQuality(index: number | string): void {
        const idx = typeof index === 'string' ? parseInt(index, 10) : index;
        if (this.qualityIndex === idx || this.switchingQuality) return;

        this.prevIndex = this.qualityIndex;
        this.qualityIndex = idx;
        this.switchingQuality = true;
        this.quality = this.options.video.quality![idx];
        this.template.qualityButton.innerHTML = this.quality.name;

        const paused = this.video.paused;
        this.video.pause();

        const videoHTML = tplVideo({
            current: false,
            pic: null,
            screenshot: this.options.screenshot,
            preload: 'auto',
            url: this.quality.url,
            subtitle: this.options.subtitle,
        });

        const videoEle = new DOMParser().parseFromString(videoHTML, 'text/html').body.firstChild as HTMLVideoElement;

        this.template.videoWrap.insertBefore(videoEle, this.template.videoWrap.getElementsByTagName('div')[0]);

        this.prevVideo = this.video;
        this.video = videoEle;
        this.initVideo(this.video, this.quality.type ?? this.options.video.type ?? 'auto');
        this.seek(this.prevVideo.currentTime);
        this.notice(`${this.tran('switching-quality').replace('%q', this.quality.name)}`, -1, undefined, 'switch-quality');
        this.events.trigger('quality_start', this.quality);

        this.on('canplay', () => {
            if (this.prevVideo) {
                if (this.video.currentTime !== this.prevVideo.currentTime) {
                    this.seek(this.prevVideo.currentTime);
                    return;
                }
                this.template.videoWrap.removeChild(this.prevVideo);
                this.video.classList.add('dplayer-video-current');
                if (!paused) this.video.play();
                this.prevVideo = null;
                this.notice(`${this.tran('switched-quality').replace('%q', this.quality!.name)}`, undefined, undefined, 'switch-quality');
                this.switchingQuality = false;
                this.events.trigger('quality_end');
            }
        });

        this.on('error', () => {
            if (!this.video.error || !this.prevVideo) return;
            this.template.videoWrap.removeChild(this.video);
            this.video = this.prevVideo;
            if (!paused) this.video.play();
            this.qualityIndex = this.prevIndex;
            this.quality = this.options.video.quality![this.qualityIndex];
            this.prevVideo = null;
            this.switchingQuality = false;
        });
    }

    notice(text: string, time = 2000, opacity = 0.8, id?: string): void {
        const noticeListEl = this.template.noticeList;
        if (noticeListEl) {
            // Clear all existing notices to prevent spam
            while (noticeListEl.firstChild) {
                noticeListEl.removeChild(noticeListEl.firstChild);
            }
            for (const key in this.noticeList) {
                if (this.noticeList[key] !== null) {
                    clearTimeout(this.noticeList[key]!);
                    this.noticeList[key] = null;
                }
            }
        }

        const notice = Template.NewNotice(text, opacity, id);
        this.template.noticeList.appendChild(notice);
        this.events.trigger('notice_show', notice);

        if (time > 0) {
            this.noticeList[id ?? ''] = setTimeout(
                ((el: HTMLElement, dp: DPlayer) => () => {
                    el.addEventListener('animationend', () => {
                        if (el.parentNode) dp.template.noticeList.removeChild(el);
                    });
                    el.classList.add('remove-notice');
                    dp.events.trigger('notice_hide');
                    dp.noticeList[id ?? ''] = null;
                })(notice, this),
                time
            );
        }
    }

    resize(): void {
        this.danmaku?.resize();
        if (this.controller.thumbnails) {
            this.controller.thumbnails.resize(160, (this.video.videoHeight / this.video.videoWidth) * 160, this.template.barWrap.offsetWidth);
        }
        this.events.trigger('resize');
    }

    speed(rate: number): void {
        this._savedPlaybackRate = rate;
        this.video.playbackRate = rate;
        if (this.template.speedIndicator) {
            this.template.speedIndicator.innerText = `${rate}x`;
        }
        this.setting?.updateSpeedPanelActive(rate);
        this.notice(`Speed: ${rate}x`);
    }

    destroy(): void {
        instances.splice(instances.indexOf(this), 1);
        this.pause();
        if (this.docClickFun) document.removeEventListener('click', this.docClickFun, true);
        if (this.containerClickFun) this.container.removeEventListener('click', this.containerClickFun, true);
        this.fullScreen.destroy();
        this.hotkey.destroy();
        this.contextmenu.destroy();
        this.controller.destroy();
        this.timer.destroy();
        this.video.src = '';
        this.container.innerHTML = '';
        this.events.trigger('destroy');
    }

    static get version(): string {
        return DPLAYER_VERSION;
    }
}

export default DPlayer;
