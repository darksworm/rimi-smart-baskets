import rimiURLs from "../rimi/rimiURLs";

export default class ProductListHTMLBuilder {
    constructor(products) {
        this.products = products;
    }

    build() {
        let container = document.createElement('ul');
        this.appendProducts(container);
        return container.outerHTML;
    }

    appendProducts(container) {
        for (let product of this.products) {
            this.appendOne(container, product);
        }
    }

    appendOne(container, product) {
        let li = document.createElement('li');
        let anchor = this.makeProductAnchor(product);
        li.appendChild(anchor);
        container.appendChild(li);
    }

    makeProductAnchor(product) {
        let anchor = document.createElement('a');
        anchor.href = rimiURLs.productPage(product.id);
        anchor.target = "_blank";
        anchor.innerHTML = product.name;

        return anchor;
    }
}
