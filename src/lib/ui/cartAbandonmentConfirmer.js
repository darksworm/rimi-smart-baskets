export default class CartAbandonmentConfirmer {
    constructor(document, rimiDOM, promptService) {
        this.userAcceptedAbandonment = false;
        this.document = document;
        this.rimiDOM = rimiDOM;
        this.promptService = promptService;
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

    askForAbandonmentConfirmation(clickedCartElement) {
        this.promptService.promptCartAbandonment().then((result) => {
            if (result) {
                this.abandonCart(clickedCartElement);
            }
        })
    }

    abandonCart(clickedCartElement) {
        this.userAcceptedAbandonment = true;
        clickedCartElement.click();
    }

    stopEventExecution(event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

