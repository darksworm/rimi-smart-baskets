import RimiAPI from "./rimiAPI";
import RimiDOM from "./rimiDOM";
import rimiURLs from "./rimiURLs";

export default class Rimi {
    constructor(window, axios) {
        this.window = window;
        this.api = new RimiAPI(this._getToken(), this._getCSRFToken(), axios);
        this.dom = new RimiDOM(window);
    }

    _getToken() {
        return this.window.document.querySelector("input[name='_token']").value;
    }

    _getCSRFToken() {
        return this.window.document.querySelector('meta[name="csrf-token"]')
            .getAttribute('content');
    }

    _getLanguage() {
        return this.window.document.querySelector('html').getAttribute('lang');
    }

    refresh() {
        this.window.location.href = rimiURLs.refreshCart(this._getLanguage());
    }
}

