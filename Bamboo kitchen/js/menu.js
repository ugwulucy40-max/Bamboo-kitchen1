/*
=========================================
Bamboo Kitchen
js/menu.js
Purpose: Make every "Order" button add its
item to the cart. Reads everything it needs
directly from the button itself (data-id,
data-name, data-price, data-image) — no
dependency on any particular page layout.
=========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const orderButtons = document.querySelectorAll(".order-btn");

    if (orderButtons.length === 0) {
        return;
    }

    orderButtons.forEach(button => {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            // Support either data-id (menu.html) or
            // data-product-id (index.html).
            const rawId = this.dataset.id ?? this.dataset.productId;
            const id = Number(rawId);

            let product = null;

            // If the button itself carries name/price directly
            // (menu.html's style), use that.
            if (this.dataset.name && this.dataset.price) {

                product = {
                    id,
                    name: this.dataset.name,
                    price: Number(this.dataset.price),
                    image: this.dataset.image,
                    quantity: 1
                };

            } else if (typeof products !== "undefined") {

                // Otherwise, look it up in the products.js catalogue
                // (index.html's homepage buttons work this way —
                // they only carry a data-product-id).
                const found = products.find(p => p.id === id);

                if (found) {
                    product = { ...found, quantity: 1 };
                }

            }

            if (!product || !product.id || !product.name || isNaN(product.price)) {
                alert("Sorry, this meal could not be found.");
                return;
            }

            // addToCart() comes from js/storage.js
            addToCart(product);

        });

    });

});