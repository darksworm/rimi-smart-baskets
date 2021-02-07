import {expect} from "chai";
import {before, beforeEach, describe, it} from "mocha";

import {JSDOM} from "jsdom";
import axios from "axios";
import {Notyf} from "notyf";
import sweetalert2 from "sweetalert2";

import fs from "fs";
import {asyncTasks} from "await-async-task";

import AxiosMockAdapter from "axios-mock-adapter";
import 'mock-local-storage';

const script = fs.readFileSync('dist/userscript.js', 'utf-8');

before(function () {
    global.axiosMock = new AxiosMockAdapter(axios);
    global.axios = axios;
    global.Notyf = Notyf;
    global.Swal = sweetalert2;
});

beforeEach(function () {
    global.axiosMock.resetHandlers();
    global.axiosMock.resetHistory();
    global.localStorage.clear();
});

function setupDOM(htmlPath) {
    const mockCartHTML = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(mockCartHTML, {
        'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
    });

    global.document = dom.window.document;
    global.window = dom.window;

    global.window.scrollTo = () => {
    };
    Object.defineProperty(global.window, 'localStorage', {
        value: global.localStorage,
        configurable: true,
        enumerable: true,
        writable: true
    });

    delete global.window.location;

    Object.defineProperty(global.window, 'location', {
        value: { href: 'https://www.rimi.lv/e-veikals/lv/checkout/cart' },
        configurable: true,
        enumerable: true,
        writable: true
    });

    global.Element = window.Element;
    global.HTMLElement = window.HTMLElement;
    global.DOMParser = window.DOMParser;
    global.navigator = {};

    global.window.eval(script)
}

function getMockCarts() {
    return {
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
        },
        '1101456706': {
            id: '1101456706',
            name: 'KETO-CHILLI',
            products: [
                {
                    "id": "227060",
                    "name": "Skābais krējums Exporta 25% 360g",
                    "category": "SH-11-4-12/SH-11-4/SH-11/SH",
                    "brand": "Baltais",
                    "price": 1.27,
                    "currency": "EUR",
                    "quantity": 1,
                    "hiddenAmount": "1",
                    "hiddenStep": "1"
                }
            ]
        }
    };
}

function setupMockCarts() {
    let carts = getMockCarts();
    localStorage.setItem('carts', JSON.stringify(carts));
}

function getMissingProductWarningElement() {
    return document.querySelector('.smart-basket-missing-product-warning');
}

describe('DOM with opened saved basket which is not stored', function () {
    function getCarts() {
        return JSON.parse(global.localStorage.carts);
    }

    function saveCurrentCart() {
        document.querySelector('.smart-basket-save-button').click();
    }

    function getFirstCart() {
        let carts = getCarts();
        let firstCartKey = Object.keys(carts)[0];
        return carts[firstCartKey];
    }

    beforeEach(function () {
        setupDOM('test/rimi-cart-saved-cart-opened.html')
    });

    it('shouldn\'t write to localStorage on inject', function () {
        expect(localStorage).to.be.empty;
    });

    it('should contain `Save cart in "Smart Baskets"` button', function () {
        let allButtons = document.getElementsByTagName("button");
        let saveButton = Array.from(allButtons)
            .find(function (el) {
                return el.innerText === "Save cart in \"Smart Baskets\""
            });
        expect(saveButton).to.exist;
    });

    it('cart buttons in selector should not contain children', function () {
        let cartButtons = document.querySelectorAll(".saved-cart-popup > li > button:not(.js-new-cart)");
        for (let button of cartButtons) {
            expect(button.children.length).to.equal(0);
        }
    });

    it('should create record in localstorage when save button clicked', function () {
        saveCurrentCart();
        expect(localStorage.carts).to.not.be.empty;
    });

    it('should store correct product count when save button clicked', function () {
        saveCurrentCart();

        let firstCartProductCount = getFirstCart().products.length;
        let DOMProductCount = document.querySelectorAll(".js-product-container.in-cart").length;

        expect(DOMProductCount).to.equal(firstCartProductCount);
    });

    it('should store the cart indexed by a number when save button clicked', function () {
        saveCurrentCart();
        let cartIndexes = Object.keys(getCarts());
        for (let index of cartIndexes) {
            expect(index).to.equal((+index).toString());
        }
    });

    it('should change product count if cart saved, then a product is removed, then saved again', function () {
        saveCurrentCart();
        let initialCartProductCount = getFirstCart().products.length;

        let productsInCart = window.document.querySelectorAll(".js-product-container.in-cart");
        let productToRemoveIndex = Math.floor(Math.random() * productsInCart.length);
        productsInCart[productToRemoveIndex].remove();

        saveCurrentCart();

        let afterCartProductCount = getFirstCart().products.length;

        expect(afterCartProductCount).to.equal(initialCartProductCount - 1);
    });

    describe('after saving cart', function () {
        beforeEach(async function () {
            setupDOM('test/rimi-cart-saved-cart-opened.html');
            saveCurrentCart();
        });

        function getSuccessMessageElement() {
            return document.querySelector(".rimi-smart-basket-notification.success");
        }

        it('should display a success message when cart saved', async function () {
            let successMessage = getSuccessMessageElement();
            expect(successMessage).to.exist;
        });

        it('displayed success message should contain the saved baskets name', function () {
            let successMessage = getSuccessMessageElement().textContent;
            expect(successMessage).to.include('KETO-CHILLI');
        });

        it('displayed success message should have a greenish backdrop', function () {
            let successMessage = getSuccessMessageElement().children[1];
            let color = successMessage.style.background;
            let rgb = color.substring(4, color.length - 1)
                .replace(/ /g, '')
                .split(',');
            expect(+rgb[1], 'green should be greater than red').to.be.above(+rgb[0]);
            expect(+rgb[1], 'green should be greater than blue').to.be.above(+rgb[2]);
        })
    })
});

describe('DOM with empty basket', function () {
    function getCartBtn() {
        return document.querySelector('.saved-cart-popup button[name="cart"]');
    }

    function getCartAppendBtn() {
        return getCartBtn().children[0];
    }

    function mockCartChangeEndpoint() {
        axiosMock
            .onPut("https://www.rimi.lv/e-veikals/cart/change")
            .reply(200, {})
    }

    beforeEach(function () {
        setupMockCarts();
        setupDOM('test/rimi-cart-empty.html');
        mockCartChangeEndpoint();
    });

    it('should send a request for each product when appending a stored cart', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        expect(axiosMock.history.put.length).to.equal(3);
    });

    it('should send requests which match rimi API format', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        for (let request of axiosMock.history.put) {
            let data = JSON.parse(request.data);
            expect(data).to.have.keys(['_method', '_token', 'amount', 'step', 'product']);
        }
    });

    it('should use the correct CSRF token', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        for (let request of axiosMock.history.put) {
            let data = JSON.parse(request.data);
            expect(data["_token"]).to.equal("redacted");
            expect(request.headers["x-csrf-token"]).to.equal("redacted");
        }
    });

    it('doesn\'t die when append cart button is spammed', async function () {
        let clickCount = 25;
        for (let i = 0; i < clickCount; i++) {
            getCartAppendBtn().click();
        }
        await asyncTasks();

        expect(axiosMock.history.put.length).to.equal(3 * clickCount);
    });

    it('should not create a missing product warning popup', function () {
        expect(getMissingProductWarningElement()).to.be.a('null');
    });

    describe('when added saved cart products do not appear in opened cart', async function () {
        beforeEach(async function () {
            setupMockCarts();
            setupDOM('test/rimi-cart-empty.html');
            mockCartChangeEndpoint();
            getCartAppendBtn().click();
            await asyncTasks();
            fakeRefresh();
        });

        function fakeRefresh() {
            setupDOM('test/rimi-cart-empty.html');
        }

        function getAddedCartProducts() {
            let carts = getMockCarts();
            return Array.from(carts['13371337'].products);
        }

        function getWarningPopupOKButton() {
            return document.querySelector('.smart-basket-accept');
        }

        it('should create a warning popup', async function () {
            expect(getMissingProductWarningElement()).to.not.be.a('null');
        });

        it('the displayed warning popup should contain word fail', function () {
            let warningPopupContents = getMissingProductWarningElement().textContent;
            expect(warningPopupContents.toLowerCase()).to.include('fail');
        });

        it('the displayed warning popup should contain names of all the missing products', function () {
            let warningPopupContents = getMissingProductWarningElement().textContent;
            let missingProductNames = getAddedCartProducts().map(x => x.name);
            expect(missingProductNames.every(x => warningPopupContents.includes(x))).to.be.true;
        });

        it('the displayed warning popup should close when OK button clicked', function () {
            getWarningPopupOKButton().click();
            expect(getMissingProductWarningElement()).to.be.a('null');
        });

        it('after another refresh, the popup should not appear', function () {
            fakeRefresh();
            expect(getMissingProductWarningElement()).to.be.a('null');
        });
    });
});

describe('DOM with opened saved basket that is already stored', function () {
    function saveCurrentCart() {
        document.querySelector('.smart-basket-save-button').click();
    }

    function getSuccessMessageElement() {
        return document.querySelector(".rimi-smart-basket-notification.success");
    }

    beforeEach(function () {
        setupMockCarts();
        setupDOM('test/rimi-cart-saved-cart-opened.html')
    });

    it('should display smart basket add button with update caption', function () {
        const btnText = document.querySelector('.smart-basket-save-button').innerText;
        expect(btnText).to.equal('Update cart in "Smart Baskets"');
    });

    it('should display a success message when cart saved', function () {
        saveCurrentCart();
        let successMessage = getSuccessMessageElement();
        expect(successMessage).to.not.be.a('null');
    });

    it('displayed success message should contain the saved baskets name', function () {
        saveCurrentCart();
        let successMessage = getSuccessMessageElement().textContent;
        expect(successMessage).to.include('KETO-CHILLI');
    });

    it('displayed success message should contain the word "updated"', function () {
        saveCurrentCart();
        let successMessage = getSuccessMessageElement().textContent;
        expect(successMessage.toLowerCase()).to.include("updated");
    })
});

describe('DOM with new basket with same items as mock', function () {
    function getCartBtn() {
        return document.querySelector('.saved-cart-popup button[name="cart"]');
    }

    function getCartAppendBtn() {
        return getCartBtn().children[0];
    }

    beforeEach(function () {
        setupMockCarts();
        setupDOM('test/rimi-cart-new.html');
        axiosMock
            .onPut("https://www.rimi.lv/e-veikals/cart/change")
            .reply(200, {})
    });

    it('should request 2 of all products because one already in the basket', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        for (let request of axiosMock.history.put) {
            let data = JSON.parse(request.data);
            expect(data.amount).to.equal(2);
        }
    });

    it('should ask for confirmation when trying to open another cart', function () {
        let otherCartBtn = document.querySelector(".saved-cart-popup > li > button");
        otherCartBtn.click();
        let confirmBox = document.querySelector(".smart-basket-confirm-action");
        expect(confirmBox).to.not.be.a('null');
    });

    it('should create a missing product warning popup if failed to add products', async function () {
        getCartAppendBtn().click();
        await asyncTasks();

        setupDOM('test/rimi-cart-new.html');
        expect(getMissingProductWarningElement()).to.not.be.a('null');
    });
});

describe('DOM with new basket which is not empty and is not in local or rimi storage', function () {
    let clickSpyCaughtClick = false;

    beforeEach(function () {
        setupDOM('test/rimi-cart-new.html');
        getSavedCartButton().click();
        clickSpyCaughtClick = false;
    });

    function addClickSpy() {
        getSavedCartButton().addEventListener('click', function (event) {
            event.preventDefault();
            clickSpyCaughtClick = true;
        });
    }

    function getSavedCartButton() {
        return document.querySelector(".saved-cart-popup > li > button");
    }

    function getOtherSavedCartButton() {
        return document.querySelector(".saved-cart-popup > li:nth-child(2) > button");
    }

    function getAcceptButton() {
        return document.querySelector('.smart-basket-accept');
    }

    function getCancelButton() {
        return document.querySelector('.smart-basket-cancel');
    }

    function getConfirmBox() {
        return document.querySelector(".smart-basket-confirm-action");
    }

    it('should ask for confirmation when trying to open another cart', async function () {
        expect(getConfirmBox()).to.not.be.a('null');
    });

    it('confirmation box should disappear when cancelled', function () {
        getCancelButton().click();
        expect(getConfirmBox()).to.be.a('null');
    });

    it('should ask for confirmation when trying to open another cart after previous attempt was cancelled', async function () {
        getCancelButton().click();
        await asyncTasks();
        getSavedCartButton().click();
        await asyncTasks();

        expect(getConfirmBox()).to.not.be.a('null');
    });

    it('confirmation box should appear when cancelled and different cart button clicked', async function () {
        getCancelButton().click();
        await asyncTasks();
        getOtherSavedCartButton().click();
        await asyncTasks();

        expect(getConfirmBox()).to.not.be.a('null');
    });

    it('should not reclick the button when cancelled', async function () {
        addClickSpy();
        getCancelButton().click();
        await asyncTasks();

        expect(clickSpyCaughtClick).to.equal(false);
    });

    it('should reclick the button when confirmation is given', async function () {
        addClickSpy();
        getAcceptButton().click();
        await asyncTasks();

        expect(clickSpyCaughtClick).to.equal(true);
    });

    it('should not redirect to login page', function () {
        expect(window.location.href).to.not.include('/e-veikals/account/login');
    });
});

describe('opened empty cart when not logged in', function () {
    beforeEach('setup DOM', function () {
        setupDOM('test/rimi-cart-not-logged-in.html');
    });

    it('should redirect to login page', function () {
        expect(window.location.href).to.include('/e-veikals/account/login');
    })
});
