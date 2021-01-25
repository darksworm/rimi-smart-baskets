export default class CartUpdater {
    constructor(rimiAPI) {
        this.rimiAPI = rimiAPI;
    }

    async doAction(onProgress, products) {
        for (const [index, product] of products.entries()) {
            onProgress(index + 1, products.length);
            await this.rimiAPI.updateProduct(product.id, product.hiddenAmount, 0)
        }
    }
}