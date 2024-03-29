export default {
    'changeCart': () => 'https://www.rimi.lv/e-veikals/cart/change',
    'deleteCart': () => 'https://www.rimi.lv/e-veikals/lv/mans-konts/mani-produkti/saved-carts/delete',
    'productPage': (productId) => `https://www.rimi.lv/e-veikals/lv/produkti/p/${productId}`,
    'refreshCart': (languageCode) => `https://www.rimi.lv/e-veikals/${languageCode}/checkout/refresh`
}