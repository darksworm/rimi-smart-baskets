export default class RimiDOM {
    constructor(window) {
        this.window = window;
    }

    getCurrentCart() {
        let cart = {};

        if (this.isInSavedCart()) {
            let currentCartTitle = this._getCurrentCartTitle();
            let allCarts = this._getSavedCarts();
            cart = this._getCartByTitle(allCarts, currentCartTitle);
        }

        cart.products = this._getCurrentCartProducts();
        return cart;
    }

    isCurrentCartEmpty() {
        return this.getCurrentCart().products.length === 0;
    }

    isInSavedCart() {
        const yourCartText = ['Your cart', 'Pasūtījuma grozs', 'Корзина'];
        const actualText = this._getCurrentCartTitle();

        if (typeof actualText === "undefined") {
            return false
        }

        return !yourCartText.includes(actualText);
    }

    _getCurrentCartProducts() {
        let productElements = Array.from(this._getCartProductElements());
        return productElements.map(this._createProductFromElement)
    }

    _createProductFromElement(element) {
        let jsonData = element.dataset.gtmEecProduct;
        let product = JSON.parse(jsonData);

        product.hiddenAmount = element.querySelector('.js-counter input[name="amount"]').value;
        product.hiddenStep = element.querySelector('.js-counter input[name="step"]').value;

        return product;
    }

    _getCartByTitle(allCarts, cartName) {
        for (let otherCart of allCarts) {
            if (cartName === otherCart.name) {
                return otherCart;
            }
        }

        throw new Error('current cart name not found among cart-list');
    }

    _getSavedCarts() {
        let buttons = Array.from(this._getCartButtons());

        return buttons.map(button => {
            return {
                id: button.value,
                name: button.innerHTML
            }
        })
    }

    _getCartButtons() {
        return this.window.document.querySelectorAll(
            ".saved-cart-popup > li > button:not(.js-new-cart)"
        );
    }

    _getCartProductElements() {
        return this.window.document.querySelectorAll(
            ".js-product-container.in-cart"
        );
    }

    _getCurrentCartTitle() {
        let headingElements = this.window.document.getElementsByClassName(
            "cart__heading"
        );

        if (headingElements.length) {
            return headingElements[0].textContent;
        }

        return undefined;
    }
}
