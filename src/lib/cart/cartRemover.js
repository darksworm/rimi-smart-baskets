export default class CartRemover {
    constructor(rimiAPI, document) {
        this.rimiAPI = rimiAPI;
        this.document = document;
    }

    _findCartLiElement(cartId) {
        const btn = this.document.querySelector(`.saved-cart-popup.js-saved li button[value='${cartId}']`);

        if (btn) {
            return btn.parentElement;
        } else {
            throw new Error(`Cart with id ${cartId} does not exist!`);
        }
    }

    removeCart(cartId) {
        let elem = this._findCartLiElement(cartId);

        this.rimiAPI.removeSavedCart(cartId)
            .then((success) => {
                if (success) {
                    elem.remove();
                }
            })
    }
}