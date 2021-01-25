export default class LoadingIndicator {
    constructor(document, elementId) {
        this.document = document;
        this.elementId = elementId || 'smart-basket-loader';
    }

    _removeExistingIndicator() {
        let container = this.document.getElementById(this.elementId);
        if (container) {
            container.remove();
        }
    }

    _createIndicator() {
        let container = this.document.createElement('div');
        container.id = this.elementId;
        container.className = 'loader-container';
        container.innerHTML = '<div id="loader-text"></div><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
        return container;
    }

    show() {
        this._removeExistingIndicator();
        let indicator = this._createIndicator();
        this.document.body.appendChild(indicator);
    }

    updateText(text) {
        this.document.getElementById('loader-text').innerHTML = text;
    }
}