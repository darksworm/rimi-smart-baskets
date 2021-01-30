export default class CartUpdateValidator {
    constructor(actualProducts, expectedProducts) {
        this.actual = actualProducts;
        this.expected = expectedProducts;
    }

    hasProductUpdateFailed() {
        return this._getMissingProducts().length !== 0;
    }

    getMissingProductNames() {
        let missing = this._getMissingProducts();
        return missing.map(m => m.product.name);
    }

    _getMissingProducts() {
        let productStates = this._getProductUpdateStates();
        return productStates.filter(x => x.updated === false);
    }

    _getProductUpdateStates() {
        return this.expected.map((expected) => {
            return {
                product: expected,
                updated: this.actual
                    .filter(actual => actual.id === expected.id)
                    .filter(actual => +actual.hiddenAmount === +expected.hiddenAmount)
                    .length > 0
            }
        });
    }
}

