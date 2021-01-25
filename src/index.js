import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";
import SaveCartButton from "./lib/ui/saveCartButton";
import AppendCartButtonCreator from "./lib/ui/appendCartButtonCreator";
import CartUpdateProgressIndicator from "./lib/ui/cartUpdateProgressIndicator";
import CSSInjector from "./lib/generic/cssInjector"

import stylesheet from './static/style.css'
import cartSVG from './static/cart.svg'

(function() {
    "use strict";

    const rimi = new Rimi(window, axios);
    const cartStorage = new CartStorage(localStorage);

    new CSSInjector(document, stylesheet).inject();

    if (rimi.dom.isInSavedCart()) {
        function storeCurrentCart() {
            cartStorage.storeCart(rimi.dom.getCurrentCart());
        }
        new SaveCartButton(document, storeCurrentCart).place();
    } else {
        const creator = new AppendCartButtonCreator(document, cartStorage, rimi);
        const progressHandler = new CartUpdateProgressIndicator(document, rimi.refresh.bind(rimi));
        creator.setProgressHandler(progressHandler);
        creator.createCartAppendButtons(cartSVG);
    }
})();
