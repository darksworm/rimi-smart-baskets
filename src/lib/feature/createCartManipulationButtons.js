import SaveCartButtonCreator from "../ui/saveCartButtonCreator";
import AppendCartButtonCreator from "../ui/appendCartButtonCreator";
import CartUpdateProgressIndicator from "../ui/cartUpdateProgressIndicator";
import RemoveBtnCreator from "../cart/removeBtnCreator";
import CartRemover from "../cart/cartRemover";

import cartSVG from '../../static/cart.svg';
import trashSVG from '../../static/trash.svg';

export function createCartManipulationButtons(document, rimi, cartStorage, promptService) {
    if (rimi.dom.isInSavedCart()) {
        createSaveCartInSmartCartsButton(document, cartStorage, rimi.dom, promptService);
    } else {
        createAppendCartButtons(document, cartStorage, rimi);
    }

    createSavedCartRemoveButtons(document, rimi.api, promptService);
}

function createSaveCartInSmartCartsButton(document, cartStorage, rimiDOM, promptService) {
    const creator = new SaveCartButtonCreator(document, cartStorage, rimiDOM);

    creator.setNotificationHandler(promptService);
    creator.createButton();
}

function createAppendCartButtons(document, cartStorage, rimi) {
    const creator = new AppendCartButtonCreator(document, cartStorage, rimi);
    const progressIndicator = new CartUpdateProgressIndicator(document, rimi.refresh.bind(rimi));

    creator.setProgressHandler(progressIndicator);
    creator.createButtons(cartSVG);
}

function createSavedCartRemoveButtons (document, rimiAPI, promptService) {
    const removeBtnCreator = new RemoveBtnCreator(document);
    const cartRemover = new CartRemover(document, rimiAPI, promptService);

    removeBtnCreator.createButtons(
        trashSVG,
        cartRemover.promptAndRemoveCart.bind(cartRemover)
    );
}
