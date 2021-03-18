export default class RemoveBtnCreator {
    constructor(document) {
        this.document = document;
    }

    createButtons(innerHTML, callback) {
        this.getLiElems()
            .forEach((elem) => {
                elem.append(this.createRemoveBtn(innerHTML, elem, callback))
            });
    }

    getLiElems() {
       return this.document.querySelectorAll(".saved-cart-popup.js-saved li:not(:last-child)");
    }

    createRemoveBtn(innerHTML, parentLiElement, callback) {
        let removeBtn = this.document.createElement("button");
        const attrs = this._getRemoveBtnAttrs(parentLiElement);

        removeBtn.classList.add("remove-saved-cart");
        removeBtn.innerHTML = innerHTML;

        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            callback(attrs.cartTitle, attrs.cartId);
        });

        return removeBtn;
    }

    _getRemoveBtnAttrs(parentLiElement) {
        return {
            cartTitle: parentLiElement.textContent.trim(),
            cartId: parentLiElement.querySelector('button').value
        }
    }
}
