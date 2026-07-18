/**
 * Central type definitions for DPlayer Enhanced
 */

// ---------------------------------------------------------------------------
// Danmaku types
// ---------------------------------------------------------------------------
export type DanmakuType = 0 | 1 | 2 | 'right' | 'top' | 'bottom';

export interface DanmakuItem {
    time: number;
    type: DanmakuType;
    color: number;
    author: string;
    text: string;
}

export interface DanmakuAPIOptions {
    id: string;
    address: string;
    token?: string;
    maximum?: number;
    addition?: string[];
    user?: string;
    speedRate?: number;
}

export interface DanmakuOptions {
    id: string;
    api: string;
    token?: string;
    maximum?: number;
    addition?: string[];
    user?: string;
    unlimited?: boolean;
    speedRate?: number;
    /** CSS value for bottom margin of the danmaku area, e.g. '60px' */
    bottom?: string;
}

// ---------------------------------------------------------------------------
// Video / Subtitle / Quality types
// ---------------------------------------------------------------------------
export interface VideoQualityOption {
    name: string;
    url: string;
    type?: string;
}

export interface SubtitleUrlItem {
    subtitle: string;
    lang?: string;
    name?: string;
}

export interface SubtitleOptions {
    url: string | SubtitleUrlItem[];
    type?: string;
    fontSize?: string;
    bottom?: string;
    color?: string;
    index?: number;
    defaultSubtitle?: string | number;
}

export interface VideoOptions {
    url: string;
    pic?: string;
    type?: string;
    quality?: VideoQualityOption[];
    defaultQuality?: number;
    thumbnails?: string;
    customType?: Record<string, (video: HTMLVideoElement, player: DPlayerInstance) => void>;
}

// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------
export interface ContextMenuItem {
    text?: string;
    key?: string;
    link?: string;
    click?: (player: DPlayerInstance) => void;
}

// ---------------------------------------------------------------------------
// API backend
// ---------------------------------------------------------------------------
export interface ApiSendOptions {
    url: string;
    data: DanmakuItem;
    success?: (data: unknown) => void;
    error?: (msg?: string) => void;
}

export interface ApiReadOptions {
    url: string;
    success?: (data: DanmakuItem[]) => void;
    error?: (msg?: string) => void;
}

export interface ApiBackend {
    send: (options: ApiSendOptions) => void;
    read: (options: ApiReadOptions) => void;
}

// ---------------------------------------------------------------------------
// Highlight marks on progress bar
// ---------------------------------------------------------------------------
export interface HighlightItem {
    text: string;
    time: number;
}

// ---------------------------------------------------------------------------
// Plugin options (passed through to third-party streaming libs)
// ---------------------------------------------------------------------------
export interface PluginOptions {
    hls?: Record<string, unknown>;
    flv?: {
        mediaDataSource?: Record<string, unknown>;
        config?: Record<string, unknown>;
    };
    dash?: Record<string, unknown>;
    webtorrent?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Main DPlayer options
// ---------------------------------------------------------------------------
export interface DPlayerOptions {
    container: HTMLElement;
    live?: boolean;
    autoplay?: boolean;
    theme?: string;
    loop?: boolean;
    lang?: string;
    screenshot?: boolean;
    airplay?: boolean;
    chromecast?: boolean;
    hotkey?: boolean;
    globalHotkey?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
    volume?: number;
    playbackSpeed?: number[];
    apiBackend?: ApiBackend;
    video: VideoOptions;
    subtitle?: SubtitleOptions;
    danmaku?: DanmakuOptions;
    contextmenu?: ContextMenuItem[];
    highlight?: HighlightItem[];
    mutex?: boolean;
    pluginOptions?: PluginOptions;
    preventClickToggle?: boolean;
    /** @deprecated use container */
    element?: HTMLElement;
}

// ---------------------------------------------------------------------------
// User stored settings
// ---------------------------------------------------------------------------
export type UserKey = 'opacity' | 'volume' | 'unlimited' | 'danmaku' | 'subtitle';

export interface UserStorageMap {
    opacity: string;
    volume: string;
    unlimited: string;
    danmaku: string;
    subtitle: string;
}

export interface UserDefaults {
    opacity: number;
    volume: number;
    unlimited: number;
    danmaku: number;
    subtitle: number;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export type VideoEventName =
    | 'abort'
    | 'canplay'
    | 'canplaythrough'
    | 'durationchange'
    | 'emptied'
    | 'ended'
    | 'error'
    | 'loadeddata'
    | 'loadedmetadata'
    | 'loadstart'
    | 'mozaudioavailable'
    | 'pause'
    | 'play'
    | 'playing'
    | 'progress'
    | 'ratechange'
    | 'seeked'
    | 'seeking'
    | 'stalled'
    | 'suspend'
    | 'timeupdate'
    | 'volumechange'
    | 'waiting';

export type PlayerEventName =
    | 'screenshot'
    | 'thumbnails_show'
    | 'thumbnails_hide'
    | 'danmaku_show'
    | 'danmaku_hide'
    | 'danmaku_clear'
    | 'danmaku_loaded'
    | 'danmaku_send'
    | 'danmaku_opacity'
    | 'danmaku_load_start'
    | 'danmaku_load_end'
    | 'contextmenu_show'
    | 'contextmenu_hide'
    | 'notice_show'
    | 'notice_hide'
    | 'quality_start'
    | 'quality_end'
    | 'destroy'
    | 'resize'
    | 'fullscreen'
    | 'fullscreen_cancel'
    | 'webfullscreen'
    | 'webfullscreen_cancel'
    | 'subtitle_show'
    | 'subtitle_hide'
    | 'subtitle_change';

export type AllEventName = VideoEventName | PlayerEventName;

export type EventCallback = (info?: unknown) => void;

// ---------------------------------------------------------------------------
// Bar directions / types
// ---------------------------------------------------------------------------
export type BarType = 'volume' | 'played' | 'loaded' | 'danmaku';
export type BarDirection = 'width' | 'height';

// ---------------------------------------------------------------------------
// Fullscreen types
// ---------------------------------------------------------------------------
export type FullScreenType = 'browser' | 'web';

// ---------------------------------------------------------------------------
// Scroll position
// ---------------------------------------------------------------------------
export interface ScrollPosition {
    left: number;
    top: number;
}

// ---------------------------------------------------------------------------
// Danmaku constructor options
// ---------------------------------------------------------------------------
export interface DanmakuConstructorOptions {
    player: DPlayerInstance;
    container: HTMLElement;
    opacity: number;
    callback: () => void;
    error: (msg?: string) => void;
    apiBackend: ApiBackend;
    borderColor: string;
    height: number;
    time: () => number;
    unlimited: number;
    api: DanmakuAPIOptions;
    events: import('./events').default;
    tran: (key: string) => string;
}

// ---------------------------------------------------------------------------
// Thumbnails constructor options
// ---------------------------------------------------------------------------
export interface ThumbnailsOptions {
    container: HTMLElement;
    barWidth: number;
    url: string;
    events: import('./events').default;
}

// ---------------------------------------------------------------------------
// Template constructor options
// ---------------------------------------------------------------------------
export interface TemplateConstructorOptions {
    container: HTMLElement;
    options: DPlayerOptions;
    index: number;
    tran: (key: string) => string;
}

// ---------------------------------------------------------------------------
// Forward declaration of DPlayer instance (to avoid circular deps)
// All modules import this instead of the concrete class.
// ---------------------------------------------------------------------------
export interface DPlayerInstance {
    options: DPlayerOptions;
    video: HTMLVideoElement;
    prevVideo: HTMLVideoElement | null;
    container: HTMLElement;
    paused: boolean;
    focus: boolean;
    moveBar: boolean;
    type: string;
    qualityIndex: number;
    prevIndex: number;
    quality: VideoQualityOption | undefined;
    switchingQuality: boolean;
    arrow: boolean;
    noticeList: Record<string, ReturnType<typeof setTimeout> | null>;
    _savedPlaybackRate: number;
    plugins: Record<string, unknown>;
    docClickFun: (() => void) | null;
    containerClickFun: (() => void) | null;

    // Sub-modules
    tran: (key: string) => string;
    events: import('./events').default;
    user: import('./user').default;
    template: import('./template').default;
    bar: import('./bar').default;
    bezel: import('./bezel').default;
    fullScreen: import('./fullscreen').default;
    controller: import('./controller').default;
    danmaku?: import('./danmaku').default;
    comment?: import('./comment').default;
    setting: import('./setting').default;
    hotkey: import('./hotkey').default;
    contextmenu: import('./contextmenu').default;
    infoPanel: import('./info-panel').default;
    timer: import('./timer').default;
    subtitle?: import('./subtitle').default;
    subtitles?: import('./subtitles').default;

    // Methods
    play(fromNative?: boolean): void;
    pause(fromNative?: boolean): void;
    toggle(): void;
    seek(time: number, nonotice?: boolean): void;
    volume(percentage?: number, nostorage?: boolean, nonotice?: boolean): number;
    speed(rate: number): void;
    switchVolumeIcon(): void;
    notice(text: string, time?: number, opacity?: number, id?: string): void;
    resize(): void;
    destroy(): void;
    on(name: AllEventName, callback: EventCallback): void;
    initVideo(video: HTMLVideoElement, type: string): void;
    initMSE(video: HTMLVideoElement, type: string): void;
    switchQuality(index: number | string): void;
    switchVideo(video: VideoOptions, danmakuAPI?: DanmakuOptions): void;
}
