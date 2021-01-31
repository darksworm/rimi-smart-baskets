import {expect} from "chai";
import {before, beforeEach, describe, it} from "mocha";

import {JSDOM} from "jsdom";

import RimiDOM from "../src/lib/rimi/rimiDOM";
import RimiAPI from "../src/lib/rimi/rimiAPI";
import CartStorage from "../src/lib/cart/cartStorage"
import CartUpdater from "../src/lib/cart/cartUpdater";

import LoadingIndicator from "../src/lib/ui/loadingIndicator"

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
})

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
