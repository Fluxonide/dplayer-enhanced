import { DPlayerOptions, SubtitleOptions } from './types';

export interface VideoTplData {
    current: boolean;
    pic?: string | null;
    screenshot?: boolean;
    airplay?: boolean;
    chromecast?: boolean;
    preload?: string;
    url?: string;
    subtitle?: SubtitleOptions;
}

/** Escape HTML attribute values to prevent XSS */
function esc(s: unknown): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function tplVideo(data: VideoTplData): string {
    const { current, pic, screenshot, airplay, preload, url, subtitle } = data;
    const enableSubtitle = subtitle && subtitle.type === 'webvtt';

    const subtitleUrl = enableSubtitle
        ? typeof subtitle!.url === 'string'
            ? subtitle!.url
            : ((subtitle!.url as Array<{ url?: string; subtitle?: string }>)[subtitle!.index ?? 0]?.url ?? (subtitle!.url as Array<{ url?: string; subtitle?: string }>)[subtitle!.index ?? 0]?.subtitle ?? '')
        : '';

    return `<video
    class="dplayer-video${current ? ' dplayer-video-current' : ''}"
    webkit-playsinline
    ${airplay ? 'x-webkit-airplay="allow"' : ''}
    playsinline
    ${pic ? `poster="${esc(pic)}"` : ''}
    ${screenshot || enableSubtitle ? 'crossorigin="anonymous"' : ''}
    ${preload ? `preload="${esc(preload)}"` : ''}
    ${airplay ? 'nosrc' : url ? `src="${esc(url)}"` : ''}
>
    ${airplay && url ? `<source src="${esc(url)}">` : ''}
    ${enableSubtitle ? `<track class="dplayer-subtrack" kind="metadata" default src="${esc(subtitleUrl)}"></track>` : ''}
</video>`;
}
