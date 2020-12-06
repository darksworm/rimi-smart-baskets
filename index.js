// ==UserScript==
// @name         Rimi Smart Baskets
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       darksworm
// @match        https://www.rimi.lv/e-veikals/lv/checkout/cart
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const cartPageURL = "https://www.rimi.lv/e-veikals/lv/checkout/cart";
    const productChangeURL = "https://www.rimi.lv/e-veikals/cart/change";

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
        return document.getElementsByClassName("cart__heading")[0].textContent != "Pasūtījuma grozs";
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

    function addProductToCart(productId, amount = 1, step = 1)
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
            }
        );
    }

    function inject()
    {
        let css = document.createElement('style');
        css.textContent = `
            .lds-ripple {
              display: inline-block;
              position: relative;
              width: 300px;
              height: 300px;
            }
            .lds-ripple div {
              position: absolute;
              border: 4px solid red;
              opacity: 1;
              border-radius: 50%;
              animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            }
            .lds-ripple div:nth-child(2) {
              animation-delay: -0.5s;
            }
            @keyframes lds-ripple {
              0% {
                top: 143px;
                left: 143px;
                width: 0;
                height: 0;
                opacity: 1;
              }
              100% {
                top: 0px;
                left: 0px;
                width: 286px;
                height: 286px;
                opacity: 0;
              }
            }

            .custom-ext-loader {
                z-index: 999999;
                position: absolute;
                left:50%;
                top:50%;
                transform: translate(-50%, -50%);
                width: 300px;
                height: 300px;
            }
        `;

        document.head.append(css);

        let script = document.createElement('script');
        script.src= "https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js";
        document.body.appendChild(script);

        let cartElems = document.querySelectorAll("button[name='cart']");
        document.querySelectorAll('.remove-me-pls').remove();

        cartElems.forEach(e => {
            let id = e.value;

            if (id == "new") {
                return;
            }

            let el = document.createElement('button');

            el.textContent = "ADD";
            el.style = "background: red";
            el.type = "button";
            el.class = "remove-me-pls";

            el.addEventListener('click', (event) => {
                event.stopPropagation();
                let id = event
                    .target
                    .parentNode
                    .firstElementChild
                    .value;

                appendCartItemsToCart(id);
            });

            e.parentNode.appendChild(el);
        });
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

    function appendCartItemsToCart(storedCartId)
    {
        if (assertNotInSavedCart())
        {
            throw new Error('Please open a new cart');
        }

        loader();

        let currentProducts = getCartProducts();

        let products = getStoredCart(storedCartId).products;
        let promises = [];

        for (let inCart of currentProducts) {
            for (let add of products) {
                if (inCart.id != add.id) {
                    continue;
                }

                add.hiddenAmount = (+add.hiddenAmount) + (+inCart.hiddenAmount);
            }
        }

        for (let product of products)
        {
            promises.push(
                new Promise(
                    (resolve, reject) => {
                        addProductToCart(
                            product.id,
                            product.hiddenAmount,
0
                            //product.hiddenStep != 1 ? product.hiddenStep : 0
                        )
                        .then(resolve)
                        .catch(resolve);
                    }
                )
            );
        }

        Promise.all(promises).then(() => window.location.reload());
    }

    function loader()
    {
        document.querySelector('.cart').style.opacity = 0.2;
        let elem = document.createElement('div');
        elem.innerHTML = '<div class="lds-ripple custom-ext-loader"><div></div><div></div></div>';
        document.body.appendChild(elem);
    }

    inject();

    window.storeCurrentCart = storeCurrentCart;
    window.appendCartItemsToCart = appendCartItemsToCart;
    window.clearCart = clearCart;
    window.addLoader = loader;
})();
