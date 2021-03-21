import CartUpdateValidator from "../cart/cartUpdateValidator";
import ProductListHTMLBuilder from "../ui/productListHTMLBuilder";

import productAdditionWarningFooter from '../../static/product-addition-warning-footer.html';

export function notifyUserIfCartUpdateFailed(rimiDOM, cartUpdate, promptService) {
    const currentProducts = rimiDOM.getCurrentCart().products;
    const validator = new CartUpdateValidator(currentProducts, cartUpdate);

    if (validator.hasProductUpdateFailed()) {
        const listBuilder = new ProductListHTMLBuilder(validator.getFailedProducts());
        promptService.notifyProductAdditionFailed(listBuilder.build(), productAdditionWarningFooter);
    }
}
