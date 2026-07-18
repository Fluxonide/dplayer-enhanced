import axios from 'axios';
import { ApiBackend, ApiSendOptions, ApiReadOptions, DanmakuItem } from './types';

interface DanmakuApiResponse {
    code: number;
    msg?: string;
    data?: Array<[number, number, number, string, string]>;
}

const defaultApiBackend: ApiBackend = {
    send(options: ApiSendOptions): void {
        axios
            .post<DanmakuApiResponse>(options.url, options.data)
            .then((response) => {
                const data = response.data;
                if (!data || data.code !== 0) {
                    options.error?.(data?.msg);
                    return;
                }
                options.success?.(data);
            })
            .catch((e: Error) => {
                console.error(e);
                options.error?.();
            });
    },

    read(options: ApiReadOptions): void {
        axios
            .get<DanmakuApiResponse>(options.url)
            .then((response) => {
                const data = response.data;
                if (!data || data.code !== 0) {
                    options.error?.(data?.msg);
                    return;
                }
                options.success?.(
                    (data.data ?? []).map<DanmakuItem>((item) => ({
                        time: item[0],
                        type: item[1] as 0 | 1 | 2,
                        color: item[2],
                        author: item[3],
                        text: item[4],
                    }))
                );
            })
            .catch((e: Error) => {
                console.error(e);
                options.error?.();
            });
    },
};

export default defaultApiBackend;
