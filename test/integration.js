const chai = require('chai')
const fs = require('fs')
const {JSDOM} = require('jsdom')
require('mock-local-storage')
const axios = require("axios");
const AxiosMockAdapter = require("axios-mock-adapter")
const {asyncTasks} = require('await-async-task')

before(function () {
    global.axiosMock = new AxiosMockAdapter(axios);
    global.axios = axios;
    global.DONT_EXECUTE_USERSCRIPT = false
})

function setupDOM(htmlPath) {
    const mockCartHTML = fs.readFileSync(htmlPath, 'utf-8')
    const dom = new JSDOM(mockCartHTML, {
        'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
    })

    global.document = dom.window.document
    global.window = dom.window
    global.window.localStorage = global.localStorage

    global.axiosMock.resetHandlers()
    global.axiosMock.resetHistory()

    const userscriptJS = fs.readFileSync('index.js', 'utf-8')
    global.window.eval(userscriptJS)
}

function setupMockCarts() {
    let carts = {
        '13371337': {
            id: '13371337',
            name: 'dankmemes',
            products: [{
                "id": "227060",
                "name": "Skābais krējums Exporta 25% 360g",
                "category": "SH-11-4-12/SH-11-4/SH-11/SH",
                "brand": "Baltais",
                "price": 1.27,
                "currency": "EUR",
                "quantity": 1,
                "hiddenAmount": "1",
                "hiddenStep": "1"
            }, {
                "id": "210673",
                "name": "Pilnpiena biezpiens Talsu 9% 300g",
                "category": "SH-11-1-1/SH-11-1/SH-11/SH",
                "brand": "Talsu",
                "price": 1.32,
                "currency": "EUR",
                "quantity": 1,
                "hiddenAmount": "1",
                "hiddenStep": "1"
            }, {
                "id": "223984",
                "name": "Sviests Exporta 82,5% 200g",
                "category": "SH-11-7-17/SH-11-7/SH-11/SH",
                "brand": "Baltais Exporta",
                "price": 2.15,
                "currency": "EUR",
                "quantity": 1,
                "hiddenAmount": "1",
                "hiddenStep": "1"
            }]
        }
    };

    localStorage.clear()
    localStorage.setItem('carts', JSON.stringify(carts));

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
        localStorage.clear()
        setupDOM('test/rimi-cart-saved-cart-opened.html')
    })

    it('shouldn\'t write to localStorage on inject', function () {
        chai.assert.isEmpty(localStorage);
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
        chai.assert.isNotEmpty(localStorage.carts);
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

describe('DOM with empty basket', function () {
    function getCartBtn() {
        return document.querySelector('.saved-cart-popup button[name="cart"]');
    }

    function getCartAppendBtn() {
        return getCartBtn().children[0];
    }

    beforeEach(function () {
        setupMockCarts();
        setupDOM('test/rimi-cart-empty.html')
        axiosMock
            .onPut("https://www.rimi.lv/e-veikals/cart/change")
            .reply(200, {})
    })

    it('should send a request for each product when appending a stored cart', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        chai.expect(axiosMock.history.put.length).to.equal(3);
    })

    it('should send requests which match rimi API format', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        for (let request of axiosMock.history.put) {
            let data = JSON.parse(request.data);
            chai.assert.hasAllKeys(data, ['_method', '_token', 'amount', 'step', 'product'])
        }
    })

    it('should use the correct CSRF token', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        for (let request of axiosMock.history.put) {
            let data = JSON.parse(request.data);
            chai.assert.equal(data["_token"], "redacted");
            chai.assert.equal(request.headers["x-csrf-token"], "redacted");
        }
    })

    it('doesn\'t die when append cart button is spammed', async function () {
        let clickCount = 25;
        for (let i = 0; i < clickCount; i++) {
            getCartAppendBtn().click();
        }
        await asyncTasks();

        chai.expect(axiosMock.history.put.length).to.equal(3 * clickCount);
    })
})

describe('DOM with new basket with same items as mock', function () {
    function getCartBtn() {
        return document.querySelector('.saved-cart-popup button[name="cart"]');
    }

    function getCartAppendBtn() {
        return getCartBtn().children[0];
    }

    beforeEach(function () {
        setupMockCarts();
        setupDOM('test/rimi-cart-new.html')
        axiosMock
            .onPut("https://www.rimi.lv/e-veikals/cart/change")
            .reply(200, {})
    })

    it('should request 2 of all products because one already in the basket', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        for (let request of axiosMock.history.put) {
            let data = JSON.parse(request.data);
            chai.assert.equal(data.amount, 2);
        }
    })
})
