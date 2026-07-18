import utils from './utils';
import { DPlayerInstance } from './types';

class Comment {
    private player: DPlayerInstance;

    constructor(player: DPlayerInstance) {
        this.player = player;

        this.player.template.mask.addEventListener('click', () => {
            this.hide();
        });

        this.player.template.commentButton.addEventListener('click', () => {
            this.show();
        });

        this.player.template.commentSettingButton.addEventListener('click', () => {
            this.toggleSetting();
        });

        this.player.template.commentColorSettingBox.addEventListener('click', () => {
            const sele = this.player.template.commentColorSettingBox.querySelector<HTMLElement>('input:checked+span');
            if (sele) {
                const checked = this.player.template.commentColorSettingBox.querySelector<HTMLInputElement>('input:checked');
                if (checked) {
                    const color = checked.value;
                    const fill = this.player.template.commentSettingFill as unknown as SVGPathElement | null;
                    const sendFill = this.player.template.commentSendFill as unknown as SVGPathElement | null;
                    if (fill) fill.style.fill = color;
                    this.player.template.commentInput.style.color = color;
                    if (sendFill) sendFill.style.fill = color;
                }
            }
        });

        this.player.template.commentInput.addEventListener('click', () => {
            this.hideSetting();
        });

        this.player.template.commentInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.keyCode === 13) {
                this.send();
            }
        });

        this.player.template.commentSendButton.addEventListener('click', () => {
            this.send();
        });
    }

    show(): void {
        this.player.controller.disableAutoHide = true;
        this.player.template.controller.classList.add('dplayer-controller-comment');
        this.player.template.mask.classList.add('dplayer-mask-show');
        this.player.container.classList.add('dplayer-show-controller');
        this.player.template.commentInput.focus();
    }

    hide(): void {
        this.player.template.controller.classList.remove('dplayer-controller-comment');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        this.player.container.classList.remove('dplayer-show-controller');
        this.player.controller.disableAutoHide = false;
        this.hideSetting();
    }

    showSetting(): void {
        this.player.template.commentSettingBox.classList.add('dplayer-comment-setting-open');
    }

    hideSetting(): void {
        this.player.template.commentSettingBox.classList.remove('dplayer-comment-setting-open');
    }

    toggleSetting(): void {
        if (this.player.template.commentSettingBox.classList.contains('dplayer-comment-setting-open')) {
            this.hideSetting();
        } else {
            this.showSetting();
        }
    }

    send(): void {
        this.player.template.commentInput.blur();

        // Reject empty input
        if (!this.player.template.commentInput.value.replace(/^\s+|\s+$/g, '')) {
            this.player.notice(this.player.tran('please-input-danmaku'));
            return;
        }

        const colorInput = this.player.container.querySelector<HTMLInputElement>('.dplayer-comment-setting-color input:checked');
        const typeInput = this.player.container.querySelector<HTMLInputElement>('.dplayer-comment-setting-type input:checked');

        this.player.danmaku!.send(
            {
                text: this.player.template.commentInput.value,
                color: utils.color2Number(colorInput?.value ?? '#ffffff'),
                type: parseInt(typeInput?.value ?? '0'),
            },
            () => {
                this.player.template.commentInput.value = '';
                this.hide();
            }
        );
    }
}

export default Comment;
