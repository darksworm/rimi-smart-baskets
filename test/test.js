const chai = require('chai')
const fs = require('fs')
const {JSDOM, VirtualConsole} = require('jsdom')
require('mock-local-storage')

function setupDOM(htmlPath) {
    const mockCartHTML = fs.readFileSync(htmlPath, 'utf-8')

    const mockConsole = new VirtualConsole();
    const dom = new JSDOM(mockCartHTML, {
        'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart',
        mockConsole
    })

    global.document = dom.window.document
    global.window = dom.window
    global.window.localStorage = global.localStorage

    const userscriptJS = fs.readFileSync('index.js', 'utf-8')
    global.window.eval(userscriptJS)
}

describe('DOM with opened saved basket', function () {
    function getCarts() {
        return JSON.parse(global.localStorage.carts);
    }

    function saveCurrentCart() {
        let allButtons = document.getElementsByTagName("button")
        let saveButton = Array.from(allButtons)
            .find(function (el) {
                return el.innerText === "Save in \"Smart Baskets\""
            });

        saveButton.click();
    }

    function getFirstCart() {
        let carts = getCarts();
        let firstCartKey = Object.keys(carts)[0];
        return carts[firstCartKey];
    }

    beforeEach(function () {
        setupDOM('test/rimi-cart-saved-cart-opened.html')
    })

    it('shouldn\'t alter localStorage on inject', function () {
        chai.assert.isEmpty(global.localStorage);
    });

    it('should contain `Save in "Smart Baskets"` button', function () {
        let allButtons = document.getElementsByTagName("button")
        let saveButton = Array.from(allButtons)
            .find(function (el) {
                return el.innerText === "Save in \"Smart Baskets\""
            })
        chai.assert.exists(saveButton)
    })

    it('cart buttons in selector should not contain children', function () {
        let cartButtons = document.querySelectorAll(".saved-cart-popup > li > button:not(.js-new-cart)")
        for (let button of cartButtons) {
            chai.assert.equal(0, button.children.length);
        }
    })

    it('should create record in localstorage when save button clicked', function () {
        saveCurrentCart();
        chai.assert.isNotEmpty(global.localStorage.carts);
    });

    it('should store correct product count when save button clicked', function () {
        saveCurrentCart();

        let firstCartProductCount = getFirstCart().products.length;
        let DOMProductCount = document.querySelectorAll(".js-product-container.in-cart").length;

        chai.assert.equal(DOMProductCount, firstCartProductCount);
    })

    it('should store the cart indexed by a number when save button clicked', function () {
        saveCurrentCart();
        let cartIndexes = Object.keys(getCarts());
        for (let index of cartIndexes) {
            chai.assert.notStrictEqual(index, +index);
        }
    })

    it('should change product count if cart saved, then a product is removed, then saved again', function () {
        saveCurrentCart();
        let initialCartProductCount = getFirstCart().products.length;

        let productsInCart = window.document.querySelectorAll(".js-product-container.in-cart");
        let productToRemoveIndex = Math.floor(Math.random() * productsInCart.length);
        productsInCart[productToRemoveIndex].remove();

        saveCurrentCart();

        let afterCartProductCount = getFirstCart().products.length;

        chai.assert.equal(afterCartProductCount, initialCartProductCount - 1);
    })
})
