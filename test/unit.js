const chai = require('chai')
const {JSDOM} = require('jsdom')
const {asyncTasks} = require('await-async-task')
global.DONT_EXECUTE_USERSCRIPT = true
const {RimiDOM, RimiAPI, CartStorage, LoadingIndicator, CartUpdater} = require('../index')

describe('RimiDOM with blank page and google.com as URL', function () {
    let rimiDOM;
    before(function () {
        const dom = new JSDOM(`<input name='_token'/><meta name='csrf-token'/>`, {
            'url': 'https://google.com'
        })
        rimiDOM = new RimiDOM(dom.window);
    })

    describe('getCurrentCart', function () {
        it('should not find products in cart', function () {
            let cart = rimiDOM.getCurrentCart();
            chai.assert.isEmpty(cart.products);
        })
        it('should not find a cart name', function () {
            let cart = rimiDOM.getCurrentCart();
            chai.assert.isUndefined(cart.name);
        })
        it('should not find a cart id', function () {
            let cart = rimiDOM.getCurrentCart();
            chai.assert.isUndefined(cart.id);
        })
    })

    describe('isInSavedCart', function () {
        it('should not be truthy', function () {
            let result = rimiDOM.isInSavedCart();
            chai.assert.isFalse(result);
        })
    })
})

describe('RimiAPI', function () {
    describe('constructor', function () {
        it('throws without params', function () {
            chai.assert.throws(() => new RimiAPI());
        })
        it('doesnt throw with three params', function () {
            new RimiAPI('whatever', 'nextever', {})
        })
    })

    describe('updateProduct', function () {
        it('calls axios.put', function () {
            let called = false;
            let axiosMock = {
                put: function () {
                    called = true
                }
            };
            let api = new RimiAPI('whatever', 'nextever', axiosMock)
            api.updateProduct(123, 1, 1);
            chai.assert.isTrue(called);
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
            chai.assert.throws(() => new CartStorage({}));
        })
        it('throws when called without arguments', function () {
            chai.assert.throws(() => new CartStorage());
        })
        it('throws when called with object missing setItem', function () {
            let storage = {
                getItem: () => {
                }
            };
            chai.assert.throws(() => new CartStorage(storage));
        })
        it('throws when called with object missing getItem', function () {
            let storage = {
                setItem: () => {
                }
            };
            chai.assert.throws(() => new CartStorage(storage));
        })
    })

    describe('getStoredCart', function () {
        let storageMock;
        let cartStorage;

        beforeEach(function () {
            storageMock = createStorageMock();
            cartStorage = new CartStorage(storageMock);
        })

        it('throws when requested cart does not exist', function () {
            chai.assert.throws(() => cartStorage.getStoredCart(1234));
        })

        it('returns cart when requested cart exists', function () {
            let stored = {'1234': {'test': 'yes'}};
            storageMock.data.carts = JSON.stringify(stored);
            let retrieved = cartStorage.getStoredCart(1234);
            chai.assert.deepEqual(retrieved, stored['1234']);
        })
    })

    describe('storeCart', function () {
        let storageMock;
        let cartStorage;

        beforeEach(function () {
            storageMock = createStorageMock();
            cartStorage = new CartStorage(storageMock);
        })

        it('stored cart can be retreived with getStoredCart', function () {
            let stored = {'test': 'yes', 'id': 1234};
            cartStorage.storeCart(stored);
            let retrieved = cartStorage.getStoredCart(1234);
            chai.assert.deepEqual(retrieved, stored);
        })
    })
})

describe('LoadingIndicator', function () {
    let dom;
    let id;
    let indicator;

    beforeEach(function () {
        dom = new JSDOM('');
        id = 'loader-container';
        indicator = new LoadingIndicator(dom.window.document, id);
        indicator.show();
    })

    it('show creates element in dom', function () {
        let elem = dom.window.document.getElementById(id);
        chai.assert.isNotNull(elem);
    })

    it('show called twice does not create another element', function () {
        indicator.show();
        let bodyChildCount = dom.window.document.body.childElementCount;
        chai.assert.equal(bodyChildCount, 1);
    })

    it('should create element which has a classname', function () {
        let elem = dom.window.document.getElementById(id);
        let className = elem.className;
        chai.assert.isNotEmpty(className);
    })

    it('should create element which is not empty', function () {
        let elem = dom.window.document.getElementById(id);
        chai.assert.notEqual(elem.childElementCount, 0);
    })

    it('updates textcontent of loader when updateText called', function () {
        let text = "this is some random string";
        indicator.updateText(text);
        let elem = dom.window.document.getElementById(id);
        chai.assert.include(elem.textContent, text);
    })
})

describe('CartUpdater', function () {
    describe('appendStoredCartItemsToActiveCart', function () {
        let dom;
        let api;
        let indicator;

        beforeEach(function () {
            dom = new JSDOM('');
            api = {
                updateProduct: function () {
                }
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
            let cartUpdater = new CartUpdater(api, indicator, dom.window)
            cartUpdater.doAction([]);
            chai.assert.isFalse(called);
        })

        it('should make one api call for each stored item', async function () {
            let calledTimes = 0;
            let api = {
                updateProduct: function () {
                    calledTimes++;
                    return Promise.resolve();
                }
            };
            let cartUpdater = new CartUpdater(api, indicator, dom.window);
            cartUpdater.doAction(() => {}, [1, 2, 3]);
            await asyncTasks();
            chai.assert.equal(calledTimes, 3);
        })
    })
})

after(function () {
    global.DONT_EXECUTE_USERSCRIPT = undefined
})