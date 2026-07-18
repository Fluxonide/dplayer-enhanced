/* global DPLAYER_VERSION */
import defaultApiBackend from './api';
import { DPlayerOptions } from './types';

export default function handleOption(options: Partial<DPlayerOptions> & { video: DPlayerOptions['video'] }): DPlayerOptions {
    const defaultOption: DPlayerOptions = {
        container: (options.element ?? document.getElementsByClassName('dplayer')[0]) as HTMLElement,
        live: false,
        autoplay: false,
        theme: '#b7daff',
        loop: false,
        lang: (navigator.language || ((navigator as Navigator & { browserLanguage?: string }).browserLanguage ?? 'en')).toLowerCase(),
        screenshot: false,
        airplay: true,
        chromecast: false,
        hotkey: true,
        globalHotkey: true,
        preload: 'metadata',
        volume: 0.7,
        playbackSpeed: [0.5, 0.75, 1, 1.25, 1.5, 2],
        apiBackend: defaultApiBackend,
        video: {} as DPlayerOptions['video'],
        contextmenu: [],
        mutex: true,
        pluginOptions: { hls: {}, flv: {}, dash: {}, webtorrent: {} },
        preventClickToggle: false,
    };

    // Merge defaults into options (only for keys not already set)
    (Object.keys(defaultOption) as (keyof DPlayerOptions)[]).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(options, key)) {
            (options as Record<string, unknown>)[key] = defaultOption[key];
        }
    });

    const merged = options as DPlayerOptions;

    // Video defaults
    if (merged.video) {
        if (!merged.video.type) merged.video.type = 'auto';
    }

    // Danmaku defaults
    if (merged.danmaku && typeof merged.danmaku === 'object') {
        if (!merged.danmaku.user) merged.danmaku.user = 'Fluxonide';
    }

    // Subtitle defaults
    if (merged.subtitle) {
        if (!merged.subtitle.type) merged.subtitle.type = 'webvtt';
        if (!merged.subtitle.fontSize) merged.subtitle.fontSize = '20px';
        if (!merged.subtitle.bottom) merged.subtitle.bottom = '40px';
        if (!merged.subtitle.color) merged.subtitle.color = '#fff';
    }

    // Quality: set default URL
    if (merged.video.quality && merged.video.defaultQuality !== undefined) {
        merged.video.url = merged.video.quality[merged.video.defaultQuality].url;
    }

    // Lang to lowercase
    if (merged.lang) {
        merged.lang = merged.lang.toLowerCase();
    }

    // Append built-in context menu items
    merged.contextmenu = (merged.contextmenu ?? []).concat([
        {
            key: 'video-info',
            click: (player) => {
                player.infoPanel.triggle();
            },
        },
        {
            key: 'about-author',
            link: 'https://github.com/Fluxonide',
        },
        {
            text: `dplayer-enhanced v${DPLAYER_VERSION}`,
            link: 'https://github.com/Fluxonide/dplayer-enhanced',
        },
    ]);

    return merged;
}
