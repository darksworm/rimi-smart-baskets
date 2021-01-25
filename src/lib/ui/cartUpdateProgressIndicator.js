import LoadingIndicator from "./loadingIndicator";

export default class CartUpdateProgressIndicator {
    constructor(document, completedCallback) {
        this.indicator = new LoadingIndicator(document);
        this.completedCallback = completedCallback;
    }

    onStart() {
        this.indicator.show()
    }

    onProgress(done, total) {
        this.indicator.updateText(`Adding product ${done} / ${total}`)
    }

    onComplete() {
        this.indicator.updateText('Refreshing cart');
        this.completedCallback();
    }
}