export default class SaveCartButton {
    constructor(document, onClick, caption) {
        this.document = document;
        this.onClick = onClick;
        this.caption = caption;
    }

    _create() {
        let button = document.createElement('button');
        button.innerText = this.caption;
        button.className = 'link-button smart-basket-save-button';
        button.addEventListener('click', this.onClick);
        return button;
    }

    place() {
        let button = this._create();
        const headingEl = document.querySelector('.cart__header > h3.cart__heading');
        headingEl.parentNode.insertBefore(button, headingEl.nextSibling)
    }
}
