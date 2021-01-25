"use strict";

import RimiDOM from './lib/rimiDOM'
import RimiAPI from "./lib/rimiAPI";
import CartStorage from "./lib/cartStorage";
import LoadingIndicator from "./lib/loadingIndicator";
import CartUpdater from "./lib/cartUpdater";
import ActionProgressWrapper from "./lib/actionProgressWrapper";
import CartUpdateListBuilder from "./lib/cartUpdateListBuilder";
import RimiStateLoader from "./lib/rimiStateLoader";

import stylesheet from './static/style.css'
import cartSVG from './static/cart.svg'

if (typeof DONT_EXECUTE_USERSCRIPT === 'undefined' || DONT_EXECUTE_USERSCRIPT === false) {
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
        refreshCart();
    });

    injectCSS(document, stylesheet);

    if (rimiDOM.isInSavedCart()) {
        createSaveCartButton();
    } else {
        createCartAppendButtons(cartSVG);
    }

    function refreshCart() {
        window.location = `https://www.rimi.lv/e-veikals/${rimiState.getLanguage()}/checkout/refresh`;
    }

    function createCartAppendButtons(buttonContents) {
        let cartElements = document.querySelectorAll("button[name='cart']:not(.js-new-cart)");

        Array.from(cartElements)
            .filter(x => cartStorage.isCartStored(x.value))
            .forEach(cartButtonElement => {
                let smartBasketAdd = document.createElement('span');
                smartBasketAdd.innerHTML = buttonContents;
                smartBasketAdd.className = 'smart-basket-add';

                smartBasketAdd.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.preventDefault();

                    let productsToUpdate = updateListBuilder.getProductsToUpdate(
                        cartStorage.getStoredCart(cartButtonElement.value).products,
                        rimiDOM.getCurrentCart().products
                    );

                    cartUpdater.doAction(productsToUpdate);
                });

                cartButtonElement.append(smartBasketAdd);
            });
    }

    function createSaveCartButton() {
        let el = document.createElement('button');
        el.innerText = 'Save in "Smart Baskets"';
        el.className = 'link-button smart-basket-save-button';
        el.addEventListener('click', () => {
            cartStorage.storeCart(rimiDOM.getCurrentCart());
        });

        const headingEl = document.querySelector('.cart__header > h3.cart__heading');
        headingEl.parentNode.insertBefore(el, headingEl.nextSibling)
    }

    function injectCSS(document, stylesheet) {
        let css = document.createElement('style');
        css.textContent = stylesheet;
        document.head.append(css);
    }
}
