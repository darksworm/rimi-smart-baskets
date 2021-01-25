export default class CartUpdateListBuilder {
    getProductsToUpdate(productsToAdd, productsAlreadyAdded) {
        let productsToUpdate = this._createProductsCopy(productsToAdd);
        this._sumAmountsForOverlappingProducts(productsToUpdate, productsAlreadyAdded);
        return productsToUpdate;
    }

    _sumAmountsForOverlappingProducts(productsToAdd, alreadyAddedProducts) {
        alreadyAddedProducts.forEach(alreadyAdded =>
            productsToAdd
                .filter(toAdd => toAdd.id === alreadyAdded.id)
                .forEach(toAdd => toAdd.hiddenAmount = +toAdd.hiddenAmount + +alreadyAdded.hiddenAmount)
        );
    }

    _createProductsCopy(products) {
        return JSON.parse(JSON.stringify(products));
    }
}