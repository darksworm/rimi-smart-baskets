"use strict";

import RimiDOM from './lib/rimiDOM'
import RimiAPI from "./lib/rimiAPI";
import CartStorage from "./lib/cartStorage";
import LoadingIndicator from "./lib/loadingIndicator";
import CartUpdater from "./lib/cartUpdater";
import ActionProgressWrapper from "./lib/actionProgressWrapper";
import CartUpdateListBuilder from "./lib/cartUpdateListBuilder";
import RimiStateLoader from "./lib/rimiStateLoader";

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

    injectCSS(document);

    if (rimiDOM.isInSavedCart()) {
        createSaveCartButton();
    } else {
        createCartAppendButtons();
    }

    function refreshCart() {
        window.location = `https://www.rimi.lv/e-veikals/${rimiState.getLanguage()}/checkout/refresh`;
    }

    function createCartAppendButtons() {
        const cartAddSVG = '<svg enable-background="new 0 0 511.998 511.998" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m177.46 374.41c-34.713 0-62.951 28.238-62.951 62.951s28.238 62.951 62.951 62.951 62.951-28.238 62.951-62.951-28.238-62.951-62.951-62.951zm0 89.929c-14.874 0-26.979-12.105-26.979-26.979s12.105-26.979 26.979-26.979c14.88 0 26.979 12.105 26.979 26.979s-12.104 26.979-26.979 26.979z"/><path d="m378.9 374.41c-34.713 0-62.951 28.238-62.951 62.951s28.238 62.951 62.951 62.951 62.951-28.238 62.951-62.951-28.238-62.951-62.951-62.951zm0 89.929c-14.874 0-26.979-12.105-26.979-26.979s12.105-26.979 26.979-26.979c14.88 0 26.979 12.105 26.979 26.979s-12.105 26.979-26.979 26.979z"/><path d="m508.18 134.91c-3.405-4.359-8.633-6.907-14.167-6.907h-86.333c-9.934 0-17.986 8.052-17.986 17.986s8.052 17.986 17.986 17.986h63.341l-36.032 145.09h-290.96l-31.226-145.09h62.863v-35.972h-70.605l-17.328-80.517c-1.787-8.286-9.107-14.203-17.584-14.203h-52.159c-9.934 0-17.986 8.052-17.986 17.986s8.052 17.986 17.986 17.986h37.633l56.296 261.58c1.787 8.286 9.107 14.203 17.584 14.203h319.55c8.262 0 15.462-5.636 17.452-13.651l44.965-181.05c1.337-5.372 0.12-11.056-3.285-15.414z"/><path d="m291.37 11.69c-73.389 0-133.1 59.707-133.1 133.1s59.707 133.1 133.1 133.1 133.1-59.707 133.1-133.1-59.707-133.1-133.1-133.1zm0 230.22c-53.556 0-97.124-43.574-97.124-97.124s43.568-97.124 97.124-97.124c53.55 0 97.124 43.574 97.124 97.124 1e-3 53.55-43.567 97.124-97.124 97.124z"/><path d="m291.37 89.03c-9.934 0-17.986 8.052-17.986 17.986v75.541c0 9.934 8.052 17.986 17.986 17.986s17.986-8.052 17.986-17.986v-75.541c0-9.935-8.051-17.986-17.986-17.986z"/><path d="m328.54 126.8h-74.941c-9.934 0-17.986 8.052-17.986 17.986s8.052 17.986 17.986 17.986h74.941c9.934 0 17.986-8.052 17.986-17.986s-8.051-17.986-17.986-17.986z"/></svg>';

        let cartElements = document.querySelectorAll("button[name='cart']:not(.js-new-cart)");

        Array.from(cartElements)
            .filter(x => cartStorage.isCartStored(x.value))
            .forEach(cartButtonElement => {
                let smartBasketAdd = document.createElement('span');
                smartBasketAdd.innerHTML = cartAddSVG;
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

    function injectCSS(document) {
        let css = document.createElement('style');

        css.textContent = `
            .smart-basket-save-button {
                margin-right: 20px; 
                font-size: 14px; 
                line-height: 14px;
            }
            .smart-basket-add {
                color: #363d40;
                display: inline-flex;
                transform: scale(1.1);
                transition: transform 0.2s;
                padding: 4px;
            }
            .smart-basket-add:hover {
                transform: scale(1.3);
            }
            .loader-container {
                position: absolute;
                top: 0;
                left: 0;
                display: block;
                width: 100%;
                height: 100%;
                color: black;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                backdrop-filter: blur(5px);
            }
            .loader-text {
                font-size: 13px;
                color: #363d40;
            }
            .lds-ellipsis {
                display: inline-block;
                position: relative;
                width: 80px;
                height: 30px;
            }
            .lds-ellipsis div {
                position: absolute;
                top: 9px;
                width: 13px;
                height: 13px;
                border-radius: 50%;
                background: #a12971;
                animation-timing-function: cubic-bezier(0, 1, 1, 0);
            }
            .lds-ellipsis div:nth-child(1) {
                left: 8px;
                animation: lds-ellipsis1 0.6s infinite;
            }
            .lds-ellipsis div:nth-child(2) {
                left: 8px;
                animation: lds-ellipsis2 0.6s infinite;
            }
            .lds-ellipsis div:nth-child(3) {
                left: 32px;
                animation: lds-ellipsis2 0.6s infinite;
            }
            .lds-ellipsis div:nth-child(4) {
                left: 56px;
                animation: lds-ellipsis3 0.6s infinite;
            }
            @keyframes lds-ellipsis1 {
                0% {
                    transform: scale(0);
                }
                100% {
                    transform: scale(1);
                }
            }
            @keyframes lds-ellipsis3 {
                0% {
                    transform: scale(1);
                }
                100% {
                    transform: scale(0);
                }
            }
            @keyframes lds-ellipsis2 {
                0% {
                    transform: translate(0, 0);
                }
                100% {
                    transform: translate(24px, 0);
                }
            }
        `;
        document.head.append(css);
    }
}
