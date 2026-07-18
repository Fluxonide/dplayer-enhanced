import { ThumbnailsOptions } from './types';
import Events from './events';

class Thumbnails {
    private container: HTMLElement;
    private barWidth: number;
    private events: Events | null;

    constructor(options: ThumbnailsOptions) {
        this.container = options.container;
        this.barWidth = options.barWidth;
        this.events = options.events ?? null;
        this.container.style.backgroundImage = `url('${options.url}')`;
    }

    resize(width: number, height: number, barWrapWidth: number): void {
        this.container.style.width = `${width}px`;
        this.container.style.height = `${height}px`;
        this.container.style.top = `${-height + 2}px`;
        this.barWidth = barWrapWidth;
    }

    show(): void {
        this.container.style.display = 'block';
        this.events?.trigger('thumbnails_show');
    }

    move(position: number): void {
        this.container.style.backgroundPosition = `-${(Math.ceil((position / this.barWidth) * 100) - 1) * 160}px 0`;
        this.container.style.left = `${Math.min(Math.max(position - this.container.offsetWidth / 2, -10), this.barWidth - 150)}px`;
    }

    hide(): void {
        this.container.style.display = 'none';
        this.events?.trigger('thumbnails_hide');
    }
}

export default Thumbnails;
