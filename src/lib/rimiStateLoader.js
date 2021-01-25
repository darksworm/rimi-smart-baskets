export default class RimiStateLoader {
    constructor(window) {
        this.window = window;
    }

    getToken() {
        return this.window.document.querySelector("input[name='_token']").value;
    }

    getCSRFToken() {
        return this.window.document.querySelector('meta[name="csrf-token"]')
            .getAttribute('content');
    }

    getLanguage() {
        return this.window.document.querySelector('html').getAttribute('lang');
    }
}