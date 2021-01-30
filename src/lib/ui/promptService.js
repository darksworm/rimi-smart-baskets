export default class PromptService {
    constructor(promptProvider) {
        this.promptProvider = promptProvider;
    }

    promptCartAbandonment() {
        return new Promise((resolve, reject) => {
            this.promptProvider.fire({
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

    notifyProductAdditionFailed(failedToAddProducts) {
        return new Promise((resolve, reject) => {
            this.promptProvider.fire({
                title: 'Failed to add products!',
                text: failedToAddProducts.join(', '),
                showCancelButton: false,
                confirmButtonText: 'OK',
                customClass: {
                    container: 'smart-basket-missing-product-warning',
                    confirmButton: 'smart-basket-accept',
                }
            }).then(resolve).catch(reject);
        });
    }
}