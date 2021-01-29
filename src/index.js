import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";

import SaveCartButtonCreator from "./lib/ui/saveCartButtonCreator";
import AppendCartButtonCreator from "./lib/ui/appendCartButtonCreator";

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

    let rimiCartButtons = document.querySelectorAll("button[name='cart']");
    Array.from(rimiCartButtons).forEach((button) => {
        button.addEventListener('click', (event) => {
            if (event.target.ignoreClickOverride || rimi.dom.isInSavedCart()) {
                return;
            }

            if (rimi.dom.getCurrentCart().products.length === 0) {
                return;
            }

            event.stopPropagation();
            event.preventDefault();

            sa2.fire({
                text: 'Are you sure you want to abandon your current basket?',
                showCancelButton: true,
                confirmButtonText: `Yes`,
                customClass: {
                    container: 'smart-basket-confirm-action',
                    confirmButton: 'smart-basket-accept',
                    cancelButton: 'smart-basket-cancel'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    event.target.ignoreShit = true;
                    event.target.click();
                }
            })
        })
    });
})();
