export class SaveCartButton {
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

export default class SaveCartButtonCreator {
    constructor(document, cartStorage, rimiDOM) {
        this.document = document;
        this.rimiDOM = rimiDOM;
        this.cartStorage = cartStorage;
    }

    createButton() {
        new SaveCartButton(
            this.document,
            this.buttonClickHandler.bind(this),
            this.getButtonCaption()
        ).place();
    }

    getButtonCaption() {
        let currentCartId = this.rimiDOM.getCurrentCart().id;
        let currentCartIsStored = this.cartStorage.isCartStored(currentCartId);
        return currentCartIsStored ? 'Update cart in "Smart Baskets"' : 'Save cart in "Smart Baskets"';
    }

    buttonClickHandler() {
        let currentCart = this.rimiDOM.getCurrentCart();
        let cartExists = this.cartStorage.isCartStored(currentCart.id);

        this.cartStorage.storeCart(currentCart);
        this.notifySuccess(!cartExists, currentCart.name);
    }

    notifySuccess(cartIsNew, cartName) {
        if (!this.notificationHandler) {
            return;
        }

        let message = `Cart "${cartName}" ${cartIsNew ? 'is now stored' : 'has been updated'} in "Smart Baskets"`;
        this.notificationHandler.notifySuccess(message, 2000);
    }

    setNotificationHandler(notificationHandler) {
        this.notificationHandler = notificationHandler;
    }
}
