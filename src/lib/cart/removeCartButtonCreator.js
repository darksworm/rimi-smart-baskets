export default class RemoveCartButtonCreator {
    constructor(document) {
        this.document = document;
    }

    createButtons(innerHTML, onClick) {
        this.getCartButtonElements()
            .forEach((elem) => {
                let button = this.createRemoveBtn(innerHTML, elem, onClick);
                elem.prepend(button);
            });
    }

    getCartButtonElements() {
       return this.document.querySelectorAll(".saved-cart-popup.js-saved li:not(:last-child) button[name='cart']");
    }

    createRemoveBtn(innerHTML, cartButtonElement, onClick) {
        let removeBtn = this.document.createElement("span");
        const attrs = this._getRemoveBtnAttrs(cartButtonElement);

        removeBtn.classList.add("smart-basket-remove");
        removeBtn.innerHTML = innerHTML;

        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            onClick(attrs.cartTitle, attrs.cartId);
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
