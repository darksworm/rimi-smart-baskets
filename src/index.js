import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";

import SaveCartButtonCreator from "./lib/ui/saveCartButtonCreator";
import AppendCartButtonCreator from "./lib/ui/appendCartButtonCreator";
import CartAbandonmentConfirmer from "./lib/ui/cartAbandonmentConfirmer";

import CSSInjector from "./lib/generic/cssInjector"

import CartUpdateProgressIndicator from "./lib/ui/cartUpdateProgressIndicator";
import NotificationService from "./lib/generic/notificationService";

import sa2 from 'sweetalert2/dist/sweetalert2.js'
import {Notyf} from 'notyf';

import sa2css from 'sweetalert2/dist/sweetalert2.css'
import notyfStylesheet from 'notyf/notyf.min.css'
import stylesheet from './static/style.css'
import cartSVG from './static/cart.svg'

(function () {
    "use strict";

    const rimi = new Rimi(window, axios);
    const cartStorage = new CartStorage(localStorage);
    const notificationService = new NotificationService(new Notyf());

    new CSSInjector(document, stylesheet).inject();
    new CSSInjector(document, notyfStylesheet).inject();
    new CSSInjector(document, sa2css).inject();

    if (rimi.dom.isInSavedCart()) {
        const creator = new SaveCartButtonCreator(document, cartStorage, rimi.dom);
        creator.setNotificationHandler(notificationService);
        creator.createButton();
    } else {
        const creator = new AppendCartButtonCreator(document, cartStorage, rimi);
        const progressHandler = new CartUpdateProgressIndicator(document, rimi.refresh.bind(rimi));
        creator.setProgressHandler(progressHandler);
        creator.createButtons(cartSVG);
    }

    const confirmer = new CartAbandonmentConfirmer(document, rimi.dom, sa2);
    confirmer.bindToCartChangeButtons();
})();
