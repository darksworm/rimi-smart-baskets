// ==UserScript==
// @name         Rimi Smart Baskets
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @updateURL    https://raw.githubusercontent.com/darksworm/rimi-smart-baskets/main/index.js
// @description  try to take over the world!
// @author       darksworm
// @match        https://www.rimi.lv/e-veikals/*/checkout/cart
// @require      https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js
// @grant        none
// @run-at       document-end
// ==/UserScript==
"use strict";

class RimiDOM {
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

class RimiAPI {
    constructor(token, csrfToken, axios) {
        if (typeof token === 'undefined' || typeof csrfToken === 'undefined' || typeof axios === 'undefined') {
            throw new Error('please pass the token and xsrfToken and axios');
        }

        this.token = token;
        this.csrfToken = csrfToken;
        this.axios = axios;
    }

    async updateProduct(productId, amount = 1, step = 1) {
        return this.axios.put(
            this._getProductChangeURL(),
            this._getProductPutData(productId, amount, step),
            this._getAxiosConfig()
        );
    }

    _getProductChangeURL() {
        return "https://www.rimi.lv/e-veikals/cart/change";
    }

    _getProductPutData(productId, amount, step) {
        return {
            "_method": "put",
            "_token": this.token,
            "amount": amount,
            "step": step,
            "product": productId
        };
    }

    _getAxiosConfig() {
        return {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'x-csrf-token': this.csrfToken
            }
        }
    }
}

class CartStorage {
    constructor(storage) {
        if (typeof storage === 'undefined') {
            throw new Error('please pass the storage param to the constructor');
        }
        if (typeof storage.setItem !== 'function' || typeof storage.getItem !== 'function') {
            throw new Error('storage should have setItem and getItem methods');
        }

        this.storage = storage;
    }

    isCartStored(id) {
        try {
            this.getStoredCart(id);
        } catch {
            return false;
        }

        return true;
    }

    getStoredCart(id) {
        let carts = this.getAllStoredCarts();

        if (typeof carts[id] === 'undefined') {
            let error = new Error('the requested cart is not stored!');
            error.code = "CART_NOT_STORED";
            throw error;
        }

        return carts[id];
    }

    getAllStoredCarts() {
        let carts = this.storage.getItem('carts');
        if (typeof carts === 'undefined' || carts === null) {
            return {};
        }
        return this._decodeCarts(carts);
    }

    storeCart(cart) {
        let storedCarts = this.getAllStoredCarts();
        storedCarts[cart.id] = cart;
        this.storage.setItem('carts', this._encodeCarts(storedCarts));
    }

    _encodeCarts(carts) {
        return JSON.stringify(carts);
    }

    _decodeCarts(rawCarts) {
        try {
            return JSON.parse(rawCarts);
        } catch (e) {
            throw new Error('cannot parse saved carts');
        }
    }
}

class LoadingIndicator {
    constructor(document, elementId) {
        this.document = document;
        this.elementId = elementId || 'smart-basket-loader';
    }

    _removeExistingIndicator() {
        let container = this.document.getElementById(this.elementId);
        if (container) {
            container.remove();
        }
    }

    _createIndicator() {
        let container = this.document.createElement('div');
        container.id = this.elementId;
        container.className = 'loader-container';
        container.innerHTML = '<div id="loader-text"></div><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
        return container;
    }

    show() {
        this._removeExistingIndicator();
        let indicator = this._createIndicator();
        this.document.body.appendChild(indicator);
    }

    updateText(text) {
        this.document.getElementById('loader-text').innerHTML = text;
    }
}

class CartUpdater {
    constructor(rimiAPI, loadingIndicator, window) {
        this.rimiAPI = rimiAPI;
        this.loadingIndicator = loadingIndicator;
        this.window = window;
    }

    async appendProducts(productsToAdd, productsAlreadyAdded) {
        let products = this._getProductsToUpdate(productsToAdd, productsAlreadyAdded);
        await this._updateProducts(products);
        this._refreshCart();
    }

    async _updateProducts(products) {
        this.loadingIndicator.show();

        for (const [index, product] of products.entries()) {
            this.loadingIndicator.updateText(`Adding product ${index + 1} / ${products.length}`);
            await this.rimiAPI.updateProduct(product.id, product.hiddenAmount, 0)
        }
    }

    _getCartRefreshURL() {
        let parts = this.window.location.href.split('/');
        parts.pop();
        return parts.join('/') + '/refresh';
    }

    _getProductsToUpdate(productsToAdd, productsAlreadyAdded) {
        let appendProducts = JSON.parse(JSON.stringify(productsToAdd));

        for (let alreadyAdded of productsAlreadyAdded) {
            for (let stored of appendProducts) {
                if (alreadyAdded.id === stored.id) {
                    stored.hiddenAmount = (+stored.hiddenAmount) + (+alreadyAdded.hiddenAmount);
                }
            }
        }

        return appendProducts;
    }

    _refreshCart() {
        this.loadingIndicator.updateText(`Refreshing cart`);
        this.window.location = this._getCartRefreshURL()
    }
}

if (typeof DONT_EXECUTE_USERSCRIPT === 'undefined' || DONT_EXECUTE_USERSCRIPT === false) {
    let rimiDOM = new RimiDOM(window);
    let rimiAPI = new RimiAPI(getToken(document), getCSRFToken(document), axios);
    let cartStorage = new CartStorage(localStorage);
    let loadingIndicator = new LoadingIndicator(document);
    let cartUpdater = new CartUpdater(rimiAPI, loadingIndicator, window);

    injectCSS(document);

    if (rimiDOM.isInSavedCart()) {
        createSaveCartButton();
    } else {
        createCartAppendButtons();
    }

    function getToken(document) {
        return document.querySelector("input[name='_token']").value;
    }

    function getCSRFToken(document) {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
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

                    cartUpdater.appendProducts(
                        cartStorage.getStoredCart(cartButtonElement.value).products,
                        rimiDOM.getCurrentCart().products
                    );
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

if (typeof module !== 'undefined') {
    module.exports = {RimiDOM, RimiAPI, CartStorage, LoadingIndicator, CartUpdater};
}
