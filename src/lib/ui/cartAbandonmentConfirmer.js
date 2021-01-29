export default class CartAbandonmentConfirmer {
    constructor(document, rimiDOM, sa2) {
        this.document = document;
        this.rimiDOM = rimiDOM;
        this.sa2 = sa2;
        this.userAcceptedAbandonment = false;
    }

    bindToCartChangeButtons() {
        let rimiCartButtons = this.getRimiCartOpenButtons();
        this.overrideClickForAll(rimiCartButtons);
    }

    getRimiCartOpenButtons() {
        return this.document.querySelectorAll("button[name='cart']");
    }

    overrideClickForAll(rimiCartButtons) {
        for (let button of rimiCartButtons) {
            this.overrideClick(button);
        }
    }

    overrideClick(button) {
        button.addEventListener('click', this.buttonClickHandler.bind(this));
    }

    isUserAboutToAbandonUnsavedCart() {
        if (this.userAcceptedAbandonment) {
            return false;
        }

        if (this.rimiDOM.isInSavedCart()) {
            return false;
        }

        return false === this.rimiDOM.isCurrentCartEmpty();
    }

    buttonClickHandler(event) {
        if (this.isUserAboutToAbandonUnsavedCart()) {
            this.stopEventExecution(event);
            this.askForAbandonmentConfirmation(event.target);
        }
    }

    askForAbandonmentConfirmation(clickTarget) {
        this.sa2.fire({
            text: 'Are you sure you want to abandon your current basket?',
            showCancelButton: true,
            confirmButtonText: `Yes`,
            customClass: {
                container: 'smart-basket-confirm-action',
                confirmButton: 'smart-basket-accept',
                cancelButton: 'smart-basket-cancel'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.userAcceptedAbandonment = true;
                clickTarget.click();
            }
        })
    }

    stopEventExecution(event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

