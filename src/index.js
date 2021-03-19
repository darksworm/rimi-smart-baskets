import CSSInjector from "./lib/generic/cssInjector"

import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";

import SaveCartButtonCreator from "./lib/ui/saveCartButtonCreator";
import AppendCartButtonCreator from "./lib/ui/appendCartButtonCreator";
import CartAbandonmentConfirmer from "./lib/ui/cartAbandonmentConfirmer";
import CartUpdateValidator from "./lib/cart/cartUpdateValidator";

import ProductListHTMLBuilder from "./lib/ui/productListHTMLBuilder";
import CartUpdateProgressIndicator from "./lib/ui/cartUpdateProgressIndicator";

import RemoveBtnCreator from "./lib/cart/removeBtnCreator";
import CartRemover from "./lib/cart/cartRemover";

import PromptService from "./lib/ui/promptService";

import notyfCSS from 'notyf/notyf.min.css';
import smartBasketCSS from './static/style.css';
import cartSVG from './static/cart.svg';
import trashSVG from './static/trash.svg';
import productAdditionWarningFooter from './static/product-addition-warning-footer.html';

(function () {
    "use strict";

    const rimi = new Rimi(window, axios);

    if (false === rimi.dom.isLoggedIn()) {
        return rimi.dom.redirectToLoginPage();
    }

    const cartStorage = new CartStorage(localStorage);
    const promptService = new PromptService(Swal, new Notyf());

    let externalStylesheets = [smartBasketCSS, notyfCSS];
    new CSSInjector(document).injectMultiple(externalStylesheets);

    if (rimi.dom.isInSavedCart()) {
        const creator = new SaveCartButtonCreator(document, cartStorage, rimi.dom);
        creator.setNotificationHandler(promptService);
        creator.createButton();
    } else {
        const creator = new AppendCartButtonCreator(document, cartStorage, rimi);
        const progressIndicator = new CartUpdateProgressIndicator(document, rimi.refresh.bind(rimi));
        creator.setProgressHandler(progressIndicator);
        creator.createButtons(cartSVG);
    }

    const confirmer = new CartAbandonmentConfirmer(document, rimi.dom, promptService);
    confirmer.bindToCartChangeButtons();

    let cartUpdate = cartStorage.popCartUpdate();
    if (cartUpdate) {
        let validator = new CartUpdateValidator(rimi.dom.getCurrentCart().products, cartUpdate);
        if (validator.hasProductUpdateFailed()) {
            let listBuilder = new ProductListHTMLBuilder(validator.getFailedProducts());
            promptService.notifyProductAdditionFailed(listBuilder.build(), productAdditionWarningFooter);
        }
    }

    const removeBtnCreator = new RemoveBtnCreator(document);
    const cartRemover = new CartRemover(rimi.api, document, promptService);
    removeBtnCreator.createButtons(
        trashSVG,
        cartRemover.promptAndRemoveCart.bind(cartRemover)
    );
})();
