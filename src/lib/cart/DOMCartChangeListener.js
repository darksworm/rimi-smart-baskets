export default class DOMCartChangeListener {
    constructor(document, MutationObserver, callback) {
        this.document = document;
        this.callback = callback;

        this._createObserver(MutationObserver);
    }

    startListening() {
        const target = this.document.querySelector('.cart__content');
        this.observer.observe(target, {attributes: false, childList: true, characterData: false, subtree: true});
    }

    _createObserver(MutationObserver) {
        this.observer = new MutationObserver((m) => this._handleMutations(m));
    }

    _handleMutations(mutationList) {
        let childListUpdates = mutationList.filter((m) => m.type === 'childList');
        if (childListUpdates.some(m => this._mutationRequiresCartUpdate(m))) {
            this.callback();
        }
    }

    _mutationRequiresCartUpdate(mutation) {
        const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
        return changedNodes.some((n) => this._nodeContainsProducts(n));
    }

    _nodeContainsProducts(node) {
        return this._nodeIsInCartProduct(node)
            || this._nodeContainsInCartProduct(node);
    }

    _nodeIsInCartProduct(node) {
        return node.classList && node.classList.contains('js-product-container') && node.classList.contains('in-cart');
    }

    _nodeContainsInCartProduct(node) {
        return node.querySelector && node.querySelector('.js-product-container.in-cart') !== null;
    }
}