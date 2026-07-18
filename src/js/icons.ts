import play from '../assets/play.svg';
import pause from '../assets/pause.svg';
import volumeUp from '../assets/volume-up.svg';
import volumeDown from '../assets/volume-down.svg';
import volumeOff from '../assets/volume-off.svg';
import full from '../assets/full.svg';
import fullWeb from '../assets/full-web.svg';
import setting from '../assets/setting.svg';
import right from '../assets/right.svg';
import comment from '../assets/comment.svg';
import commentOff from '../assets/comment-off.svg';
import send from '../assets/send.svg';
import pallette from '../assets/pallette.svg';
import camera from '../assets/camera.svg';
import airplay from '../assets/airplay.svg';
import subtitle from '../assets/subtitle.svg';
import loading from '../assets/loading.svg';
import chromecast from '../assets/chromecast.svg';

export interface IconsMap {
    play: string;
    pause: string;
    volumeUp: string;
    volumeDown: string;
    volumeOff: string;
    full: string;
    fullWeb: string;
    setting: string;
    right: string;
    comment: string;
    commentOff: string;
    send: string;
    pallette: string;
    camera: string;
    subtitle: string;
    loading: string;
    airplay: string;
    chromecast: string;
}

const Icons: IconsMap = {
    play,
    pause,
    volumeUp,
    volumeDown,
    volumeOff,
    full,
    fullWeb,
    setting,
    right,
    comment,
    commentOff,
    send,
    pallette,
    camera,
    subtitle,
    loading,
    airplay,
    chromecast,
};

export default Icons;
