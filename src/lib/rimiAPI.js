export default class RimiAPI {
    constructor(token, csrfToken, axios) {
        if (typeof token === 'undefined' || typeof csrfToken === 'undefined' || typeof axios === 'undefined') {
            throw new Error('please pass the token and xsrfToken and axios');
        }

        this.token = token;
        this.csrfToken = csrfToken;
        this.axios = axios;
    }

    async updateProduct(productId, amount = 1, step = 1) {
        return this.axios.put(
            this._getProductChangeURL(),
            this._getProductPutData(productId, amount, step),
            this._getAxiosConfig()
        );
    }

    _getProductChangeURL() {
        return "https://www.rimi.lv/e-veikals/cart/change";
    }

    _getProductPutData(productId, amount, step) {
        return {
            "_method": "put",
            "_token": this.token,
            "amount": amount,
            "step": step,
            "product": productId
        };
    }

    _getAxiosConfig() {
        return {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'x-csrf-token': this.csrfToken
            }
        }
    }
}