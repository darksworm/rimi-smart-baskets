export default class ProductPainter {
    constructor(document) {
        this.document = document;
    }

    paint(productIds, classToAdd) {
        this._getElements(productIds)
            .forEach(e => e.classList.add(classToAdd));
    }

    _getElements(productIds) {
        return productIds
            .map(x => this._getOneElement(x))
            .filter(x => x != null);
    }

    _getOneElement(productId) {
        return this.document.querySelector(
            `.js-product-container.in-cart[data-product-code='${productId}']`
        );
    }
}

