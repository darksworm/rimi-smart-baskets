export default class CartUpdateValidator {
    constructor(actualProducts, expectedProducts) {
        this.actual = actualProducts;
        this.expected = expectedProducts;
    }

    hasProductUpdateFailed() {
        return this.getFailedProducts().length !== 0;
    }

    getFailedProducts() {
        let productStates = this._getProductUpdateStates();
        let nonUpdatedStates = productStates.filter(x => x.updated === false);
        return nonUpdatedStates.map(x => x.product);
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

