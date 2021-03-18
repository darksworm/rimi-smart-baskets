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
//
//<ul class="saved-cart-popup js-saved">
//    <li>
//        <button name="cart" value="13371337">dankmemes</button>
//    </li>
//    <li>
//        <button name="cart" value="1101522953">temp</button>
//    </li>
//    <li id="new-cart-li">
//        <button name="cart" value="new" class="js-new-cart">
//            <span>Sākt jaunu grozu</span>
//            <svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
//                <path d="M6 24h36M24 42V5.9" fill="none" stroke="currentColor" stroke-width="2"
//                      stroke-miterlimit="10"></path>
//            </svg>
//        </button>
//    </li>
//</ul>`, {
