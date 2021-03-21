import ProductPainter from "../ui/productPainter";

export function accentUpdatedProducts(document, cartUpdate) {
    const productIds = cartUpdate.map(x => x.id);
    new ProductPainter(document).paint(productIds, "smart-basket-newly-added-product");
}
