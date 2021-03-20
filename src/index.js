import Rimi from "./lib/rimi/rimi";
import CartStorage from "./lib/cart/cartStorage";
import PromptService from "./lib/ui/promptService";

import {createCartManipulationButtons} from "./lib/feature/createCartManipulationButtons";
import {notifyUserIfCartUpdateFailed} from "./lib/feature/notifyUserIfCartUpdateFailed";
import {promptUserWhenAboutToAbandonCart} from "./lib/feature/promptUserWhenAboutToAbandonCart";
import {injectCustomStyles} from "./lib/feature/injectCustomStyles";

(function () {
    "use strict";
    const rimi = new Rimi(window, axios);
    const cartStorage = new CartStorage(localStorage);
    const promptService = new PromptService(Swal, new Notyf());

    rimi.dom.forceUserLogin();

    injectCustomStyles(document);
    createCartManipulationButtons(document, rimi, cartStorage, promptService);
    promptUserWhenAboutToAbandonCart(document, rimi.dom, promptService);
    notifyUserIfCartUpdateFailed(rimi.dom, cartStorage, promptService);
})();
