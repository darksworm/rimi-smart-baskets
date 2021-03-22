export function storeOpenedSavedCart(rimiDOM, cartStorage) {
    if (rimiDOM.isInSavedCart()) {
        cartStorage.storeCart(rimiDOM.getCurrentCart());
    }
}