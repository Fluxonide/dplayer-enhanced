import { ScrollPosition } from './types';

const isMobile: boolean = /mobile|android|iphone|ipod|phone|ipad/i.test(window.navigator.userAgent);

// Augment the function with a cached offset value for getBoundingClientRectViewLeft
interface BoundingClientRectFn {
    (element: HTMLElement): number;
    offset?: number;
}

const utils = {
    /**
     * Parse seconds into a time string (MM:SS or HH:MM:SS)
     */
    secondToTime(second: number): string {
        second = second || 0;
        if (second === 0 || second === Infinity || Number.isNaN(second)) {
            return '00:00';
        }
        const add0 = (num: number): string => (num < 10 ? '0' + num : '' + num);
        const hour = Math.floor(second / 3600);
        const min = Math.floor((second - hour * 3600) / 60);
        const sec = Math.floor(second - hour * 3600 - min * 60);
        return (hour > 0 ? [hour, min, sec] : [min, sec]).map(add0).join(':');
    },

    /**
     * Get element's left offset relative to viewport (legacy approach)
     */
    getElementViewLeft(element: HTMLElement): number {
        let actualLeft = element.offsetLeft;
        let current: Element | null = element.offsetParent;
        const elementScrollLeft = document.body.scrollLeft + document.documentElement.scrollLeft;
        if (!document.fullscreenElement && !(document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement && !(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement) {
            while (current !== null) {
                actualLeft += (current as HTMLElement).offsetLeft;
                current = (current as HTMLElement).offsetParent;
            }
        } else {
            while (current !== null && current !== element) {
                actualLeft += (current as HTMLElement).offsetLeft;
                current = (current as HTMLElement).offsetParent;
            }
        }
        return actualLeft - elementScrollLeft;
    },

    /**
     * Optimised: get element's left offset via getBoundingClientRect
     */
    getBoundingClientRectViewLeft(element: HTMLElement): number {
        const scrollTop = window.scrollY || window.pageYOffset || document.body.scrollTop + ((document.documentElement && document.documentElement.scrollTop) || 0);

        if (element.getBoundingClientRect) {
            const fn = utils.getBoundingClientRectViewLeft as BoundingClientRectFn;
            if (typeof fn.offset !== 'number') {
                let temp: HTMLDivElement | null = document.createElement('div');
                temp.style.cssText = 'position:absolute;top:0;left:0;';
                document.body.appendChild(temp);
                fn.offset = -temp.getBoundingClientRect().top - scrollTop;
                document.body.removeChild(temp);
                temp = null;
            }
            const rect = element.getBoundingClientRect();
            const offset = (utils.getBoundingClientRectViewLeft as BoundingClientRectFn).offset ?? 0;
            return rect.left + offset;
        }

        return utils.getElementViewLeft(element);
    },

    getScrollPosition(): ScrollPosition {
        return {
            left: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
            top: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
        };
    },

    setScrollPosition({ left = 0, top = 0 }: Partial<ScrollPosition>): void {
        if (utils.isFirefox) {
            document.documentElement.scrollLeft = left;
            document.documentElement.scrollTop = top;
        } else {
            window.scrollTo(left, top);
        }
    },

    isMobile,

    isFirefox: /firefox/i.test(window.navigator.userAgent),

    isChrome: /chrome/i.test(window.navigator.userAgent),

    isSafari: /safari/i.test(window.navigator.userAgent),

    storage: {
        set(key: string, value: string | number): void {
            localStorage.setItem(key, String(value));
        },
        get(key: string): string | null {
            return localStorage.getItem(key);
        },
    },

    nameMap: {
        dragStart: isMobile ? 'touchstart' : 'mousedown',
        dragMove: isMobile ? 'touchmove' : 'mousemove',
        dragEnd: isMobile ? 'touchend' : 'mouseup',
    } as const,

    color2Number(color: string): number {
        if (color[0] === '#') {
            color = color.substring(1);
        }
        if (color.length === 3) {
            color = `${color[0]}${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}`;
        }
        return (parseInt(color, 16) + 0x000000) & 0xffffff;
    },

    number2Color(number: number): string {
        return '#' + ('00000' + number.toString(16)).slice(-6);
    },

    number2Type(number: number | string): 'right' | 'top' | 'bottom' {
        switch (number) {
            case 0:
                return 'right';
            case 1:
                return 'top';
            case 2:
                return 'bottom';
            default:
                return 'right';
        }
    },
};

export default utils;
