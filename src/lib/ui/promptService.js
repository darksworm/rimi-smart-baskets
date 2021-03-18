export default class PromptService {
    constructor(promptProvider) {
        this.promptProvider = promptProvider;
    }

    promptCartAbandonment() {
        return new Promise((resolve, reject) => {
            this.promptProvider.fire({
                icon: 'warning',
                text: 'Abandon current cart?',
                showCancelButton: true,
                confirmButtonText: `Yes`,
                customClass: {
                    container: 'smart-basket-confirm-action',
                    confirmButton: 'smart-basket-accept',
                    cancelButton: 'smart-basket-cancel'
                }
            }).then((result) => {
                resolve(result.isConfirmed);
            }).catch(reject);
        })
    }

    notifyProductAdditionFailed(body, footer) {
        return new Promise((resolve, reject) => {
            this.promptProvider.fire({
                icon: 'error',
                title: 'Failed to add products!',
                html: body,
                footer: footer,
                showCancelButton: false,
                confirmButtonText: 'OK',
                customClass: {
                    container: 'smart-basket-missing-product-warning',
                    confirmButton: 'smart-basket-accept',
                }
            }).then(resolve).catch(reject);
        });
    }

    promptCartRemoval(cartName) {
        return new Promise((resolve, reject) => {
            this.promptProvider.fire({
                icon: 'warning',
                text: `Delete cart ${cartName}?`,
                showCancelButton: true,
                confirmButtonText: `Yes`,
                customClass: {
                    confirmButton: 'smart-basket-confirm-cart-removal',
                    cancelButton: 'smart-basket-decline-cart-removal',
                    container: 'smart-basket-cart-removal-prompt'
                }
            }).then((result) => {
                resolve(result.isConfirmed);
            }).catch(reject);
        })
    }
}