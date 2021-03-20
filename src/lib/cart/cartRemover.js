export default class CartRemover {
    constructor(document, rimiAPI, promptService) {
        this.document = document;
        this.rimiAPI = rimiAPI;
        this.promptService = promptService;
    }

    promptAndRemoveCart(name, id) {
        this._findCartLiElement(id);

        this.promptService.promptCartRemoval(name)
            .then(() => this._stopMenuFromClosing())
            .then(() => this._removeSavedCart(name, id))
            .catch(() => this._stopMenuFromClosing());
    }

    _removeSavedCart(name, id) {
        return this.rimiAPI.removeSavedCart(id)
            .then(() => this._removeCartListing(id))
            .then(() => this._notifySuccess(name))
            .catch(() => this._notifyError());
    }

    _notifySuccess(cartName) {
        this.promptService.notifySuccess(`Cart ${cartName} removed!`, 2000);
    }

    _notifyError() {
        this.promptService.notifyError(`Cart removal failed!`, 2000);
    }

    _findCartLiElement(cartId) {
        const btn = this.document.querySelector(`.saved-cart-popup.js-saved li button[value='${cartId}']`);
        return btn.parentElement;
    }

    _stopMenuFromClosing() {
        let elem = this.document.querySelector('section.cart');
        elem.classList.add('-saved-cart-active');
    }

    _removeCartListing(cartId) {
        this._findCartLiElement(cartId).remove();
    }
}