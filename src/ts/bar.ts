import { BarType, BarDirection } from './types';
import Template from './template';

type BarElements = Record<BarType, HTMLElement>;

class Bar {
    private elements: BarElements;

    constructor(template: Template) {
        this.elements = {
            volume: template.volumeBar,
            played: template.playedBar,
            loaded: template.loadedBar,
            danmaku: template.danmakuOpacityBar,
        };
    }

    /**
     * Update a progress bar
     *
     * @param type - Which bar to update
     * @param percentage - Value between 0 and 1
     * @param direction - 'width' or 'height'
     */
    set(type: BarType, percentage: number, direction: BarDirection): void {
        percentage = Math.max(0, Math.min(1, percentage));
        this.elements[type].style[direction] = `${percentage * 100}%`;
    }

    get(type: BarType): number {
        return parseFloat(this.elements[type].style.width) / 100;
    }
}

export default Bar;
