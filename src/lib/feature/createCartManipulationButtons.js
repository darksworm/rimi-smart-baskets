import AppendCartButtonCreator from "../ui/appendCartButtonCreator";
import CartUpdateProgressIndicator from "../ui/cartUpdateProgressIndicator";
import RemoveCartButtonCreator from "../cart/removeCartButtonCreator";
import CartRemover from "../cart/cartRemover";

import cartSVG from '../../static/cart.svg';
import removeSVG from '../../static/remove.svg';

export function createCartManipulationButtons(document, rimi, cartStorage, promptService) {
    if (!rimi.dom.isInSavedCart()) {
        createAppendCartButtons(document, cartStorage, rimi);
    }

    createSavedCartRemoveButtons(document, rimi.api, promptService);
}

function createAppendCartButtons(document, cartStorage, rimi) {
    const creator = new AppendCartButtonCreator(document, cartStorage, rimi);
    const progressIndicator = new CartUpdateProgressIndicator(document, rimi.refresh.bind(rimi));

    creator.setProgressHandler(progressIndicator);
    creator.createButtons(cartSVG);
}

function createSavedCartRemoveButtons (document, rimiAPI, promptService) {
    const removeBtnCreator = new RemoveCartButtonCreator(document);
    const cartRemover = new CartRemover(document, rimiAPI, promptService);

    removeBtnCreator.createButtons(
        removeSVG,
        cartRemover.promptAndRemoveCart.bind(cartRemover)
    );
}
