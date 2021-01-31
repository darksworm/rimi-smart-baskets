import sweetalert2 from 'sweetalert2/dist/sweetalert2.js'
import {Notyf} from 'notyf';

import CSSInjector from "./lib/generic/cssInjector"

import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";

import SaveCartButtonCreator from "./lib/ui/saveCartButtonCreator";
import AppendCartButtonCreator from "./lib/ui/appendCartButtonCreator";
import CartAbandonmentConfirmer from "./lib/ui/cartAbandonmentConfirmer";
import CartUpdateValidator from "./lib/cart/cartUpdateValidator";

import CartUpdateProgressIndicator from "./lib/ui/cartUpdateProgressIndicator";
import NotificationService from "./lib/ui/notificationService";
import PromptService from "./lib/ui/promptService";

import sweetalert2CSS from 'sweetalert2/dist/sweetalert2.css'
import notyfCSS from 'notyf/notyf.min.css'
import smartBasketCSS from './static/style.css'
import cartSVG from './static/cart.svg'

(function () {
    "use strict";

    const rimi = new Rimi(window, axios);
    const cartStorage = new CartStorage(localStorage);

    const notificationService = new NotificationService(new Notyf());
    const promptService = new PromptService(sweetalert2);

    let externalStylesheets = [smartBasketCSS, notyfCSS, sweetalert2CSS];
    new CSSInjector(document).injectMultiple(externalStylesheets);

    if (rimi.dom.isInSavedCart()) {
        const creator = new SaveCartButtonCreator(document, cartStorage, rimi.dom);
        creator.setNotificationHandler(notificationService);
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
            let failedProducts = validator.getFailedProducts();

            let ul = document.createElement('ul');
            for (let product of failedProducts) {
                let li = document.createElement('li');
                let a = document.createElement('a');
                a.href = "https://www.rimi.lv/e-veikals/lv/produkti/p/" + product.id;
                a.target = "_blank";
                a.innerHTML = product.name;
                li.appendChild(a);
                ul.appendChild(li);
            }
            
            let body = ul.outerHTML;
            let footer = '<div style="text-align: center;">These products could not be added because they are unavailable or you\'ve reached their purchasing limit.</div>';

            promptService.notifyProductAdditionFailed(body, footer);
        }
    }
})();
