export class ConfirmationDialog extends HTMLElement {
    private shadow: ShadowRoot;
    private _message = '';
    private _confirmText = 'Confirm';
    private _cancelText = 'Cancel';

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['message', 'confirm-text', 'cancel-text'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'message':
                    this._message = newValue;
                    break;
                case 'confirm-text':
                    this._confirmText = newValue;
                    break;
                case 'cancel-text':
                    this._cancelText = newValue;
                    break;
            }
            if (this.shadow) {
                this.render();
            }
        }
    }

    set message(value: string) {
        this.setAttribute('message', value);
    }

    get message(): string {
        return this.getAttribute('message') || '';
    }

    set confirmText(value: string) {
        this.setAttribute('confirm-text', value);
    }

    get confirmText(): string {
        return this.getAttribute('confirm-text') || 'Confirm';
    }

    set cancelText(value: string) {
        this.setAttribute('cancel-text', value);
    }

    get cancelText(): string {
        return this.getAttribute('cancel-text') || 'Cancel';
    }

    private render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .dialog {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    max-width: 400px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .message {
                    margin-bottom: 20px;
                    font-size: 16px;
                    line-height: 1.5;
                }
                .buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .confirm {
                    background: #dc3545;
                    color: white;
                }
                .cancel {
                    background: #6c757d;
                    color: white;
                }
            </style>
            <div class="dialog">
                <div class="message">${this._message}</div>
                <div class="buttons">
                    <button class="cancel">${this._cancelText}</button>
                    <button class="confirm">${this._confirmText}</button>
                </div>
            </div>
        `;
    }

    private setupEventListeners() {
        const confirmBtn = this.shadow.querySelector('.confirm') as HTMLButtonElement;
        const cancelBtn = this.shadow.querySelector('.cancel') as HTMLButtonElement;

        confirmBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('confirm'));
        });

        cancelBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('cancel'));
        });
    }
}

customElements.define('confirmation-dialog', ConfirmationDialog);