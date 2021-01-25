export default class CartAppendButtonCreator {
    constructor(document, buttonContents) {
        this.document = document;
        this.buttonContents = buttonContents;
    }

    addToRimiButtons(rimiButtons, clickMethodGenerator) {
        for (let button of rimiButtons) {
            let buttonId = button.value;
            this._addButton(button, clickMethodGenerator(buttonId))
        }
    }

    _addButton(parentElement, onClick) {
        let smartBasketAdd = this.document.createElement('span');
        smartBasketAdd.innerHTML = this.buttonContents;
        smartBasketAdd.className = 'smart-basket-add';
        smartBasketAdd.addEventListener('click', onClick);
        parentElement.append(smartBasketAdd);
    }
}

