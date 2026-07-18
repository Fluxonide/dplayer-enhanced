import { SubtitleOptions } from './types';
import Events from './events';

class Subtitle {
    private container: HTMLElement;
    private video: HTMLVideoElement;
    private options: SubtitleOptions;
    private events: Events;

    constructor(container: HTMLElement, video: HTMLVideoElement, options: SubtitleOptions, events: Events) {
        this.container = container;
        this.video = video;
        this.options = options;
        this.events = events;

        this.init();
    }

    private init(): void {
        this.container.style.fontSize = this.options.fontSize ?? '20px';
        this.container.style.bottom = this.options.bottom ?? '40px';
        this.container.style.color = this.options.color ?? '#fff';

        if (this.video.textTracks && this.video.textTracks[0]) {
            const track = this.video.textTracks[0];

            track.oncuechange = () => {
                const cue = track.activeCues?.[track.activeCues.length - 1] as VTTCue | undefined;
                this.container.innerHTML = '';
                if (cue) {
                    const template = document.createElement('div');
                    template.appendChild(cue.getCueAsHTML());
                    const trackHtml = template.innerHTML
                        .split(/\r?\n/)
                        .map((item) => `<p>${item}</p>`)
                        .join('');
                    this.container.innerHTML = trackHtml;
                }
                this.events.trigger('subtitle_change');
            };
        }
    }

    show(): void {
        this.container.classList.remove('dplayer-subtitle-hide');
        this.events.trigger('subtitle_show');
    }

    hide(): void {
        this.container.classList.add('dplayer-subtitle-hide');
        this.events.trigger('subtitle_hide');
    }

    toggle(): void {
        if (this.container.classList.contains('dplayer-subtitle-hide')) {
            this.show();
        } else {
            this.hide();
        }
    }
}

export default Subtitle;
