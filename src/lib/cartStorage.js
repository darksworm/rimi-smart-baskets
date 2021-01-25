export default class CartStorage {
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
        let carts = this._getAllStoredCarts();

        if (typeof carts[id] === 'undefined') {
            let error = new Error('the requested cart is not stored!');
            error.code = "CART_NOT_STORED";
            throw error;
        }

        return carts[id];
    }

    storeCart(cart) {
        let storedCarts = this._getAllStoredCarts();
        storedCarts[cart.id] = cart;
        this.storage.setItem('carts', this._encodeCarts(storedCarts));
    }

    _getAllStoredCarts() {
        let carts = this.storage.getItem('carts');
        if (typeof carts === 'undefined' || carts === null) {
            return {};
        }
        return this._decodeCarts(carts);
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