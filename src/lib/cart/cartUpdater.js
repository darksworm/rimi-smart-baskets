export default class CartUpdater {
    constructor(rimiAPI, cartStorage) {
        this.rimiAPI = rimiAPI;
        this.cartStorage = cartStorage;
    }

    async doAction(onProgress, products) {
        this.saveCartUpdateInStorage(products);
        await this.updateProducts(onProgress, products);
    }

    saveCartUpdateInStorage(products) {
        this.cartStorage.storeCartUpdate(products);
    }

    async updateProducts(onProgress, products) {
        for (const [index, product] of products.entries()) {
            onProgress(index + 1, products.length);
            await this.rimiAPI.updateProduct(product.id, product.hiddenAmount, 0)
        }
    }
}