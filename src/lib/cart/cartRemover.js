export default class CartRemover {
    constructor(rimiAPI, document, promptService) {
        this.rimiAPI = rimiAPI;
        this.document = document;
        this.promptService = promptService;
    }

    promptAndRemoveCart(cartName, cartId) {
        this._findCartLiElement(cartId);
        this.promptService.promptCartRemoval(cartName)
            .then(this._stopMenuFromClosing)
            .then(() => this._removeSavedCart(cartId))
            .catch(this._stopMenuFromClosing);
    }

    _removeSavedCart(cartId) {
        return this.rimiAPI.removeSavedCart(cartId)
            .then(() => this._removeCartLiElement(cartId));
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