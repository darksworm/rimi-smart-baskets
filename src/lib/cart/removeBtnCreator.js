export default class RemoveBtnCreator {
    constructor(document) {
        this.document = document;
    }

    createButtons(innerHTML, callback) {
        this.getCartButtonElements()
            .forEach((elem) => {
                elem.prepend(this.createRemoveBtn(innerHTML, elem, callback))
            });
    }

    getCartButtonElements() {
       return this.document.querySelectorAll(".saved-cart-popup.js-saved li:not(:last-child) button[name='cart']");
    }

    createRemoveBtn(innerHTML, cartButtonElement, callback) {
        let removeBtn = this.document.createElement("span");
        const attrs = this._getRemoveBtnAttrs(cartButtonElement);

        removeBtn.classList.add("smart-basket-remove");
        removeBtn.innerHTML = innerHTML;

        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            callback(attrs.cartTitle, attrs.cartId);
        });

        return removeBtn;
    }

    _getRemoveBtnAttrs(cartButtonElement) {
        return {
            cartTitle: cartButtonElement.textContent.trim(),
            cartId: cartButtonElement.value
        }
    }
}
