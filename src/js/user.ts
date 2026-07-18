import utils from './utils';
import { DPlayerInstance, UserKey, UserStorageMap, UserDefaults } from './types';

class User {
    private readonly storageName: UserStorageMap;
    private readonly default: UserDefaults;
    private data: Record<UserKey, number>;

    constructor(player: DPlayerInstance) {
        this.storageName = {
            opacity: 'dplayer-danmaku-opacity',
            volume: 'dplayer-volume',
            unlimited: 'dplayer-danmaku-unlimited',
            danmaku: 'dplayer-danmaku-show',
            subtitle: 'dplayer-subtitle-show',
        };

        this.default = {
            opacity: 0.7,
            volume: Object.prototype.hasOwnProperty.call(player.options, 'volume') ? (player.options.volume ?? 0.7) : 0.7,
            unlimited: (player.options.danmaku?.unlimited ? 1 : 0) || 0,
            danmaku: 1,
            subtitle: 1,
        };

        this.data = {} as Record<UserKey, number>;
        this.init();
    }

    private init(): void {
        (Object.keys(this.storageName) as UserKey[]).forEach((item) => {
            const name = this.storageName[item];
            const stored = utils.storage.get(name);
            this.data[item] = parseFloat(stored !== null ? stored : String(this.default[item]));
        });
    }

    get(key: UserKey): number {
        return this.data[key];
    }

    set(key: UserKey, value: number): void {
        this.data[key] = value;
        utils.storage.set(this.storageName[key], value);
    }
}

export default User;
