import utils from './utils';
import Thumbnails from './thumbnails';
import Icons from './icons';
import { DPlayerInstance } from './types';

// Module-level Chromecast state
let cast: chrome.cast.Cast | undefined;
let chromecastInitialized = false;
let isCasting = false;

// Extend HTMLElement with webkitplaybacktargetavailabilitychanged for Safari AirPlay
interface AirPlayAvailabilityEvent extends Event {
    availability: 'available' | 'not-available';
}

class Controller {
    private player: DPlayerInstance;
    private autoHideTimer = 0;
    private setAutoHideHandler?: () => void;
    thumbnails?: Thumbnails;
    disableAutoHide = false;

    // Chromecast session
    private session?: chrome.cast.Session;
    private currentMedia?: chrome.cast.media.Media;

    constructor(player: DPlayerInstance) {
        this.player = player;

        if (!utils.isMobile) {
            this.setAutoHideHandler = this.setAutoHide.bind(this);
            this.player.container.addEventListener('mousemove', this.setAutoHideHandler);
            this.player.container.addEventListener('click', this.setAutoHideHandler);
            this.player.on('play', this.setAutoHideHandler);
            this.player.on('pause', this.setAutoHideHandler);
        }

        this.initPlayButton();
        this.initThumbnails();
        this.initPlayedBar();
        this.initFullButton();
        this.initQualityButton();
        this.initScreenshotButton();

        // Only init single subtitle button when URL is a string (not array)
        if (this.player.options.subtitle) {
            if (typeof this.player.options.subtitle.url === 'string') {
                this.initSubtitleButton();
            }
        }

        this.initHighlights();
        this.initAirplayButton();
        this.initChromecastButton();

        if (!utils.isMobile) {
            this.initVolumeButton();
        }
    }

    initPlayButton(): void {
        this.player.template.playButton.addEventListener('click', () => {
            this.player.toggle();
        });

        this.player.template.mobilePlayButton.addEventListener('click', () => {
            this.player.toggle();
        });

        if (!utils.isMobile) {
            if (!this.player.options.preventClickToggle) {
                this.player.template.videoWrap.addEventListener('click', () => {
                    this.player.toggle();
                });
                this.player.template.controllerMask.addEventListener('click', () => {
                    this.player.toggle();
                });
            }
        } else {
            this.player.template.videoWrap.addEventListener('click', () => {
                this.toggle();
            });
            this.player.template.controllerMask.addEventListener('click', () => {
                this.toggle();
            });
        }
    }

    initHighlights(): void {
        this.player.on('durationchange', () => {
            if (this.player.video.duration !== 1 && this.player.video.duration !== Infinity) {
                if (this.player.options.highlight) {
                    const highlights = this.player.template.playedBarWrap.querySelectorAll<HTMLElement>('.dplayer-highlight');
                    highlights.forEach((item) => {
                        this.player.template.playedBarWrap.removeChild(item);
                    });
                    for (const hl of this.player.options.highlight) {
                        if (!hl.text || !hl.time) continue;
                        const p = document.createElement('div');
                        p.classList.add('dplayer-highlight');
                        p.style.left = `${(hl.time / this.player.video.duration) * 100}%`;
                        p.innerHTML = `<span class="dplayer-highlight-text">${hl.text}</span>`;
                        this.player.template.playedBarWrap.insertBefore(p, this.player.template.playedBarTime);
                    }
                }
            }
        });
    }

    initThumbnails(): void {
        if (this.player.options.video.thumbnails) {
            this.thumbnails = new Thumbnails({
                container: this.player.template.barPreview,
                barWidth: this.player.template.barWrap.offsetWidth,
                url: this.player.options.video.thumbnails,
                events: this.player.events,
            });

            this.player.on('loadedmetadata', () => {
                this.thumbnails!.resize(160, (this.player.video.videoHeight / this.player.video.videoWidth) * 160, this.player.template.barWrap.offsetWidth);
            });
        }
    }

    initPlayedBar(): void {
        const getClientX = (e: Event): number => {
            const me = e as MouseEvent & { changedTouches?: TouchList };
            return me.clientX ?? me.changedTouches?.[0]?.clientX ?? 0;
        };

        const thumbMove = (e: Event): void => {
            let percentage = (getClientX(e) - utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(0, Math.min(1, percentage));
            this.player.bar.set('played', percentage, 'width');
            this.player.template.ptime.innerHTML = utils.secondToTime(percentage * this.player.video.duration);
        };

        const thumbUp = (e: Event): void => {
            document.removeEventListener(utils.nameMap.dragEnd, thumbUp);
            document.removeEventListener(utils.nameMap.dragMove, thumbMove);
            let percentage = (getClientX(e) - utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(0, Math.min(1, percentage));
            this.player.bar.set('played', percentage, 'width');
            this.player.seek(this.player.bar.get('played') * this.player.video.duration);
            this.player.moveBar = false;
        };

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragStart, () => {
            this.player.moveBar = true;
            document.addEventListener(utils.nameMap.dragMove, thumbMove);
            document.addEventListener(utils.nameMap.dragEnd, thumbUp);
        });

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragMove, (e: Event) => {
            if (!this.player.video.duration) return;
            const px = this.player.template.playedBarWrap.getBoundingClientRect().left;
            const tx = getClientX(e) - px;
            if (tx < 0 || tx > this.player.template.playedBarWrap.offsetWidth) return;

            const time = this.player.video.duration * (tx / this.player.template.playedBarWrap.offsetWidth);
            if (utils.isMobile) this.thumbnails?.show();
            this.thumbnails?.move(tx);
            this.player.template.playedBarTime.style.left = `${tx - (time >= 3600 ? 25 : 20)}px`;
            this.player.template.playedBarTime.innerText = utils.secondToTime(time);
            this.player.template.playedBarTime.classList.remove('hidden');
        });

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragEnd, () => {
            if (utils.isMobile) this.thumbnails?.hide();
        });

        if (!utils.isMobile) {
            this.player.template.playedBarWrap.addEventListener('mouseenter', () => {
                if (this.player.video.duration) {
                    this.thumbnails?.show();
                    this.player.template.playedBarTime.classList.remove('hidden');
                }
            });

            this.player.template.playedBarWrap.addEventListener('mouseleave', () => {
                if (this.player.video.duration) {
                    this.thumbnails?.hide();
                    this.player.template.playedBarTime.classList.add('hidden');
                }
            });
        }
    }

    initFullButton(): void {
        this.player.template.browserFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('browser');
        });
        this.player.template.webFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('web');
        });
    }

    initVolumeButton(): void {
        const vWidth = 35;

        const getClientX = (e: Event): number => {
            const me = e as MouseEvent & { changedTouches?: TouchList };
            return me.clientX ?? me.changedTouches?.[0]?.clientX ?? 0;
        };

        const volumeMove = (e: Event): void => {
            const percentage = (getClientX(e) - utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        };

        const volumeUp = (): void => {
            document.removeEventListener(utils.nameMap.dragEnd, volumeUp);
            document.removeEventListener(utils.nameMap.dragMove, volumeMove);
            this.player.template.volumeButton.classList.remove('dplayer-volume-active');
        };

        this.player.template.volumeBarWrapWrap.addEventListener('click', (e: Event) => {
            const percentage = (getClientX(e) - utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        });

        this.player.template.volumeBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
            document.addEventListener(utils.nameMap.dragMove, volumeMove);
            document.addEventListener(utils.nameMap.dragEnd, volumeUp);
            this.player.template.volumeButton.classList.add('dplayer-volume-active');
        });

        this.player.template.volumeButtonIcon.addEventListener('click', () => {
            if (this.player.video.muted) {
                this.player.video.muted = false;
                this.player.switchVolumeIcon();
                this.player.bar.set('volume', this.player.volume(), 'width');
            } else {
                this.player.video.muted = true;
                this.player.template.volumeIcon.innerHTML = Icons.volumeOff;
                this.player.bar.set('volume', 0, 'width');
            }
        });
    }

    initQualityButton(): void {
        if (this.player.options.video.quality) {
            this.player.template.qualityList.addEventListener('click', (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('dplayer-quality-item')) {
                    this.player.switchQuality((target as HTMLElement & { dataset: DOMStringMap }).dataset.index ?? '0');
                }
            });
        }
    }

    initScreenshotButton(): void {
        if (this.player.options.screenshot) {
            this.player.template.camareButton.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.player.video.videoWidth;
                canvas.height = this.player.video.videoHeight;
                canvas.getContext('2d')!.drawImage(this.player.video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) return;
                    const dataURL = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = 'DPlayer.png';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(dataURL);
                    this.player.events.trigger('screenshot', dataURL);
                });
            });
        }
    }

    initAirplayButton(): void {
        if (this.player.options.airplay) {
            if ((window as typeof window & { WebKitPlaybackTargetAvailabilityEvent?: unknown }).WebKitPlaybackTargetAvailabilityEvent) {
                this.player.video.addEventListener(
                    'webkitplaybacktargetavailabilitychanged',
                    function (this: DPlayerInstance, event: Event) {
                        const e = event as AirPlayAvailabilityEvent;
                        const btn = (this as DPlayerInstance).template.airplayButton as HTMLButtonElement;
                        btn.disabled = e.availability !== 'available';

                        btn.addEventListener(
                            'click',
                            function (this: DPlayerInstance) {
                                (this.video as HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void }).webkitShowPlaybackTargetPicker?.();
                            }.bind(this as unknown as DPlayerInstance)
                        );
                    }.bind(this.player)
                );
            } else {
                this.player.template.airplayButton.style.display = 'none';
            }
        }
    }

    private initChromecast(): void {
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1');
        document.body.appendChild(script);

        (window as typeof window & { __onGCastApiAvailable?: (isAvailable: boolean) => void }).__onGCastApiAvailable = (isAvailable: boolean) => {
            if (isAvailable) {
                cast = (window as typeof window & { chrome?: { cast: chrome.cast.Cast } }).chrome?.cast;
                if (!cast) return;
                const sessionRequest = new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
                const apiConfig = new cast.ApiConfig(
                    sessionRequest,
                    () => {},
                    (status: string) => {
                        if (status === cast!.ReceiverAvailability.AVAILABLE) {
                            console.log('chromecast:', status);
                        }
                    }
                );
                cast.initialize(apiConfig, () => {});
            }
        };
    }

    initChromecastButton(): void {
        if (!this.player.options.chromecast) return;

        if (!chromecastInitialized) {
            chromecastInitialized = true;
            this.initChromecast();
        }

        const launchMedia = (media: string): boolean => {
            if (!cast || !this.session) {
                window.open(media);
                return false;
            }
            const mediaInfo = new cast.media.MediaInfo(media, 'video/mp4');
            const request = new cast.media.LoadRequest(mediaInfo);
            this.session.loadMedia(
                request,
                (m: chrome.cast.media.Media) => {
                    this.currentMedia = m;
                },
                (err: chrome.cast.Error) => {
                    console.error('Error launching media', err);
                }
            );
            return true;
        };

        const discoverDevices = (): void => {
            if (!cast) return;
            cast.requestSession(
                (s: chrome.cast.Session) => {
                    this.session = s;
                    launchMedia(this.player.options.video.url);
                },
                (err: chrome.cast.Error) => {
                    if ((err as unknown as { code: string }).code === 'cancel') {
                        this.session = undefined;
                    } else {
                        console.error('Error selecting a cast device', err);
                    }
                }
            );
        };

        this.player.template.chromecastButton.addEventListener('click', () => {
            if (isCasting) {
                isCasting = false;
                this.currentMedia?.stop(
                    () => {},
                    () => {}
                );
                this.session?.stop(
                    () => {},
                    () => {}
                );
                this.initChromecast();
            } else {
                isCasting = true;
                discoverDevices();
            }
        });
    }

    initSubtitleButton(): void {
        this.player.events.on('subtitle_show', () => {
            this.player.template.subtitleButton.dataset['balloon'] = this.player.tran('hide-subs');
            this.player.template.subtitleButtonInner.style.opacity = '';
            this.player.user.set('subtitle', 1);
        });

        this.player.events.on('subtitle_hide', () => {
            this.player.template.subtitleButton.dataset['balloon'] = this.player.tran('show-subs');
            this.player.template.subtitleButtonInner.style.opacity = '0.4';
            this.player.user.set('subtitle', 0);
        });

        this.player.template.subtitleButton.addEventListener('click', () => {
            this.player.subtitle?.toggle();
        });
    }

    setAutoHide(): void {
        this.show();
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = window.setTimeout(() => {
            if (!this.player.paused && !this.disableAutoHide) {
                this.hide();
            }
        }, 3000);
    }

    show(): void {
        this.player.container.classList.remove('dplayer-hide-controller');
    }

    hide(): void {
        this.player.container.classList.add('dplayer-hide-controller');
        this.player.setting.hide();
        this.player.setting.hideSpeedPanel();
        this.player.comment?.hide();
    }

    isShow(): boolean {
        return !this.player.container.classList.contains('dplayer-hide-controller');
    }

    toggle(): void {
        if (this.isShow()) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy(): void {
        if (!utils.isMobile && this.setAutoHideHandler) {
            this.player.container.removeEventListener('mousemove', this.setAutoHideHandler);
            this.player.container.removeEventListener('click', this.setAutoHideHandler);
        }
        clearTimeout(this.autoHideTimer);
    }
}

export default Controller;
