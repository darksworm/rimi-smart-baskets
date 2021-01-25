export default class CSSInjector {
    constructor(document, content) {
        this.document = document;
        this.content = content;
    }

    inject() {
        let element = this.document.createElement('style');
        element.textContent = this.content;
        this.document.head.append(element);
    }
}
