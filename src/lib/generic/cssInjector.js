export default class CSSInjector {
    constructor(document) {
        this.document = document;
    }

    injectMultiple(stylesheets) {
        for (let sheet of stylesheets) {
            this.inject(sheet);
        }
    }

    inject(content) {
        let element = this.document.createElement('style');
        element.classList.add('smart-baskets-style');
        element.textContent = content;
        this.document.head.append(element);
    }
}
