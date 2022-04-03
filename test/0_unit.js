import fs from "fs";

import {expect} from "chai";
import {before, beforeEach, describe, it} from "mocha";

import {JSDOM} from "jsdom";
import {asyncTasks} from "await-async-task";

import RimiDOM from "../src/lib/rimi/rimiDOM";
import RimiAPI from "../src/lib/rimi/rimiAPI";
import CartStorage from "../src/lib/cart/cartStorage"
import CartUpdater from "../src/lib/cart/cartUpdater";
import CartRemover from "../src/lib/cart/cartRemover";
import RemoveCartButtonCreator from "../src/lib/cart/removeCartButtonCreator";
import LoadingIndicator from "../src/lib/ui/loadingIndicator"
import ProductPainter from "../src/lib/ui/productPainter";
import DOMCartChangeListener from "../src/lib/cart/DOMCartChangeListener";
import rimiURLs from "../src/lib/rimi/rimiURLs";

describe('RimiDOM with blank page and google.com as URL', function () {
    let rimiDOM;
    before(function () {
        const dom = new JSDOM(`<input name='_token'/><meta name='csrf-token'/>`, {
            'url': 'https://google.com'
        });
        rimiDOM = new RimiDOM(dom.window);
    });

    describe('getCurrentCart', function () {
        it('should not find products in cart', function () {
            let cart = rimiDOM.getCurrentCart();
            expect(cart.products).to.be.empty;
        });
        it('should not find a cart name', function () {
            let cart = rimiDOM.getCurrentCart();
            expect(cart.name).to.be.a('undefined');
        });
        it('should not find a cart id', function () {
            let cart = rimiDOM.getCurrentCart();
            expect(cart.id).to.be.a('undefined');
        })
    });

    describe('isInSavedCart', function () {
        it('should not be truthy', function () {
            let result = rimiDOM.isInSavedCart();
            expect(result).to.equal(false);
        })
    })
});

describe('RimiDOM isLoggedIn', function () {
    let rimiDOM;

    describe('with present login button', function () {
        before(function () {
            const html = fs.readFileSync('test/rimi-header-login-btn.html', 'utf-8');
            const dom = new JSDOM(html, {
                'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
            });
            rimiDOM = new RimiDOM(dom.window);
        });

        it('should know that it is not logged in', function () {
            expect(rimiDOM.isLoggedIn()).to.be.false;
        });
    });

    describe('with no login button', function () {
        const html = fs.readFileSync('test/rimi-header-logged-in.html', 'utf-8');
        before(function () {
            const dom = new JSDOM(html, {
                'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
            });
            rimiDOM = new RimiDOM(dom.window);
        });

        it('should know that it is logged in', function () {
            expect(rimiDOM.isLoggedIn()).to.be.true;
        });
    });
});

describe('RimiAPI', function () {
    describe('constructor', function () {
        it('throws without params', function () {
            expect(() => new RimiAPI()).to.throw();
        });
        it('doesnt throw with three params', function () {
            expect(() => new RimiAPI('whatever', 'nextever', {})).to.not.throw();
        });
    });

    describe('updateProduct', function () {
        it('calls axios.put', function () {
            let called = false;
            let axiosMock = {
                put: function () {
                    called = true
                }
            };
            let api = new RimiAPI('whatever', 'nextever', axiosMock);
            api.updateProduct(123, 1, 1);
            expect(called).to.equal(true);
        })
    })

    describe('removeSavedCart', function () {
        let postURL;
        let postData;
        let api;
        let postHeaders;

        beforeEach(function () {
            const axiosMock = {
                post: (url, data, config) => {
                    postURL = url;
                    postData = data;
                    postHeaders = config["headers"];
                }
            };

            api = new RimiAPI('tokenRedacted', 'csrfRedacted', axiosMock);
        })

        it('calls axios.post with delete endpoint', function () {
            api.removeSavedCart(123);
            expect(postURL).to.equal(rimiURLs.deleteCart());
        })

        it('posts first passed element as code element', function () {
            api.removeSavedCart(123);
            expect(postData['code']).to.equal(123);

            api.removeSavedCart(333);
            expect(postData['code']).to.equal(333);
        })

        it('posts method "delete"', function () {
            api.removeSavedCart(333);
            expect(postData['_method']).to.equal("delete");
        })

        it("posts token", function () {
            api.removeSavedCart(111);
            expect(postData['_token']).to.equal('tokenRedacted');
        })

        it("posts with csrf token in headers", function () {
            api.removeSavedCart(233);
            expect(postHeaders["x-csrf-token"]).to.equal('csrfRedacted');
        })
    })
});

describe('CartStorage', function () {
    function createStorageMock() {
        return {
            data: {},
            getItem(key) {
                return this.data[key];
            },
            setItem(key, value) {
                this.data[key] = value;
            }
        }
    }

    describe('constructor', function () {
        it('throws when called with empty object argument', function () {
            expect(() => new CartStorage({})).to.throw();
        });

        it('throws when called without arguments', function () {
            expect(() => new CartStorage()).to.throw();
        });

        it('throws when called with object missing setItem', function () {
            let storage = {
                getItem: () => {}
            };
            expect(() => new CartStorage(storage)).to.throw();
        });

        it('throws when called with object missing getItem', function () {
            let storage = {
                setItem: () => {}
            };
            expect(() => new CartStorage(storage)).to.throw();
        });

        it('doesn\'t throw when called with storage with proper API', function () {
            expect(() => new CartStorage(createStorageMock())).to.not.throw;
        })
    });

    describe('getStoredCart', function () {
        let storageMock;
        let cartStorage;

        beforeEach(function () {
            storageMock = createStorageMock();
            cartStorage = new CartStorage(storageMock);
        });

        it('throws when requested cart does not exist', function () {
            expect(() => cartStorage.getStoredCart(1234)).to.throw();
        });

        it('returns cart when requested cart exists', function () {
            let stored = {'1234': {'test': 'yes'}};
            storageMock.data.carts = JSON.stringify(stored);
            let retrieved = cartStorage.getStoredCart(1234);
            expect(retrieved).to.deep.equal(stored['1234']);
        });
    });

    describe('storeCart', function () {
        let storageMock;
        let cartStorage;

        beforeEach(function () {
            storageMock = createStorageMock();
            cartStorage = new CartStorage(storageMock);
        });

        it('stored cart can be retreived with getStoredCart', function () {
            let stored = {'test': 'yes', 'id': 1234};
            cartStorage.storeCart(stored);
            let retrieved = cartStorage.getStoredCart(1234);
            expect(retrieved).to.deep.equal(stored);
        })
    })
});

describe('LoadingIndicator', function () {
    let dom;
    let id;
    let indicator;

    beforeEach(function () {
        dom = new JSDOM('');
        id = 'loader-container';
        indicator = new LoadingIndicator(dom.window.document, id);
        indicator.show();
    });

    it('show creates element in dom', function () {
        let elem = dom.window.document.getElementById(id);
        expect(elem).to.not.be.a('null');
    });

    it('show called twice does not create another element', function () {
        indicator.show();
        let bodyChildCount = dom.window.document.body.childElementCount;
        expect(bodyChildCount).to.equal(1);
    });

    it('should create element which has a classname', function () {
        let elem = dom.window.document.getElementById(id);
        let className = elem.className;
        expect(className).to.not.be.empty;
    });

    it('should create element which is not empty', function () {
        let elem = dom.window.document.getElementById(id);
        expect(elem.childElementCount).to.not.equal(0);
    });

    it('updates textcontent of loader when updateText called', function () {
        let text = "this is some random string";
        indicator.updateText(text);
        let elem = dom.window.document.getElementById(id);
        expect(elem.textContent).to.include(text);
    });
});

describe('CartUpdater', function () {
    describe('appendStoredCartItemsToActiveCart', function () {
        let dom;
        let api;
        let indicator;

        beforeEach(function () {
            dom = new JSDOM('');
            api = {
                updateProduct: () => {}
            };
            indicator = new LoadingIndicator(dom.window.document);
        });

        it('should not make any API calls when empty carts passed', function () {
            let called = false;
            let api = {
                updateProduct: function () {
                    called = true
                }
            };
            let cartUpdater = new CartUpdater(api, indicator, dom.window);
            cartUpdater.doAction([]);
            expect(called).to.equal(false);
        });

        it('should make one api call for each stored item', async function () {
            let calledTimes = 0;
            let api = {
                updateProduct: function () {
                    calledTimes++;
                    return Promise.resolve();
                }
            };
            let cartUpdater = new CartUpdater(api, {storeCartUpdate: () => {}});
            await cartUpdater.doAction(() => {}, [1, 2, 3]);
            expect(calledTimes).to.equal(3);
        });
    });
});

describe('RemoveBtnCreator', function () {
    beforeEach('setup dom', function () {
        this.dom = new JSDOM(`
            <ul class="saved-cart-popup js-saved">
            <li>
                <button name="cart" value="13371337">dankmemes</button>
            </li>
            <li>
                <button name="cart" value="1101522953">temp</button>
            </li>
            <li id="new-cart-li">
                <button name="cart" value="new" class="js-new-cart">
                    <span>Sākt jaunu grozu</span>
                    <svg class=""></svg>
                </button>
            </li>
        </ul>`, {
            'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
        });

        this.document = this.dom.window.document;
    });

    describe('createButtons', function () {
        describe('without innerHTML', function () {
            beforeEach('setup dom', function () {
                const removeBtnCreator = new RemoveCartButtonCreator(this.document);
                removeBtnCreator.createButtons();
            });

            it('no remove button added to the new cart list element', function () {
                const newCartRemoveBtn = this.document.querySelector("#new-cart-li .smart-basket-remove");
                expect(newCartRemoveBtn).to.equal(null);
            })

            it('every list element which is not the new cart element contains a remove saved cart button', function () {
                const btns = this.document.querySelectorAll("li:not(#new-cart-li) .smart-basket-remove");
                const li = this.document.querySelectorAll("li:not(#new-cart-li)");

                expect(btns.length).to.be.greaterThan(0);
                expect(btns.length).to.equal(li.length);
            })
        })

        it('when passed svg element, creates svg element in all buttons except new cart button', function () {
            const svg = '<svg><g xmlns="http://www.w3.org/2000/svg" id="Solid"><path d="m297.575"/></g></svg>';
            const removeBtnCreator = new RemoveCartButtonCreator(this.document);
            removeBtnCreator.createButtons(svg);

            const svgs = this.document.querySelectorAll("li:not(#new-cart-li) .smart-basket-remove svg");
            const btns = this.document.querySelectorAll("li:not(#new-cart-li) .smart-basket-remove");

            expect(svgs.length).to.be.greaterThan(0);
            expect(btns.length).to.equal(svgs.length);
        })

        it('when passed div element, creates copies of it inside all of the buttons except ne new cart button', function () {
            const div = '<div class="classy"><marquee>dankmemes</marquee></div>';
            const removeBtnCreator = new RemoveCartButtonCreator(this.document);
            removeBtnCreator.createButtons(div);

            const divs = this.document.querySelectorAll("li:not(#new-cart-li) .smart-basket-remove .classy");

            expect(divs.length).to.be.greaterThan(0);
            divs.forEach(elem => expect(elem.outerHTML).to.equal(div))
        })

        it('second passed parameter called when button clicked', function () {
            let called = false;

            const removeBtnCreator = new RemoveCartButtonCreator(this.document);
            const confirmCallback = () => {
                called = true;
                return new Promise(((resolve) => resolve(true)));
            };

            removeBtnCreator.createButtons("", confirmCallback);

            const removeBtn = this.document.querySelectorAll(".saved-cart-popup.js-saved li .smart-basket-remove")[0];
            removeBtn.click();

            expect(called).to.equal(true);
        })

        describe('prompt callback', function () {
            let calledCartName = undefined;
            let calledCartId = undefined;

            beforeEach(function () {
                calledCartName = undefined;
                calledCartId = undefined;

                const removeBtnCreator = new RemoveCartButtonCreator(this.document);
                const confirmCallback = (cartName, cartId) => {
                    calledCartName = cartName;
                    calledCartId = cartId;

                    return new Promise(((resolve) => resolve(true)));
                };

                removeBtnCreator.createButtons("", confirmCallback);
            })

            function getRemoveElement(document, index) {
                return document.querySelectorAll(".saved-cart-popup.js-saved li .smart-basket-remove")[index];
            }

            it('receives correct cart data for zeroth cart', function () {
                const cartRemoveElem = getRemoveElement(this.document, 0);

                cartRemoveElem.click();
                expect(calledCartName).to.equal("dankmemes");
                expect(calledCartId).to.equal("13371337");
            })

            it('receives correct cart data for first cart', function () {
                const cartRemoveElem = getRemoveElement(this.document, 1);

                cartRemoveElem.click();
                expect(calledCartName).to.equal("temp");
                expect(calledCartId).to.equal("1101522953");
            })
        })
    })
})

describe('CartRemover', function () {
    beforeEach('setup dom', function () {
        this.dom = new JSDOM(`
                <section class="cart">
                    <ul class="saved-cart-popup js-saved">
                    <li>
                        <button name="cart" value="13371337">dankmemes</button>
                    </li>
                    <li>
                        <button name="cart" value="1101522953">temp</button>
                    </li>
                    <li id="new-cart-li">
                        <button name="cart" value="new" class="js-new-cart">
                            <span>Sākt jaunu grozu</span>
                            <svg class=""></svg>
                        </button>
                    </li>
                    </ul>
                </section>`, {
            'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
        });

        this.document = this.dom.window.document;
    });

    const promptServiceMock = {
        promptCartRemoval() {
            return Promise.resolve(true)
        }
    }

    const rimiAPIMock = {
        removeSavedCart() {
            return Promise.resolve()
        }
    }

    it('does not remove elements from DOM when removeSavedCart rejects', function () {
        const apiMock = {
            removeSavedCart() {
                return Promise.reject();
            }
        }

        const remover = new CartRemover(this.document, apiMock, promptServiceMock);
        remover.promptAndRemoveCart("yes", 13371337);

        const elems = this.document.querySelectorAll('li');
        expect(elems.length).to.equal(3);
    })

    it('throws exception when non-existant cart removal requested', function () {
        const remover = new CartRemover(this.document, rimiAPIMock, promptServiceMock);
        expect(() => remover.promptAndRemoveCart("yas", 12345)).to.throw();
    })

    it('doesn\'t throw exception when existing cart removal requested', function () {
        const remover = new CartRemover(this.document, rimiAPIMock, promptServiceMock);
        remover.promptAndRemoveCart("yas", 13371337);
    })

    it('removes li element from DOM when removeSavedCart succeeds', async function () {
        const remover = new CartRemover(this.document, rimiAPIMock, promptServiceMock);
        remover.promptAndRemoveCart("yes", 13371337);

        await asyncTasks();

        const btn = this.document.querySelector(`.saved-cart-popup.js-saved li button[value='13371337']`);
        expect(btn).to.be.null;

        const elems = this.document.querySelectorAll('li');
        expect(elems.length).to.equal(2);
    })
})

describe('ProductPainter', function () {
    let originalDOM;
    let painter;

    beforeEach('setup two categories with two products each', function () {
        originalDOM = `
            <div class="cart__content">
                <div>
                    <div class="js-checkout-cart-categories">
                        <div class="cart-category" data-gtms-content-category="somecategory">
                            <header></header>
                            <div data-product-code="111" class="js-product-container js-cart-card-container cart-card in-cart"></div>
                            <div data-product-code="222" class="js-product-container js-cart-card-container cart-card in-cart"></div>
                        </div>
                        <div class="cart-category" data-gtms-content-category="someothercategory">
                            <div data-product-code="333" class="js-product-container js-cart-card-container cart-card in-cart"></div>
                            <div data-product-code="444" class="js-product-container js-cart-card-container cart-card in-cart"></div>
                        </div>
                    </div>
                </div>
            </div>`;

        this.dom = new JSDOM(originalDOM, {
            'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
        });
        this.document = this.dom.window.document;
        painter = new ProductPainter(this.document);
    });

    it('doesn\'t change DOM if no products added', function () {
        painter.paint([], "painted");
        const DOMAfterPaint = this.document.querySelector('.cart__content').outerHTML;
        expect(DOMAfterPaint.trim()).to.equal(originalDOM.trim());
    })

    it('doesn\'t change DOM if non-existant product ids passed', function () {
        painter.paint([666, 777, 888, 999], "painted");
        const DOMAfterPaint = this.document.querySelector('.cart__content').outerHTML;
        expect(DOMAfterPaint.trim()).to.equal(originalDOM.trim());
    })

    it('doesn\'t add class to products which weren\'t passed', function () {
        painter.paint([222, 444], "painted");
        const unpaintedElements = this.document.querySelectorAll(
            ".cart-category div:first-of-type:not(.painted)"
        );
        expect(unpaintedElements.length).to.equal(2);
    })

    it('doesn\'t change existing product element classes', function () {
        const toBePaintedElement = this.document.querySelector(".cart-category div[data-product-code='111']");
        const oldClassList = [...toBePaintedElement.classList];

        painter.paint([111], "painted");

        const paintedElement = this.document.querySelector(".cart-category div[data-product-code='111']");
        const newClassList = [...paintedElement.classList];

        for (let oldClass of oldClassList) {
            expect(newClassList).to.include(oldClass);
        }
    })

    it('adds class to passed product ids', function () {
        painter.paint([111, 333], "painted");
        const paintedElements = this.document.querySelectorAll(
            ".cart-category div.painted"
        );

        const paintedElementIds = [...paintedElements].map((e) => +e.dataset.productCode);

        expect(paintedElements.length).to.equal(2);
        expect(paintedElementIds).to.deep.equal([111, 333]);
    })
});

describe('DOMCartChangeListener', function () {
    let document;
    let callbackWasExecuted;
    let observeParams = [];
    const callback = () => callbackWasExecuted = true;

    const mutationObserverMock = function (callback) {
        mutationObserverMock.sendMutations = callback;
        return {
            observe: (target, options) => {
                observeParams = [target, options];
            }
        };
    };

    beforeEach(function () {
        observeParams = [];
        callbackWasExecuted = false;
        const dom = new JSDOM(`<div class="cart__content"></div>`, {});
        document = dom.window.document;
    })

    it('executes observe method with cart__content node and correct settings', function () {
        const cartChangeListener = new DOMCartChangeListener(document, mutationObserverMock, callback);
        cartChangeListener.startListening();

        expect([...observeParams[0].classList]).to.contain('cart__content');
        expect(observeParams[1]).to.deep.equal({
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    })

    it('doesn\'t execute callback when non-childList mutations observed', async function () {
        const cartChangeListener = new DOMCartChangeListener(document, mutationObserverMock, callback);
        cartChangeListener.startListening();

        mutationObserverMock.sendMutations([
            {'type': 'attributes'},
            {'type': 'characterData'}
        ]);

        await asyncTasks();

        expect(callbackWasExecuted).to.equal(false);
    });

    describe('when irrelevant nodes', function () {
        let nodes;

        beforeEach(function () {
            const cartChangeListener = new DOMCartChangeListener(document, mutationObserverMock, callback);
            cartChangeListener.startListening();
            nodes = [
                document.createElement('span'),
                document.createElement('div'),
                document.createTextNode("hello i am a text node")
            ];
        })

        it('added, doesn\'t execute callback', async function () {
            const container = document.querySelector('.cart__content');
            mutationObserverMock.sendMutations([
                {
                    'type': 'childList',
                    addedNodes: document.querySelectorAll('.cart__content *'),
                    removedNodes: []
                },
            ]);

            await asyncTasks();
            expect(callbackWasExecuted).to.equal(false);
        });

        it('removed, doesn\'t execute callback', async function () {
            mutationObserverMock.sendMutations([
                {
                    'type': 'childList',
                    addedNodes: [],
                    removedNodes: document.querySelectorAll('.cart__content *')
                },
            ]);

            await asyncTasks();
            expect(callbackWasExecuted).to.equal(false);
        });
    })

    describe('when div with js-checkout-cart-categories class', function () {
        let node;

        beforeEach(function () {
            const cartChangeListener = new DOMCartChangeListener(document, mutationObserverMock, callback);
            cartChangeListener.startListening();
            node = document.createElement('div');
            node.classList.add('js-checkout-cart-categories');

            const child = document.createElement('div');
            child.classList.add('js-product-container', 'in-cart');

            document.body.appendChild(node);
            document.querySelector('.js-checkout-cart-categories').appendChild(child);
        })

        it('removed, executes callback', function () {
            mutationObserverMock.sendMutations([
                {
                    'type': 'childList',
                    removedNodes: [document.querySelector('.js-checkout-cart-categories')],
                    addedNodes: []
                },
            ]);
            expect(callbackWasExecuted).to.equal(true);
        })

        it('added, executes callback', function () {
            mutationObserverMock.sendMutations([
                {
                    'type': 'childList',
                    addedNodes: [document.querySelector('.js-checkout-cart-categories')],
                    removedNodes: []
                },
            ]);
            expect(callbackWasExecuted).to.equal(true);
        })
    })
});