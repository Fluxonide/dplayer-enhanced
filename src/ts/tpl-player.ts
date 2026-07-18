import { DPlayerOptions, SubtitleUrlItem } from './types';
import { IconsMap } from './icons';
import { tplVideo } from './tpl-video';

export interface PlayerTplData {
    options: DPlayerOptions;
    index: number;
    tran: (key: string) => string;
    icons: IconsMap;
    mobile: boolean;
    video: Parameters<typeof tplVideo>[0];
}

function escText(s: unknown): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escAttr(s: unknown): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function tplPlayer(data: PlayerTplData): string {
    const { options, index, tran, icons } = data;
    const theme = escAttr(options.theme ?? '#b7daff');
    const speeds = options.playbackSpeed ?? [0.5, 0.75, 1, 1.25, 1.5, 2];

    const speedTicks = speeds.map((v) => `<div class="dplayer-speed-slider-tick${v === 1 ? ' dplayer-speed-slider-tick-active' : ''}" data-speed="${v}"></div>`).join('');

    const speedLabels = speeds.map((v) => `<span class="dplayer-speed-slider-label${v === 1 ? ' dplayer-speed-slider-label-active' : ''}" data-speed="${v}">${v}x</span>`).join('');

    const speedMenuItems = speeds.map((v) => `<div class="dplayer-setting-speed-item" data-speed="${v}"><span class="dplayer-label">${v === 1 ? escText(tran('normal')) : v}</span></div>`).join('');

    const qualityHtml = options.video.quality
        ? `
        <div class="dplayer-quality">
            <button class="dplayer-icon dplayer-quality-icon">${escText(options.video.quality[options.video.defaultQuality ?? 0].name)}</button>
            <div class="dplayer-quality-mask">
                <div class="dplayer-quality-list">
                    ${options.video.quality.map((q, i) => `<div class="dplayer-quality-item" data-index="${i}">${escText(q.name)}</div>`).join('')}
                </div>
            </div>
        </div>`
        : '';

    const screenshotHtml = options.screenshot
        ? `
        <div class="dplayer-icon dplayer-camera-icon" data-balloon="${escAttr(tran('screenshot'))}" data-balloon-pos="up">
            <span class="dplayer-icon-content">${icons.camera}</span>
        </div>`
        : '';

    const airplayHtml = options.airplay
        ? `
        <div class="dplayer-icon dplayer-airplay-icon" data-balloon="${escAttr(tran('airplay'))}" data-balloon-pos="up">
            <span class="dplayer-icon-content">${icons.airplay}</span>
        </div>`
        : '';

    const chromecastHtml = options.chromecast
        ? `
        <div class="dplayer-icon dplayer-chromecast-icon" data-balloon="${escAttr(tran('chromecast'))}" data-balloon-pos="up">
            <span class="dplayer-icon-content">${icons.chromecast}</span>
        </div>`
        : '';

    let subtitleHtml = '';
    if (options.subtitle) {
        if (typeof options.subtitle.url === 'string') {
            subtitleHtml = `
            <div class="dplayer-subtitle-btn">
                <button class="dplayer-icon dplayer-subtitle-icon" data-balloon="${escAttr(tran('hide-subs'))}" data-balloon-pos="up">
                    <span class="dplayer-icon-content">${icons.subtitle}</span>
                </button>
            </div>`;
        } else {
            const items = (options.subtitle.url as SubtitleUrlItem[])
                .map((sub) => {
                    const label = sub.lang ? (sub.name ? `${escText(sub.name)} (${escText(tran(sub.lang))})` : escText(tran(sub.lang))) : escText(sub.name ?? '');
                    return `<div class="dplayer-subtitles-item" data-subtitle="${escAttr(sub.subtitle ?? '')}"><span class="dplayer-label">${label}</span></div>`;
                })
                .join('');
            subtitleHtml = `
            <div class="dplayer-subtitles">
                <button class="dplayer-icon dplayer-subtitles-icon" data-balloon="${escAttr(tran('subtitle'))}" data-balloon-pos="up">
                    <span class="dplayer-icon-content">${icons.subtitle}</span>
                </button>
                <div class="dplayer-subtitles-box">
                    <div class="dplayer-subtitles-panel">${items}</div>
                </div>
            </div>`;
        }
    }

    const logoHtml = (options as DPlayerOptions & { logo?: string }).logo ? `<div class="dplayer-logo"><img src="${escAttr((options as DPlayerOptions & { logo?: string }).logo)}"></div>` : '';

    const commentBoxHtml = options.danmaku
        ? `
    <div class="dplayer-icons dplayer-comment-box">
        <button class="dplayer-icon dplayer-comment-setting-icon" data-balloon="${escAttr(tran('setting'))}" data-balloon-pos="up">
            <span class="dplayer-icon-content">${icons.pallette}</span>
        </button>
        <div class="dplayer-comment-setting-box">
            <div class="dplayer-comment-setting-color">
                <div class="dplayer-comment-setting-title">${escText(tran('set-danmaku-color'))}</div>
                <label><input type="radio" name="dplayer-danmaku-color-${index}" value="#fff" checked><span style="background:#fff"></span></label>
                <label><input type="radio" name="dplayer-danmaku-color-${index}" value="#e54256"><span style="background:#e54256"></span></label>
                <label><input type="radio" name="dplayer-danmaku-color-${index}" value="#ffe133"><span style="background:#ffe133"></span></label>
                <label><input type="radio" name="dplayer-danmaku-color-${index}" value="#64DD17"><span style="background:#64DD17"></span></label>
                <label><input type="radio" name="dplayer-danmaku-color-${index}" value="#39ccff"><span style="background:#39ccff"></span></label>
                <label><input type="radio" name="dplayer-danmaku-color-${index}" value="#D500F9"><span style="background:#D500F9"></span></label>
            </div>
            <div class="dplayer-comment-setting-type">
                <div class="dplayer-comment-setting-title">${escText(tran('set-danmaku-type'))}</div>
                <label><input type="radio" name="dplayer-danmaku-type-${index}" value="1"><span>${escText(tran('top'))}</span></label>
                <label><input type="radio" name="dplayer-danmaku-type-${index}" value="0" checked><span>${escText(tran('rolling'))}</span></label>
                <label><input type="radio" name="dplayer-danmaku-type-${index}" value="2"><span>${escText(tran('bottom'))}</span></label>
            </div>
        </div>
        <input class="dplayer-comment-input" type="text" placeholder="${escAttr(tran('input-danmaku-enter'))}" maxlength="30">
        <button class="dplayer-icon dplayer-send-icon" data-balloon="${escAttr(tran('send'))}" data-balloon-pos="up">
            <span class="dplayer-icon-content">${icons.send}</span>
        </button>
    </div>`
        : '';

    const danmakuSettingsHtml = options.danmaku
        ? `
                    <div class="dplayer-setting-item dplayer-setting-showdan">
                        <span class="dplayer-label">${escText(tran('show-danmaku'))}</span>
                        <div class="dplayer-toggle">
                            <input class="dplayer-showdan-setting-input" type="checkbox" name="dplayer-toggle-dan">
                            <label for="dplayer-toggle-dan"></label>
                        </div>
                    </div>
                    <div class="dplayer-setting-item dplayer-setting-danunlimit">
                        <span class="dplayer-label">${escText(tran('unlimited-danmaku'))}</span>
                        <div class="dplayer-toggle">
                            <input class="dplayer-danunlimit-setting-input" type="checkbox" name="dplayer-toggle-danunlimit">
                            <label for="dplayer-toggle-danunlimit"></label>
                        </div>
                    </div>
                    <div class="dplayer-setting-item dplayer-setting-danmaku">
                        <span class="dplayer-label">${escText(tran('opacity-danmaku'))}</span>
                        <div class="dplayer-danmaku-bar-wrap">
                            <div class="dplayer-danmaku-bar">
                                <div class="dplayer-danmaku-bar-inner">
                                    <span class="dplayer-thumb"></span>
                                </div>
                            </div>
                        </div>
                    </div>`
        : '';

    const infoDanmakuHtml = options.danmaku
        ? `
    <div class="dplayer-info-panel-item dplayer-info-panel-item-danmaku-id">
        <span class="dplayer-info-panel-item-title">Danmaku id</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-danmaku-api">
        <span class="dplayer-info-panel-item-title">Danmaku api</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-danmaku-amount">
        <span class="dplayer-info-panel-item-title">Danmaku amount</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>`
        : '';

    const menuHtml = (options.contextmenu ?? [])
        .map((item) => {
            const href = item.link ? escAttr(item.link) : 'javascript:void(0);';
            const target = item.link ? ' target="_blank"' : '';
            const label = item.key ? escText(tran(item.key)) : escText(item.text ?? '');
            return `<div class="dplayer-menu-item"><a${target} href="${href}">${label}</a></div>`;
        })
        .join('');

    const liveBadge = options.live ? `<span class="dplayer-live-badge"><span class="dplayer-live-dot" style="background:${theme};"></span>${escText(tran('live'))}</span>` : '';

    return `<div class="dplayer-mask"></div>
<div class="dplayer-video-wrap">
    ${tplVideo(data.video)}
    ${logoHtml}
    <div class="dplayer-danmaku"${options.danmaku?.bottom ? ` style="margin-bottom:${escAttr(options.danmaku.bottom)}"` : ''}>
        <div class="dplayer-danmaku-item dplayer-danmaku-item--demo"></div>
    </div>
    <div class="dplayer-subtitle"></div>
    <div class="dplayer-bezel">
        <span class="dplayer-bezel-icon"></span>
        ${options.danmaku ? `<span class="dplayer-danloading">${escText(tran('danmaku-loading'))}</span>` : ''}
        <span class="diplayer-loading-icon">${icons.loading}</span>
    </div>
</div>
<div class="dplayer-controller-mask"></div>
<div class="dplayer-controller">
    ${commentBoxHtml}
    <div class="dplayer-icons dplayer-icons-left">
        <button class="dplayer-icon dplayer-play-icon">
            <span class="dplayer-icon-content">${icons.play}</span>
        </button>
        <div class="dplayer-volume">
            <button class="dplayer-icon dplayer-volume-icon">
                <span class="dplayer-icon-content">${icons.volumeDown}</span>
            </button>
            <div class="dplayer-volume-bar-wrap" data-balloon-pos="up">
                <div class="dplayer-volume-bar">
                    <div class="dplayer-volume-bar-inner" style="background:${theme};">
                        <span class="dplayer-thumb" style="background:${theme}"></span>
                    </div>
                </div>
            </div>
        </div>
        <span class="dplayer-time">
            <span class="dplayer-ptime">0:00</span> /
            <span class="dplayer-dtime">0:00</span>
        </span>
        <div class="dplayer-speed-wrap">
            <span class="dplayer-speed-indicator" data-balloon="${escAttr(tran('speed'))}" data-balloon-pos="up">1x</span>
            <div class="dplayer-speed-panel">
                <div class="dplayer-speed-panel-title">${escText(tran('speed'))}</div>
                <div class="dplayer-speed-slider-wrap">
                    <button class="dplayer-speed-slider-btn dplayer-speed-slider-btn-minus">−</button>
                    <div class="dplayer-speed-slider-inner">
                        <div class="dplayer-speed-slider-track">
                            <div class="dplayer-speed-slider-filled"></div>
                            <div class="dplayer-speed-slider-thumb"></div>
                            ${speedTicks}
                        </div>
                        <div class="dplayer-speed-slider-labels">${speedLabels}</div>
                    </div>
                    <button class="dplayer-speed-slider-btn dplayer-speed-slider-btn-plus">+</button>
                </div>
            </div>
        </div>
        ${liveBadge}
    </div>
    <div class="dplayer-icons dplayer-icons-right">
        ${qualityHtml}
        ${screenshotHtml}
        ${airplayHtml}
        ${chromecastHtml}
        <div class="dplayer-comment">
            <button class="dplayer-icon dplayer-comment-icon" data-balloon="${escAttr(tran('send-danmaku'))}" data-balloon-pos="up">
                <span class="dplayer-icon-content">${icons.comment}</span>
            </button>
        </div>
        ${subtitleHtml}
        <div class="dplayer-setting">
            <button class="dplayer-icon dplayer-setting-icon" data-balloon="${escAttr(tran('setting'))}" data-balloon-pos="up">
                <span class="dplayer-icon-content">${icons.setting}</span>
            </button>
            <div class="dplayer-setting-box">
                <div class="dplayer-setting-origin-panel">
                    <div class="dplayer-setting-item dplayer-setting-speed">
                        <span class="dplayer-label">${escText(tran('speed'))}</span>
                        <div class="dplayer-toggle">${icons.right}</div>
                    </div>
                    <div class="dplayer-setting-item dplayer-setting-loop">
                        <span class="dplayer-label">${escText(tran('loop'))}</span>
                        <div class="dplayer-toggle">
                            <input class="dplayer-toggle-setting-input" type="checkbox" name="dplayer-toggle">
                            <label for="dplayer-toggle"></label>
                        </div>
                    </div>
                    ${danmakuSettingsHtml}
                </div>
                <div class="dplayer-setting-speed-panel">${speedMenuItems}</div>
            </div>
        </div>
        <div class="dplayer-full">
            <button class="dplayer-icon dplayer-full-in-icon" data-balloon="${escAttr(tran('web-fullscreen'))}" data-balloon-pos="up">
                <span class="dplayer-icon-content">${icons.fullWeb}</span>
            </button>
            <button class="dplayer-icon dplayer-full-icon" data-balloon="${escAttr(tran('fullscreen'))}" data-balloon-pos="up">
                <span class="dplayer-icon-content">${icons.full}</span>
            </button>
        </div>
    </div>
    <div class="dplayer-bar-wrap">
        <div class="dplayer-bar-time hidden">00:00</div>
        <div class="dplayer-bar-preview"></div>
        <div class="dplayer-bar">
            <div class="dplayer-loaded" style="width:0;"></div>
            <div class="dplayer-played" style="width:0;background:${theme}">
                <span class="dplayer-thumb" style="background:${theme}"></span>
            </div>
        </div>
    </div>
</div>
<div class="dplayer-info-panel dplayer-info-panel-hide">
    <div class="dplayer-info-panel-close">[x]</div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-version">
        <span class="dplayer-info-panel-item-title">Player version</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-fps">
        <span class="dplayer-info-panel-item-title">Player FPS</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-type">
        <span class="dplayer-info-panel-item-title">Video type</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-url">
        <span class="dplayer-info-panel-item-title">Video url</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-resolution">
        <span class="dplayer-info-panel-item-title">Video resolution</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    <div class="dplayer-info-panel-item dplayer-info-panel-item-duration">
        <span class="dplayer-info-panel-item-title">Video duration</span>
        <span class="dplayer-info-panel-item-data"></span>
    </div>
    ${infoDanmakuHtml}
</div>
<div class="dplayer-menu">${menuHtml}</div>
<div class="dplayer-notice-list"></div>
<button class="dplayer-mobile-play">${icons.play}</button>`;
}
