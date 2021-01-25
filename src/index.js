"use strict";

import RimiDOM from './lib/rimiDOM'
import RimiAPI from "./lib/rimiAPI";
import CartStorage from "./lib/cartStorage";
import LoadingIndicator from "./lib/loadingIndicator";
import CartUpdater from "./lib/cartUpdater";
import ActionProgressWrapper from "./lib/actionProgressWrapper";
import CartUpdateListBuilder from "./lib/cartUpdateListBuilder";
import RimiStateLoader from "./lib/rimiStateLoader";
import CartAppendButtonCreator from "./lib/cartAppendButtonCreator";

import stylesheet from './static/style.css'
import cartSVG from './static/cart.svg'

let rimiState = new RimiStateLoader(window);
let rimiDOM = new RimiDOM(window);
let rimiAPI = new RimiAPI(rimiState.getToken(), rimiState.getCSRFToken(), axios);

let cartStorage = new CartStorage(localStorage);
let loadingIndicator = new LoadingIndicator(document);

let updateListBuilder = new CartUpdateListBuilder();
let cartUpdater = new ActionProgressWrapper(new CartUpdater(rimiAPI));

cartUpdater.onStart(() => {
    loadingIndicator.show()
});
cartUpdater.onProgress((done, total) => {
    loadingIndicator.updateText(`Adding product ${done} / ${total}`)
});
cartUpdater.onComplete(() => {
    loadingIndicator.updateText('Refreshing cart');
    window.location = `https://www.rimi.lv/e-veikals/${rimiState.getLanguage()}/checkout/refresh`;
});

let cartAppendButtonCreator = new CartAppendButtonCreator(document, cartSVG);

injectCSS(document, stylesheet);

if (rimiDOM.isInSavedCart()) {
    let button = createSaveCartButton(document);
    embedSaveCartButton(button, document)
} else {
    let rimiCartButtons = document.querySelectorAll("button[name='cart']:not(.js-new-cart)");
    let storedRimiCartButtons = Array.from(rimiCartButtons).filter(x => cartStorage.isCartStored(x.value));
    cartAppendButtonCreator.addToRimiButtons(storedRimiCartButtons, cartAppendClickMethodGenerator);
}

function cartAppendClickMethodGenerator(cartId) {
    return function (event) {
        event.stopPropagation();
        event.preventDefault();

        let productsToUpdate = updateListBuilder.getProductsToUpdate(
            cartStorage.getStoredCart(cartId).products,
            rimiDOM.getCurrentCart().products
        );

        cartUpdater.doAction(productsToUpdate);
    }
}

function embedSaveCartButton(button, document) {
    const headingEl = document.querySelector('.cart__header > h3.cart__heading');
    headingEl.parentNode.insertBefore(button, headingEl.nextSibling)
}

function createSaveCartButton(document) {
    let button = document.createElement('button');
    button.innerText = 'Save in "Smart Baskets"';
    button.className = 'link-button smart-basket-save-button';
    button.addEventListener('click', () => {
        cartStorage.storeCart(rimiDOM.getCurrentCart());
    });
    return button;
}

function injectCSS(document, contents) {
    let css = document.createElement('style');
    css.textContent = contents;
    document.head.append(css);
}
