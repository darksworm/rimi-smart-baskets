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

import rimiURLs from "../src/lib/rimi/rimiURLs";

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
        value: {href: 'https://www.rimi.lv/e-veikals/lv/checkout/cart'},
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
        '1101522953': {
            id: '1101522953',
            name: 'temp',
            products: [
                {
                    "id": "235436",
                    "name": "Sķidrās ziepes garnier",
                    "category": "yes",
                    "brand": "cits",
                    "price": 2.27,
                    "currency": "EUR",
                    "quantity": 1,
                    "hiddenAmount": "1",
                    "hiddenStep": "1"
                }
            ]
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

function setupMockCarts(carts) {
    carts = carts || getMockCarts();
    localStorage.setItem('carts', JSON.stringify(carts));
}

function getMissingProductWarningElement() {
    return document.querySelector('.smart-basket-missing-product-warning');
}

it('injects custom CSS elements', function () {
    setupDOM('test/rimi-cart-saved-cart-opened.html');
    let styleElements = document.querySelectorAll('.smart-baskets-style');
    expect(styleElements.length).to.be.greaterThan(0);
})

describe('DOM with opened saved basket which is not stored', function () {
    beforeEach(function () {
        setupDOM('test/rimi-cart-saved-cart-opened.html')
    });

    it('cart buttons in selector should not contain text other than cart name', function () {
        let cartButtons = document.querySelectorAll(".saved-cart-popup > li > button:not(.js-new-cart)");
        expect(cartButtons[0].textContent.trim()).to.equal('SLD-CHKN-PESTO');
        expect(cartButtons[1].textContent.trim()).to.equal('temp');
    });
});

describe('DOM with empty basket', function () {
    function getCartBtn() {
        return document.querySelector('.saved-cart-popup button[name="cart"]');
    }

    function getCartAppendBtn() {
        return getCartBtn().querySelector('.smart-basket-add');
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

    function fakeRefresh() {
        setupDOM('test/rimi-cart-empty.html');
    }

    describe('on reloading page', async function () {
        beforeEach(async function () {
            setupMockCarts();
            setupDOM('test/rimi-cart-empty.html');
            await asyncTasks();
            fakeRefresh();
            await asyncTasks();
        });

        it('should not create a warning popup', async function () {
            expect(getMissingProductWarningElement()).to.be.null;
        });
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

describe('automatic stored cart updater', function () {
    function getFirstCartProductsAsInDOM() {
        return getMockCarts()['13371337'].products;
    }

    function getFirstCartProducts() {
        return JSON.parse(localStorage.getItem('carts'))['13371337'].products;
    }

    describe('for cart which is not stored', function () {
        beforeEach(async function () {
            setupMockCarts({});
            setupDOM('test/rimi-cart-saved-cart-opened.html');
            await asyncTasks();
        })

        it('should create the cart in localStorage', function () {
            const cart = JSON.parse(localStorage.getItem('carts'))['13371337'];
            expect(cart).to.not.be.undefined;
            expect(cart.products).to.not.be.empty;
            expect(cart.name).to.equal('KETO-CHILLI');
            expect(cart.id).to.equal('13371337');
        })
    })

    describe('for an unchanged stored basket', function() {
        beforeEach(async function() {
            setupMockCarts();
            setupDOM('test/rimi-cart-saved-cart-opened.html');
        })

        describe('when first product is', function () {
            let HTML, parent, name;

            beforeEach(async function () {
                const elem = document.querySelector('.js-product-container');
                name = elem.dataset.gtmsClickName;
                parent = elem.parentElement;
                HTML = elem.outerHTML;

                elem.remove();
            })

            it('removed, it is also removed from stored cart', async function () {
                await asyncTasks();
                expect(getFirstCartProducts().map(x => x.name)).to.not.include(name);
            })

            it('added back, it is also added back to stored cart', async function () {
                const node = document.createElement('div');
                node.innerHTML = HTML;
                parent.appendChild(node.firstChild);

                await asyncTasks();
                expect(getFirstCartProducts().map(x => x.name)).to.include(name);
            })
        })

        it('should empty stored cart if all products removed', async function () {
            let elems = document.querySelectorAll('.js-product-container.in-cart');
            for (let elem of elems) {
                elem.remove();
            }
            await asyncTasks();
            expect(getFirstCartProducts().length).to.equal(0);
        })
    })

    describe('for stored basket but DOM contains different amount of products', function () {
        beforeEach(async function () {
            let carts = getMockCarts();
            carts['13371337'].products[0].hiddenAmount = 2;
            carts['13371337'].products[0].quantity = 2;
            setupMockCarts(carts);

            setupDOM('test/rimi-cart-saved-cart-opened.html')
        });

        it('shouldn\'t change unaltered products in storage', function () {
            const inDOM = getFirstCartProductsAsInDOM();
            const inStorage = getFirstCartProducts();

            delete inDOM[0];
            delete inStorage[0];

            expect(inStorage).to.deep.equal(inDOM);
        })

        it('should update the product whose quantity has changed', async function () {
            const products = getFirstCartProducts();
            expect(+products[0].hiddenAmount).to.equal(1);
            expect(+products[0].quantity).to.equal(1);
        })
    })
})

describe('DOM with new basket with same items as mock', function () {
    function getCartBtn(index) {
        return document.querySelectorAll('.saved-cart-popup button[name="cart"]')[index];
    }

    function getCartAppendBtn(index) {
        return getCartBtn(index).querySelector('.smart-basket-add');
    }

    function fakeRefresh() {
        setupDOM('test/rimi-cart-new.html');
    }

    beforeEach(function () {
        setupMockCarts();
        setupDOM('test/rimi-cart-new.html');

        axiosMock
            .onPut("https://www.rimi.lv/e-veikals/cart/change")
            .reply(200, {})
    });

    it('should send change requests with two as product amount', async function () {
        getCartAppendBtn(0).click();
        await asyncTasks();

        expect(axiosMock.history.put.length).to.equal(3);

        for (let request of axiosMock.history.put) {
            let data = JSON.parse(request.data);
            expect(data.amount).to.equal(2);
        }
    });

    it('shouldn\'t accent any products in basket if adding all failed', async function () {
        getCartAppendBtn(1).click();
        await asyncTasks();
        fakeRefresh();

        const addedProducts = document.querySelectorAll('.smart-basket-newly-added-product');
        expect(addedProducts.length).to.equal(0);
    });

    it('should accent all products in basket after adding them', async function () {
        getCartAppendBtn(0).click();
        await asyncTasks();
        fakeRefresh();

        const addedProducts = document.querySelectorAll('.smart-basket-newly-added-product');
        expect(addedProducts.length).to.equal(3);
    });

    describe('when trying to open another cart', function () {
        let cartButtonWasClickedProgrammatically;

        beforeEach(function () {
            let otherCartBtn = document.querySelector(".saved-cart-popup > li > button[name='cart']");
            otherCartBtn.click();

            cartButtonWasClickedProgrammatically = false;
            otherCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                cartButtonWasClickedProgrammatically = true;
            });
        })

        function getConfirmBox() {
            return document.querySelector(".smart-basket-confirm-action");
        }

        function getConfirmButton() {
            return getConfirmBox().querySelector('.smart-basket-accept');
        }

        function getDeclineButton() {
            return getConfirmBox().querySelector('.smart-basket-cancel');
        }

        it('should ask for cart abandonment confirmation', function () {
            expect(getConfirmBox()).to.not.be.a('null');
        });

        describe('after declining cart abandonment', function () {
            beforeEach(async function () {
                getDeclineButton().click();
                await asyncTasks();
            })

            it('should close prompt', async function () {
                expect(getConfirmBox()).to.be.a('null');
            })

            it('should not reclick the cart button', function () {
                expect(cartButtonWasClickedProgrammatically).to.equal(false);
            })
        })

        describe('after confirming cart abandonment', function () {
            beforeEach(async function () {
                getConfirmButton().click();
                await asyncTasks();
            })

            it('should close prompt', async function () {
                expect(getConfirmBox()).to.be.a('null');
            })

            it('should reclick the cart button', async function () {
                expect(cartButtonWasClickedProgrammatically).to.equal(true);
            })
        })
    })

    it('should create a missing product warning popup if failed to add products', async function () {
        getCartAppendBtn(0).click();
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
        return document.querySelector(".saved-cart-popup > li > button[name='cart']");
    }

    function getOtherSavedCartButton() {
        return document.querySelector(".saved-cart-popup > li:nth-child(2) > button[name='cart']");
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

    it('shouldn\'t write to localStorage on inject', function () {
        expect(localStorage).to.be.empty;
    });

    it('should redirect to login page', function () {
        expect(window.location.href).to.include('/e-veikals/account/login');
    })
});

describe('Make cart deletion possible in cart view', function () {
    beforeEach('setup DOM', function () {
        setupDOM('test/rimi-cart-empty.html');
    });

    it('creates remove button in each cart button in the drop down menu except for the new cart button', function () {
        const removeBtns = document.querySelectorAll(".saved-cart-popup.js-saved li .smart-basket-remove");
        const btns = document.querySelectorAll(".saved-cart-popup.js-saved li");

        expect(removeBtns.length).to.equal(btns.length - 1);
    });

    it('when a remove button is clicked, prompt user a second time to confirm the removal', function () {
        const removeBtn = document.querySelector(".saved-cart-popup.js-saved li .smart-basket-remove");
        removeBtn.click();

        const confirmBtn = document.querySelector('.smart-basket-confirm-cart-removal');
        expect(confirmBtn).to.not.equal(null);
    });

    it('prompt contains cart name', function () {
        const removeBtn = document.querySelector(".saved-cart-popup.js-saved li .smart-basket-remove");
        removeBtn.click();

        const prompt = document.querySelector('.smart-basket-cart-removal-prompt');
        expect(prompt).to.not.equal(null);
        expect(prompt.innerHTML).to.contain('dankmemes');
    });

    describe('if removal declined', function () {
        beforeEach(async function () {
            const removeBtn = document.querySelector(".saved-cart-popup.js-saved li .smart-basket-remove");
            removeBtn.click();

            const declineBtn = document.querySelector('.smart-basket-decline-cart-removal');
            declineBtn.click();

            await asyncTasks();
        })

        it('doesn\'t post any data', function () {
            expect(axiosMock.history.post.length).to.equal(0);
        })

        it('doesn\'t remove element', function () {
            const btn = document.querySelector(`.saved-cart-popup.js-saved li button[value='13371337']`);
            expect(btn).to.not.be.null;
        })

        it('keeps menu open', function () {
            let flaggedElem = document.querySelector('.-saved-cart-active');
            expect(flaggedElem).to.not.be.null;
        })

        it('doesn\'t display any notification', function () {
            const notif = document.querySelector(".rimi-smart-basket-notification");
            expect(notif).to.not.exist;
        })
    })

    describe('if removal confirmed but api call unsuccessful', function () {
        beforeEach(async function () {
            axiosMock
                .onPost(rimiURLs.deleteCart())
                .reply(500, {})

            const removeBtn = document.querySelector(".saved-cart-popup.js-saved li .smart-basket-remove");
            removeBtn.click();

            const confirmBtn = document.querySelector('.smart-basket-confirm-cart-removal');
            confirmBtn.click();

            await asyncTasks();
        })

        it('doesn\'t remove element', function () {
            const btn = document.querySelector(`.saved-cart-popup.js-saved li button[value='13371337']`);
            expect(btn).to.not.be.null;
        })

        function getErrorMessageElement() {
            return document.querySelector(".rimi-smart-basket-notification.error");
        }

        it('displays error message', function () {
            expect(getErrorMessageElement()).to.exist;
        })

        it('error message contains word fail', function () {
            expect(getErrorMessageElement().textContent).to.contain('fail');
        })
    })

    describe('if removal confirmed and successful', function () {
        let cartCode;

        beforeEach(async function () {
            axiosMock
                .onPost(rimiURLs.deleteCart())
                .reply(200, {})

            const liElem = document.querySelector(".saved-cart-popup.js-saved li button[name='cart']");
            liElem.id = "swagyolo123";
            cartCode = liElem.value;

            const removeBtn = document.querySelector(".saved-cart-popup.js-saved li .smart-basket-remove");
            removeBtn.click();

            const confirmBtn = document.querySelector('.smart-basket-confirm-cart-removal');
            confirmBtn.click();

            await asyncTasks();
        })

        it('keeps menu open', function () {
            let flaggedElem = document.querySelector('.-saved-cart-active');
            expect(flaggedElem).to.not.be.null;
        })

        it('sends request to delete the cart', async function () {
            expect(axiosMock.history.post.length).to.equal(1);
            expect(axiosMock.history.post[0].url).to.equal(rimiURLs.deleteCart());

            const postData = JSON.parse(axiosMock.history.post[0].data);

            expect(postData._method).to.equal("delete");
            expect(postData._token).to.equal("redacted");
            expect(postData.code).to.equal(cartCode);
        })

        it('removes cart li element from DOM', async function () {
            let removedElem = document.querySelector("#swagyolo123");
            expect(removedElem).to.be.null;
        })

        function getSuccessMessageElement() {
            return document.querySelector(".rimi-smart-basket-notification.success");
        }

        it('displays success message', function () {
            expect(getSuccessMessageElement()).to.exist;
        })

        it('displayed success message contains cart name', function () {
            expect(getSuccessMessageElement().textContent).to.contain("dankmemes");
        })
    })
});