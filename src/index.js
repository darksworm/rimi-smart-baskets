import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";
import SaveCartButton from "./lib/ui/saveCartButton";
import AppendCartButtonCreator from "./lib/ui/appendCartButtonCreator";
import CartUpdateProgressIndicator from "./lib/ui/cartUpdateProgressIndicator";
import CSSInjector from "./lib/generic/cssInjector"

import NotificationService from "./lib/generic/notificationService";
import { Notyf } from 'notyf';

import stylesheet from './static/style.css'
import notyfStylesheet from 'notyf/notyf.min.css'
import cartSVG from './static/cart.svg'

(function() {
    "use strict";

    const rimi = new Rimi(window, axios);
    const cartStorage = new CartStorage(localStorage);
    const notificationService = new NotificationService(new Notyf());

    new CSSInjector(document, stylesheet).inject();
    new CSSInjector(document, notyfStylesheet).inject();

    if (rimi.dom.isInSavedCart()) {
        function storeCurrentCart() {
            let currentCart = rimi.dom.getCurrentCart();
            let cartAlreadyStored = cartStorage.isCartStored(currentCart.id);

            cartStorage.storeCart(currentCart);

            let message = `Cart "${currentCart.name}" ${cartAlreadyStored ? 'has been updated' : 'is now stored'} in "Smart Baskets"`;
            notificationService.success(message, 2000);
        }

        let currentCartId = rimi.dom.getCurrentCart().id;
        let currentCartIsStored = cartStorage.isCartStored(currentCartId);

        new SaveCartButton(
            document,
            storeCurrentCart,
            currentCartIsStored ? 'Update cart in "Smart Baskets"' : 'Save cart in "Smart Baskets"'
        ).place();
    } else {
        const creator = new AppendCartButtonCreator(document, cartStorage, rimi);
        const progressHandler = new CartUpdateProgressIndicator(document, rimi.refresh.bind(rimi));
        creator.setProgressHandler(progressHandler);
        creator.createCartAppendButtons(cartSVG);
    }
})();
