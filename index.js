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

(function() {
    'use strict';

    const lang = document.querySelector('html').getAttribute('lang');

    const cartPageURL = `https://www.rimi.lv/e-veikals/${lang}/checkout/cart`;
    const cartRefreshURL = `https://www.rimi.lv/e-veikals/${lang}/checkout/refresh`;
    const productChangeURL = "https://www.rimi.lv/e-veikals/cart/change";
    const basketAddSVG = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 511.998 511.998" style="enable-background:new 0 0 511.998 511.998;" xml:space="preserve"><g><g><g><path d="M177.461,374.407c-34.713,0-62.951,28.238-62.951,62.951s28.238,62.951,62.951,62.951s62.951-28.238,62.951-62.951S212.174,374.407,177.461,374.407z M177.461,464.336c-14.874,0-26.979-12.105-26.979-26.979s12.105-26.979,26.979-26.979c14.88,0,26.979,12.105,26.979,26.979S192.336,464.336,177.461,464.336z"/><path d="M378.904,374.407c-34.713,0-62.951,28.238-62.951,62.951s28.238,62.951,62.951,62.951c34.713,0,62.951-28.238,62.951-62.951S413.617,374.407,378.904,374.407z M378.904,464.336c-14.874,0-26.979-12.105-26.979-26.979s12.105-26.979,26.979-26.979c14.88,0,26.979,12.105,26.979,26.979S393.778,464.336,378.904,464.336z"/><path d="M508.181,134.912c-3.405-4.359-8.633-6.907-14.167-6.907h-86.333c-9.934,0-17.986,8.052-17.986,17.986c0,9.934,8.052,17.986,17.986,17.986h63.341L434.99,309.064H144.025l-31.226-145.093h62.863v-35.972h-70.605L87.729,47.482c-1.787-8.286-9.107-14.203-17.584-14.203H17.986C8.052,33.279,0,41.331,0,51.265c0,9.934,8.052,17.986,17.986,17.986h37.633l56.296,261.576c1.787,8.286,9.107,14.203,17.584,14.203h319.55c8.262,0,15.462-5.636,17.452-13.651l44.965-181.053C512.803,144.954,511.586,139.27,508.181,134.912z"/></g></g></g><g><g><path d="M291.372,11.69c-73.389,0-133.096,59.707-133.096,133.096s59.707,133.096,133.096,133.096s133.096-59.707,133.096-133.096S364.761,11.69,291.372,11.69z M291.372,241.91c-53.556,0-97.124-43.574-97.124-97.124s43.568-97.124,97.124-97.124c53.55,0,97.124,43.574,97.124,97.124C388.497,198.336,344.929,241.91,291.372,241.91z"/></g></g><g><g><path d="M291.372,89.03c-9.934,0-17.986,8.052-17.986,17.986v75.541c0,9.934,8.052,17.986,17.986,17.986c9.934,0,17.986-8.052,17.986-17.986v-75.541C309.358,97.081,301.307,89.03,291.372,89.03z"/></g></g><g><g><path d="M328.543,126.8h-74.941c-9.934,0-17.986,8.052-17.986,17.986c0,9.934,8.052,17.986,17.986,17.986h74.941c9.934,0,17.986-8.052,17.986-17.986C346.529,134.852,338.478,126.8,328.543,126.8z"/></g></g></svg>';

    injectCSS();
    createCartAppendButtons();
    createSaveCartButton();

    function assertInCart()
    {
        if (window.location.href != cartPageURL) {
            throw new Error("cannot get carts here, expected to be in cart page");
        }
    }

    function getCurrentCart()
    {
        assertInCart();

        let allCarts = getCarts();
        let thisCartName = document.getElementsByClassName("cart__heading")[0].textContent;

        for (let otherCart of allCarts) {
            if (thisCartName == otherCart.name) {
                return otherCart;
            }
        }

        throw new Error('current cart name not found among cart-list');
    }

    function inSavedCart()
    {
        const yourCartText = ['Your cart', 'Pasūtījuma grozs', 'Корзина'];
        return !yourCartText.includes(document.getElementsByClassName("cart__heading")[0].textContent);
    }

    function assertNotInSavedCart()
    {
        if (inSavedCart())
        {
            throw new Error('Please open a new cart');
        }
    }

    function getCarts()
    {
        assertInCart();

        let carts = [];
        let cartElems = document.querySelectorAll(
            ".saved-cart-popup > li > button:not(.js-new-cart)"
        );

        for(let cartElem of cartElems) {
            carts.push({
                id: cartElem.value,
                name: cartElem.innerHTML
            });
        }

        return carts;
    }

    function getCartProducts()
    {
        assertInCart();

        let products = [];

        let productElems = document.querySelectorAll(
            ".js-product-container.in-cart"
        );

        for (let i in productElems) {
            if (!productElems.hasOwnProperty(i)) {
                continue;
            }

            let jsonData = productElems[i].dataset.gtmEecProduct;
            let data = JSON.parse(jsonData);

            data.hiddenAmount = productElems[i].querySelector('.js-counter input[name="amount"]').value;
            data.hiddenStep = productElems[i].querySelector('.js-counter input[name="step"]').value;

            products.push(data);
        }

        return products;
    }

    async function addProductToCart(productId, amount = 1, step = 1)
    {
        let token = document.querySelector("input[name='_token']").value;

        return axios.put(
            productChangeURL,
            {
                "_method": "put",
                "_token": token,
                "amount": amount,
                "step": step,
                "product": productId
            },
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'x-csrf-token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
            }
        );
    }

    function injectCSS()
    {
        let css = document.createElement('style');
        css.textContent = `
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
                top: 50%;
                left: 50%;
                display: block;
                transform: translate(-50%, -50%);
                width: 500px;
                color: black;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
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

    function storeCurrentCart()
    {
        let cart = getCurrentCart();
        let products = getCartProducts();
        cart.products = products;

        let savedCarts = {};

        try {
            savedCarts = JSON.parse(localStorage.carts);

            if (typeof savedCarts !== 'object' || savedCarts === null) {
                savedCarts = {};
            }
        } catch (e) {
            savedCarts = {};
        }

        savedCarts[cart.id] = cart;

        localStorage.carts = JSON.stringify(savedCarts);
    }

    function getStoredCart(id)
    {
        try {
            var data = JSON.parse(localStorage.carts);
        } catch (e) {
            throw new Error('cannot parse saved carts');
        }

        return data[id];
    }

    function clearCart()
    {
        if (assertNotInSavedCart())
        {
            throw new Error('Please open a new cart');
        }

        document.getElementsByClassName("cart-card__delete").forEach(e => e.click());
    }

    async function appendCartItemsToCart(storedCartId)
    {
        if (assertNotInSavedCart())
        {
            throw new Error('Please open a new cart');
        }

        loader();

        let currentProducts = getCartProducts();

        let products = getStoredCart(storedCartId).products;

        for (let inCart of currentProducts) {
            for (let add of products) {
                if (inCart.id != add.id) {
                    continue;
                }

                add.hiddenAmount = (+add.hiddenAmount) + (+inCart.hiddenAmount);
            }
        }

        let addingCounter = 1;

        for (let product of products)
        {
            updateLoaderText(`Adding product ${addingCounter} / ${products.length}`)

            await addProductToCart(
                product.id,
                product.hiddenAmount,
                0
                //product.hiddenStep != 1 ? product.hiddenStep : 0
            )

            addingCounter++
        }

        updateLoaderText(`Refreshing cart`)

        window.location = cartRefreshURL
    }

    function loader()
    {
        document.querySelector('.cart').style.opacity = 0.2;
        let elem = document.createElement('div');
        elem.className = 'loader-container';
        elem.innerHTML = '<div class="loader-text"></div><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
        document.body.appendChild(elem);
    }

    function updateLoaderText(string)
    {
        document.querySelector('.loader-text').innerText = string;
    }

    function createCartAppendButtons()
    {
        if (inSavedCart()) {
            return;
        }

        let cartElems = document.querySelectorAll("button[name='cart']");

        cartElems.forEach(cartBtnEl => {
            let id = cartBtnEl.value;

            if (id == "new") {
                return;
            }

            if (!getStoredCart(id)) return;

            let smartBasketAdd = document.createElement('span');

            smartBasketAdd.innerHTML = basketAddSVG;
            smartBasketAdd.className = 'smart-basket-add';

            smartBasketAdd.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                appendCartItemsToCart(id);
            });

            cartBtnEl.append(smartBasketAdd);
        });
    }

    function createSaveCartButton()
    {
        if (!inSavedCart()) {
            return;
        }

        let el = document.createElement('button');
        el.innerText = 'Save in "Smart Baskets"';
        el.className = 'link-button';
        el.style = 'margin-right: 20px; font-size: 14px; line-height: 14px;'
        el.addEventListener('click', (event) => {
            storeCurrentCart();
        });

        const headingEl = document.querySelector('.cart__header > h3.cart__heading')
        headingEl.parentNode.insertBefore(el, headingEl.nextSibling)
    }
})();
