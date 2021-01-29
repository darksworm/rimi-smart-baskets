import ActionProgressWrapper from "../generic/actionProgressWrapper";
import CartUpdater from "../cart/cartUpdater";
import CartUpdateListBuilder from "../cart/cartUpdateListBuilder";

export default class AppendCartButtonCreator {
    constructor(document, cartStorage, rimi) {
        this.document = document;
        this.cartStorage = cartStorage;
        this.rimi = rimi;
        this.cartUpdater = new ActionProgressWrapper(new CartUpdater(this.rimi.api));
    }

    createAppendButtonCreator() {
        const provider = new ProductUpdateListProvider(new CartUpdateListBuilder(), this.cartStorage, this.rimi.dom);
        const appendClickHandler = new CartAppendClickHandler(provider, this.cartUpdater);
        return new CartAppendElementCreator(this.document, appendClickHandler);
    }

    createButtons(buttonContents) {
        const buttonCreator = this.createAppendButtonCreator();
        let buttons = this.getStoredCartButtons();
        buttonCreator.addToRimiButtons(buttons, buttonContents);
    }

    getStoredCartButtons() {
        let rimiCartButtons = this.document.querySelectorAll("button[name='cart']:not(.js-new-cart)");
        return Array.from(rimiCartButtons).filter(x => this.cartStorage.isCartStored(x.value));
    }

    setProgressHandler(handler) {
        this.cartUpdater.setHandler(handler);
    }
}

class CartAppendElementCreator {
    constructor(document, clickHandler) {
        this.document = document;
        this.clickHandler = clickHandler;
    }

    addToRimiButtons(rimiButtons, contents) {
        for (let button of rimiButtons) {
            let cartId = button.value;
            this._addButton(button, cartId, contents)
        }
    }

    _addButton(parentElement, cartId, contents) {
        parentElement.append(
            this._createButton(cartId, contents)
        );
    }

    _createButton(cartId, contents) {
        let button = this.document.createElement('span');
        button.innerHTML = contents;
        button.dataset.id = cartId;
        button.className = 'smart-basket-add';
        button.addEventListener('click', (event) => this.clickHandler.handle(event));
        return button;
    }
}

class CartAppendClickHandler {
    constructor(productProvider, cartUpdater) {
        this.productProvider = productProvider;
        this.cartUpdater = cartUpdater;
    }

    handle(event) {
        this._stopEvent(event);
        let cartId = this._getClickedCartId(event);
        let products = this.productProvider.provideForStoredCartId(cartId);
        this.cartUpdater.doAction(products);
    }

    _getClickedCartId(event) {
        let node = event.target;
        while (!node.dataset.id && node.parentNode) {
            node = node.parentNode;
        }
        return node.dataset.id;
    }

    _stopEvent(event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

class ProductUpdateListProvider {
    constructor(updateListBuilder, cartStorage, rimiDOM) {
        this.updateListBuilder = updateListBuilder;
        this.cartStorage = cartStorage;
        this.rimiDOM = rimiDOM;
    }

    provideForStoredCartId(cartId) {
        return this.updateListBuilder.getProductsToUpdate(
            this.cartStorage.getStoredCart(cartId).products,
            this.rimiDOM.getCurrentCart().products
        );
    }
}
