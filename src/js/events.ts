import { AllEventName, VideoEventName, PlayerEventName, EventCallback } from './types';

class Events {
    events: Partial<Record<AllEventName, EventCallback[]>>;
    readonly videoEvents: VideoEventName[];
    readonly playerEvents: PlayerEventName[];

    constructor() {
        this.events = {};

        this.videoEvents = [
            'abort',
            'canplay',
            'canplaythrough',
            'durationchange',
            'emptied',
            'ended',
            'error',
            'loadeddata',
            'loadedmetadata',
            'loadstart',
            'mozaudioavailable',
            'pause',
            'play',
            'playing',
            'progress',
            'ratechange',
            'seeked',
            'seeking',
            'stalled',
            'suspend',
            'timeupdate',
            'volumechange',
            'waiting',
        ];

        this.playerEvents = [
            'screenshot',
            'thumbnails_show',
            'thumbnails_hide',
            'danmaku_show',
            'danmaku_hide',
            'danmaku_clear',
            'danmaku_loaded',
            'danmaku_send',
            'danmaku_opacity',
            'danmaku_load_start',
            'danmaku_load_end',
            'contextmenu_show',
            'contextmenu_hide',
            'notice_show',
            'notice_hide',
            'quality_start',
            'quality_end',
            'destroy',
            'resize',
            'fullscreen',
            'fullscreen_cancel',
            'webfullscreen',
            'webfullscreen_cancel',
            'subtitle_show',
            'subtitle_hide',
            'subtitle_change',
        ];
    }

    on(name: AllEventName, callback: EventCallback): void {
        if (this.type(name) && typeof callback === 'function') {
            if (!this.events[name]) {
                this.events[name] = [];
            }
            this.events[name]!.push(callback);
        }
    }

    trigger(name: AllEventName, info?: unknown): void {
        const handlers = this.events[name];
        if (handlers && handlers.length) {
            for (let i = 0; i < handlers.length; i++) {
                handlers[i](info);
            }
        }
    }

    type(name: AllEventName): 'player' | 'video' | null {
        if ((this.playerEvents as string[]).includes(name)) {
            return 'player';
        } else if ((this.videoEvents as string[]).includes(name)) {
            return 'video';
        }
        console.error(`Unknown event name: ${name}`);
        return null;
    }
}

export default Events;
