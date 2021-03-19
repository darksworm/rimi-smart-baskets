export default class CartRemover {
    constructor(rimiAPI, document, promptService) {
        this.rimiAPI = rimiAPI;
        this.document = document;
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
            .then(() => this._removeCartLiElement(id))
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

        if (btn) {
            return btn.parentElement;
        } else {
            throw new Error(`Cart with id ${cartId} does not exist!`);
        }
    }

    _stopMenuFromClosing() {
        document.querySelector('section.cart').classList.add('-saved-cart-active');
    }

    _removeCartLiElement(cartId) {
        this._findCartLiElement(cartId).remove();
    }
}