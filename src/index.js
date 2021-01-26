import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";
import {SaveCartButtonCreator} from "./lib/ui/saveCartButton";
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
        const creator = new SaveCartButtonCreator(document, cartStorage, rimi.dom);
        creator.setNotificationHandler(notificationService);
        creator.createButton();
    } else {
        const creator = new AppendCartButtonCreator(document, cartStorage, rimi);
        const progressHandler = new CartUpdateProgressIndicator(document, rimi.refresh.bind(rimi));
        creator.setProgressHandler(progressHandler);
        creator.createCartAppendButtons(cartSVG);
    }
})();
