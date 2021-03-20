import CartAbandonmentConfirmer from "../ui/cartAbandonmentConfirmer";

export function promptUserWhenAboutToAbandonCart(document, rimiDOM, promptService) {
    const confirmer = new CartAbandonmentConfirmer(document, rimiDOM, promptService);
    confirmer.bindToCartChangeButtons();
}
