import utils from './utils';
import { DanmakuConstructorOptions, DanmakuItem, DanmakuAPIOptions } from './types';
import Events from './events';

interface DanmakuTunnel {
    right: Record<string, HTMLElement[]>;
    top: Record<string, HTMLElement[]>;
    bottom: Record<string, HTMLElement[]>;
}

interface DrawDanmakuItem {
    text: string;
    color: number;
    type: number | string;
    border?: string;
    time?: number;
}

class Danmaku {
    private options: DanmakuConstructorOptions;
    readonly player: DanmakuConstructorOptions['player'];
    private container: HTMLElement;
    private danTunnel: DanmakuTunnel;
    danIndex: number;
    dan: DanmakuItem[];
    private showing: boolean;
    private _opacity: number;
    private events: Events;
    unlimited: boolean;
    private paused: boolean;
    private context: CanvasRenderingContext2D | null = null;

    constructor(options: DanmakuConstructorOptions) {
        this.options = options;
        this.player = options.player;
        this.container = options.container;
        this.danTunnel = { right: {}, top: {}, bottom: {} };
        this.danIndex = 0;
        this.dan = [];
        this.showing = true;
        this._opacity = options.opacity;
        this.events = options.events;
        this.unlimited = !!options.unlimited;
        this.paused = false;

        this._measure('');
        this.load();
    }

    load(): void {
        let apiurl: string;
        if (this.options.api.maximum) {
            apiurl = `${this.options.api.address}v3/?id=${this.options.api.id}&max=${this.options.api.maximum}`;
        } else {
            apiurl = `${this.options.api.address}v3/?id=${this.options.api.id}`;
        }

        const endpoints: string[] = (this.options.api.addition ?? []).slice(0);
        endpoints.push(apiurl);

        this.events?.trigger('danmaku_load_start', endpoints);

        this._readAllEndpoints(endpoints, (results) => {
            this.dan = ([] as DanmakuItem[]).concat(...results).sort((a, b) => a.time - b.time);
            window.requestAnimationFrame(() => {
                this.frame();
            });
            this.options.callback();
            this.events?.trigger('danmaku_load_end');
        });
    }

    reload(newAPI: DanmakuAPIOptions): void {
        this.options.api = newAPI;
        this.dan = [];
        this.clear();
        this.load();
    }

    private _readAllEndpoints(endpoints: string[], callback: (results: DanmakuItem[][]) => void): void {
        const results: DanmakuItem[][] = new Array(endpoints.length).fill([]);
        let readCount = 0;

        for (let i = 0; i < endpoints.length; i++) {
            const idx = i;
            this.options.apiBackend.read({
                url: endpoints[idx],
                success: (data) => {
                    results[idx] = data ?? [];
                    readCount++;
                    if (readCount === endpoints.length) callback(results);
                },
                error: (msg) => {
                    this.options.error(msg ?? this.options.tran('danmaku-failed'));
                    results[idx] = [];
                    readCount++;
                    if (readCount === endpoints.length) callback(results);
                },
            });
        }
    }

    send(dan: { text: string; color: number; type: number }, callback: () => void): void {
        const danmakuData: DanmakuItem = {
            token: this.options.api.token,
            id: this.options.api.id,
            author: this.options.api.user ?? 'anonymous',
            time: this.options.time(),
            text: dan.text,
            color: dan.color,
            type: dan.type as 0 | 1 | 2,
        } as unknown as DanmakuItem;

        this.options.apiBackend.send({
            url: `${this.options.api.address}v3/`,
            data: danmakuData,
            success: callback,
            error: (msg) => {
                this.options.error(msg ?? this.options.tran('danmaku-failed'));
            },
        });

        this.dan.splice(this.danIndex, 0, danmakuData);
        this.danIndex++;

        const danmaku: DrawDanmakuItem = {
            text: this.htmlEncode(danmakuData.text),
            color: danmakuData.color,
            type: danmakuData.type,
            border: `2px solid ${this.options.borderColor}`,
        };
        this.draw(danmaku);

        this.events?.trigger('danmaku_send', danmakuData);
    }

    frame(): void {
        if (this.dan.length && !this.paused && this.showing) {
            let item: DanmakuItem | undefined = this.dan[this.danIndex];
            const danBatch: DanmakuItem[] = [];
            while (item && this.options.time() > parseFloat(String(item.time))) {
                danBatch.push(item);
                item = this.dan[++this.danIndex];
            }
            this.draw(danBatch);
        }
        window.requestAnimationFrame(() => {
            this.frame();
        });
    }

    opacity(percentage?: number): number {
        if (percentage !== undefined) {
            const items = this.container.getElementsByClassName('dplayer-danmaku-item');
            for (let i = 0; i < items.length; i++) {
                (items[i] as HTMLElement).style.opacity = String(percentage);
            }
            this._opacity = percentage;
            this.events?.trigger('danmaku_opacity', this._opacity);
        }
        return this._opacity;
    }

    draw(dan: DrawDanmakuItem | DrawDanmakuItem[]): DocumentFragment | undefined {
        if (!this.showing) return undefined;

        const itemHeight = this.options.height;
        const danWidth = this.container.offsetWidth;
        const danHeight = this.container.offsetHeight;
        const itemY = Math.floor(danHeight / itemHeight);

        const danItemRight = (ele: HTMLElement): number => {
            const eleWidth = ele.offsetWidth || parseInt(ele.style.width);
            const eleRight = ele.getBoundingClientRect().right || this.container.getBoundingClientRect().right + eleWidth;
            return this.container.getBoundingClientRect().right - eleRight;
        };

        const danSpeed = (width: number): number => (danWidth + width) / 5;

        const getTunnel = (ele: HTMLElement, type: 'right' | 'top' | 'bottom', width?: number): number => {
            const tmp = width !== undefined ? danWidth / danSpeed(width) : 0;

            for (let i = 0; this.unlimited || i < itemY; i++) {
                const tunnel = this.danTunnel[type];
                const item = tunnel[String(i)];

                if (item && item.length) {
                    if (type !== 'right') continue;
                    for (let j = 0; j < item.length; j++) {
                        const danRight = danItemRight(item[j]) - 10;
                        if (danRight <= danWidth - tmp * danSpeed(parseInt(item[j].style.width)) || danRight <= 0) {
                            break;
                        }
                        if (j === item.length - 1) {
                            tunnel[String(i)].push(ele);
                            ele.addEventListener('animationend', () => {
                                tunnel[String(i)].splice(0, 1);
                            });
                            return i % itemY;
                        }
                    }
                } else {
                    tunnel[String(i)] = [ele];
                    ele.addEventListener('animationend', () => {
                        tunnel[String(i)].splice(0, 1);
                    });
                    return i % itemY;
                }
            }
            return -1;
        };

        const danArray: DrawDanmakuItem[] = Array.isArray(dan) ? dan : [dan];
        const docFragment = document.createDocumentFragment();

        for (let i = 0; i < danArray.length; i++) {
            const d = danArray[i];
            d.type = utils.number2Type(d.type as number);

            if (!d.color) d.color = 16777215;

            const item = document.createElement('div');
            item.classList.add('dplayer-danmaku-item');
            item.classList.add(`dplayer-danmaku-${d.type}`);

            if (d.border) {
                item.innerHTML = `<span style="border:${d.border}">${d.text}</span>`;
            } else {
                item.innerHTML = d.text;
            }

            item.style.opacity = String(this._opacity);
            item.style.color = utils.number2Color(d.color);
            item.addEventListener('animationend', () => {
                this.container.removeChild(item);
            });

            const itemWidth = this._measure(d.text);
            let tunnel: number;

            switch (d.type) {
                case 'right':
                    tunnel = getTunnel(item, 'right', itemWidth);
                    if (tunnel >= 0) {
                        item.style.width = `${itemWidth + 1}px`;
                        item.style.top = `${itemHeight * tunnel}px`;
                        item.style.transform = `translateX(-${danWidth}px)`;
                    }
                    break;
                case 'top':
                    tunnel = getTunnel(item, 'top');
                    if (tunnel >= 0) {
                        item.style.top = `${itemHeight * tunnel}px`;
                    }
                    break;
                case 'bottom':
                    tunnel = getTunnel(item, 'bottom');
                    if (tunnel >= 0) {
                        item.style.bottom = `${itemHeight * tunnel}px`;
                    }
                    break;
                default:
                    console.error(`Can't handled danmaku type: ${d.type as string}`);
                    tunnel = -1;
            }

            if (tunnel! >= 0) {
                item.classList.add('dplayer-danmaku-move');
                item.style.animationDuration = this._danAnimation(d.type as string);
                docFragment.appendChild(item);
            }
        }

        this.container.appendChild(docFragment);
        return docFragment;
    }

    play(): void {
        this.paused = false;
    }

    pause(): void {
        this.paused = true;
    }

    private _measure(text: string): number {
        if (!this.context) {
            const existingItem = this.container.getElementsByClassName('dplayer-danmaku-item')[0] as HTMLElement | undefined;
            if (!existingItem) return 0;
            const measureStyle = getComputedStyle(existingItem, null);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return 0;
            ctx.font = measureStyle.getPropertyValue('font');
            this.context = ctx;
        }
        return this.context.measureText(text).width;
    }

    seek(): void {
        this.clear();
        for (let i = 0; i < this.dan.length; i++) {
            if (this.dan[i].time >= this.options.time()) {
                this.danIndex = i;
                break;
            }
            this.danIndex = this.dan.length;
        }
    }

    clear(): void {
        this.danTunnel = { right: {}, top: {}, bottom: {} };
        this.danIndex = 0;
        this.options.container.innerHTML = '';
        this.events?.trigger('danmaku_clear');
    }

    private htmlEncode(str: string): string {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2f;');
    }

    resize(): void {
        const danWidth = this.container.offsetWidth;
        const items = this.container.getElementsByClassName('dplayer-danmaku-item');
        for (let i = 0; i < items.length; i++) {
            (items[i] as HTMLElement).style.transform = `translateX(-${danWidth}px)`;
        }
    }

    hide(): void {
        this.showing = false;
        this.pause();
        this.clear();
        this.events?.trigger('danmaku_hide');
    }

    show(): void {
        this.seek();
        this.showing = true;
        this.play();
        this.events?.trigger('danmaku_show');
    }

    unlimit(boolean: boolean): void {
        this.unlimited = boolean;
    }

    speed(rate: number): void {
        this.options.api.speedRate = rate;
    }

    private _danAnimation(position: string): string {
        const rate = this.options.api.speedRate ?? 1;
        const isFullScreen = !!this.player.fullScreen.isFullScreen();
        const animations: Record<string, string> = {
            top: `${(isFullScreen ? 6 : 4) / rate}s`,
            right: `${(isFullScreen ? 8 : 5) / rate}s`,
            bottom: `${(isFullScreen ? 6 : 4) / rate}s`,
        };
        return animations[position] ?? '5s';
    }
}

export default Danmaku;
