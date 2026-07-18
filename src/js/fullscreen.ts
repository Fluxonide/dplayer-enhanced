import utils from './utils';
import { DPlayerInstance, FullScreenType, ScrollPosition } from './types';

// Vendor-prefixed fullscreen API augmentations
interface VendorDocument extends Document {
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
    mozCancelFullScreen?: () => Promise<void>;
    webkitCancelFullScreen?: () => void;
    webkitCancelFullscreen?: () => void;
    msCancelFullScreen?: () => void;
    msExitFullscreen?: () => Promise<void>;
}

interface VendorHTMLElement extends HTMLElement {
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
    webkitEnterFullscreen?: () => void;
    webkitEnterFullScreen?: () => void;
}

interface VendorHTMLVideoElement extends HTMLVideoElement {
    webkitEnterFullscreen?: () => void;
    webkitEnterFullScreen?: () => void;
}

class FullScreen {
    private player: DPlayerInstance;
    private lastScrollPosition: ScrollPosition;
    private fullscreenchange: () => void;
    private docfullscreenchange: () => void;

    constructor(player: DPlayerInstance) {
        this.player = player;
        this.lastScrollPosition = { left: 0, top: 0 };

        this.player.events.on('webfullscreen', () => {
            this.player.resize();
        });

        this.player.events.on('webfullscreen_cancel', () => {
            this.player.resize();
            utils.setScrollPosition(this.lastScrollPosition);
        });

        this.fullscreenchange = () => {
            this.player.resize();
            if (this.isFullScreen('browser')) {
                this.player.events.trigger('fullscreen');
            } else {
                utils.setScrollPosition(this.lastScrollPosition);
                this.player.events.trigger('fullscreen_cancel');
            }
        };

        this.docfullscreenchange = () => {
            const doc = document as VendorDocument;
            const fullEle = doc.fullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

            if (fullEle && fullEle !== this.player.container) return;

            this.player.resize();
            if (fullEle) {
                this.player.events.trigger('fullscreen');
            } else {
                utils.setScrollPosition(this.lastScrollPosition);
                this.player.events.trigger('fullscreen_cancel');
            }
        };

        if (/Firefox/.test(navigator.userAgent)) {
            document.addEventListener('mozfullscreenchange', this.docfullscreenchange);
            document.addEventListener('fullscreenchange', this.docfullscreenchange);
        } else {
            this.player.container.addEventListener('fullscreenchange', this.fullscreenchange);
            this.player.container.addEventListener('webkitfullscreenchange', this.fullscreenchange);
            document.addEventListener('msfullscreenchange', this.docfullscreenchange);
            document.addEventListener('MSFullscreenChange', this.docfullscreenchange);
        }
    }

    isFullScreen(type: FullScreenType = 'browser'): boolean | Element | null {
        const doc = document as VendorDocument;
        switch (type) {
            case 'browser':
                return doc.fullscreenElement || doc.mozFullScreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement || doc.msFullscreenElement || null;
            case 'web':
                return this.player.container.classList.contains('dplayer-fulled');
        }
    }

    request(type: FullScreenType = 'browser'): void {
        const anotherType: FullScreenType = type === 'browser' ? 'web' : 'browser';
        if (!this.isFullScreen(anotherType)) {
            this.lastScrollPosition = utils.getScrollPosition();
        }

        const el = this.player.container as VendorHTMLElement;
        const video = this.player.video as VendorHTMLVideoElement;

        switch (type) {
            case 'browser':
                if (el.requestFullscreen) {
                    el.requestFullscreen();
                } else if (el.mozRequestFullScreen) {
                    el.mozRequestFullScreen();
                } else if (el.webkitRequestFullscreen) {
                    el.webkitRequestFullscreen();
                } else if (video.webkitEnterFullscreen) {
                    video.webkitEnterFullscreen();
                } else if (video.webkitEnterFullScreen) {
                    video.webkitEnterFullScreen();
                } else if (el.msRequestFullscreen) {
                    el.msRequestFullscreen();
                }
                break;
            case 'web':
                this.player.container.classList.add('dplayer-fulled');
                document.body.classList.add('dplayer-web-fullscreen-fix');
                this.player.events.trigger('webfullscreen');
                break;
        }

        if (this.isFullScreen(anotherType)) {
            this.cancel(anotherType);
        }
    }

    cancel(type: FullScreenType = 'browser'): void {
        const doc = document as VendorDocument;

        switch (type) {
            case 'browser':
                if (doc.mozCancelFullScreen) {
                    void doc.mozCancelFullScreen();
                } else if (doc.webkitCancelFullScreen) {
                    doc.webkitCancelFullScreen();
                } else if (doc.webkitCancelFullscreen) {
                    doc.webkitCancelFullscreen();
                } else if (doc.msCancelFullScreen) {
                    doc.msCancelFullScreen();
                } else if (doc.msExitFullscreen) {
                    void doc.msExitFullscreen();
                } else if (doc.exitFullscreen) {
                    void doc.exitFullscreen();
                }
                break;
            case 'web':
                this.player.container.classList.remove('dplayer-fulled');
                document.body.classList.remove('dplayer-web-fullscreen-fix');
                this.player.events.trigger('webfullscreen_cancel');
                break;
        }
    }

    toggle(type: FullScreenType = 'browser'): void {
        if (this.isFullScreen(type)) {
            this.cancel(type);
        } else {
            this.request(type);
        }
    }

    destroy(): void {
        if (/Firefox/.test(navigator.userAgent)) {
            document.removeEventListener('mozfullscreenchange', this.docfullscreenchange);
            document.removeEventListener('fullscreenchange', this.docfullscreenchange);
        } else {
            this.player.container.removeEventListener('fullscreenchange', this.fullscreenchange);
            this.player.container.removeEventListener('webkitfullscreenchange', this.fullscreenchange);
            document.removeEventListener('msfullscreenchange', this.docfullscreenchange);
            document.removeEventListener('MSFullscreenChange', this.docfullscreenchange);
        }
    }
}

export default FullScreen;
