export default class PromptService {
    constructor (promptProvider) {
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
}