export default class SaveCartButton {
    constructor(document, onClick) {
        this.document = document;
        this.onClick = onClick;
    }

    _create() {
        let button = document.createElement('button');
        button.innerText = 'Save in "Smart Baskets"';
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
