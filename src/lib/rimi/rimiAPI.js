import rimiURLs from "./rimiURLs";

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
            rimiURLs.changeCart(),
            this._getProductPutData(productId, amount, step),
            this._getAxiosConfig()
        );
    }

    async removeSavedCart(cartId) {
        return this.axios.post(
            rimiURLs.deleteCart(),
            this._getRemoveSavedCartPostData(cartId),
            this._getAxiosConfig()
        );
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

    _getRemoveSavedCartPostData(cartId) {
        return {
            "code": cartId,
            "_method": "delete",
            "_token": this.token
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