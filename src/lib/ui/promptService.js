export default class PromptService {
    constructor(promptProvider, notificationProvider) {
        this.promptProvider = promptProvider;
        this.notificationProvider = notificationProvider;
    }

    notifySuccess(message, duration) {
        this.notificationProvider.success({
            message: message,
            duration: duration,
            className: "rimi-smart-basket-notification success",
            position: {
                x: 'right',
                y: 'top'
            }
        })
    }

    notifyError(message, duration) {
        this.notificationProvider.error({
            message: message,
            duration: duration,
            className: "rimi-smart-basket-notification error",
            position: {
                x: 'right',
                y: 'top'
            }
        })
    }

    notifyProductAdditionFailed(body, footer) {
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
        })
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
                if (result.isConfirmed) {
                    resolve();
                } else {
                    reject();
                }
            }).catch(reject);
        })
    }
}