import { DPlayerInstance } from './types';

class Subtitles {
    private player: DPlayerInstance;

    constructor(player: DPlayerInstance) {
        this.player = player;

        this.player.template.mask.addEventListener('click', () => {
            this.hide();
        });

        this.player.template.subtitlesButton.addEventListener('click', () => {
            this.adaptiveHeight();
            this.show();
        });

        const items = this.player.template.subtitlesItem;
        const lastItemIndex = items.length - 1;

        // All subtitle tracks except the last (Off) one
        for (let i = 0; i < lastItemIndex; i++) {
            items[i].addEventListener('click', () => {
                this.hide();
                if (this.player.options.subtitle!.index !== i) {
                    // Clear current subtitle content
                    this.player.template.subtitle.innerHTML = '<p></p>';
                    // Update track source
                    this.player.template.subtrack.src = (items[i] as HTMLElement & { dataset: DOMStringMap }).dataset.subtitle ?? '';
                    // Track current index
                    this.player.options.subtitle!.index = i;
                    if (this.player.template.subtitle.classList.contains('dplayer-subtitle-hide')) {
                        this.subContainerShow();
                    }
                }
            });
        }

        // Last item = "Off"
        items[lastItemIndex].addEventListener('click', () => {
            this.hide();
            if (this.player.options.subtitle!.index !== lastItemIndex) {
                this.player.template.subtitle.innerHTML = '<p></p>';
                this.player.template.subtrack.src = '';
                this.player.options.subtitle!.index = lastItemIndex;
                this.subContainerHide();
            }
        });
    }

    subContainerShow(): void {
        this.player.template.subtitle.classList.remove('dplayer-subtitle-hide');
        this.player.events.trigger('subtitle_show');
    }

    subContainerHide(): void {
        this.player.template.subtitle.classList.add('dplayer-subtitle-hide');
        this.player.events.trigger('subtitle_hide');
    }

    hide(): void {
        this.player.template.subtitlesBox.classList.remove('dplayer-subtitles-box-open');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        this.player.controller.disableAutoHide = false;
    }

    show(): void {
        this.player.template.subtitlesBox.classList.add('dplayer-subtitles-box-open');
        this.player.template.mask.classList.add('dplayer-mask-show');
        this.player.controller.disableAutoHide = true;
    }

    adaptiveHeight(): void {
        const curBoxHeight = this.player.template.subtitlesItem.length * 30 + 14;
        const stdMaxHeight = this.player.template.videoWrap.offsetHeight * 0.8;

        if (curBoxHeight >= stdMaxHeight - 50) {
            this.player.template.subtitlesBox.style.bottom = '8px';
            this.player.template.subtitlesBox.style.maxHeight = `${stdMaxHeight - 8}px`;
        } else {
            this.player.template.subtitlesBox.style.bottom = '50px';
            this.player.template.subtitlesBox.style.maxHeight = `${stdMaxHeight - 50}px`;
        }
    }
}

export default Subtitles;
