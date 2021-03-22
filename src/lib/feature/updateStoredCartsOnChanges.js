import DOMCartChangeListener from "../cart/DOMCartChangeListener";
import MutationObserver from "mutation-observer";
import {storeOpenedSavedCart} from "./storeOpenedSavedCart";

export function updateStoredCartsOnChanges(document, rimiDOM, cartStorage) {
    if (rimiDOM.isInSavedCart()) {
        startCartChangeListener(document, rimiDOM, cartStorage);
    }
}

function startCartChangeListener(document, rimiDOM, cartStorage) {
    new DOMCartChangeListener(
        document,
        MutationObserver,
        () => storeOpenedSavedCart(rimiDOM, cartStorage)
    ).startListening();
}