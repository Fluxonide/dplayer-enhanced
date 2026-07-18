// Globals injected by webpack DefinePlugin
declare const DPLAYER_VERSION: string;
declare const GIT_HASH: string;

// promise-polyfill has no @types package
declare module 'promise-polyfill' {
    const Promise: PromiseConstructor;
    export default Promise;
}

// SVG files are inlined as strings by svg-inline-loader
declare module '*.svg' {
    const content: string;
    export default content;
}

// LESS modules
declare module '*.less' {
    const styles: Record<string, string>;
    export default styles;
}

// Chrome Cast SDK (minimal – extend as needed)
declare namespace chrome {
    namespace cast {
        interface Cast {
            SessionRequest: new (appId: string) => SessionRequest;
            ApiConfig: new (request: SessionRequest, sessionListener: () => void, receiverListener: (status: string) => void) => ApiConfig;
            initialize(config: ApiConfig, onInit: () => void): void;
            requestSession(success: (session: Session) => void, error: (err: Error) => void): void;
            ReceiverAvailability: { AVAILABLE: string };
            media: {
                DEFAULT_MEDIA_RECEIVER_APP_ID: string;
                MediaInfo: new (contentId: string, contentType: string) => MediaInfo;
                LoadRequest: new (mediaInfo: MediaInfo) => LoadRequest;
            };
        }
        interface SessionRequest {}
        interface ApiConfig {}
        interface Session {
            loadMedia(request: media.LoadRequest, success: (media: media.Media) => void, error: (err: Error) => void): void;
            stop(success: () => void, error: () => void): void;
        }
        interface Error {
            code?: string;
        }
        namespace media {
            interface MediaInfo {}
            interface LoadRequest {}
            interface Media {
                stop(success: () => void, error: () => void): void;
            }
        }
    }
}
