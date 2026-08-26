// ==========================================
// Bamboo Kitchen
// File: js/storage.js
// Purpose: Manage shopping cart using Local Storage
// ==========================================

const CART_KEY = "bambooKitchenCart";

/**
 * Get the current cart from Local Storage.
 * Returns an array of cart items.
 */
function getCart() {
    const cart = localStorage.getItem(CART_KEY);

    if (cart) {
        return JSON.parse(cart);
    }

    return [];
}

/**
 * Save the cart to Local Storage.
 * @param {Array} cart
 */
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Empty the shopping cart.
 */
function clearCart() {
    localStorage.removeItem(CART_KEY);
}

/**
 * Get the total number of items in the cart.
 * Example:
 * 2 Jollof + 3 Fried Rice = 5
 */
function getCartCount() {

    const cart = getCart();

    let total = 0;

    cart.forEach(item => {
        total += item.quantity;
    });

    return total;
}

/**
 * Update the cart badge displayed in the navigation.
 */
function updateCartBadge() {

    const badge = document.getElementById("cart-count");

    if (!badge) return;

    badge.textContent = getCartCount();
}

/**
 * Add a product to the cart.
 * If it already exists, increase the quantity.
 *
 * @param {Object} product
 */
function addToCart(product) {

    const cart = getCart();

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });

    }

    saveCart(cart);

    updateCartBadge();

    alert(`${product.name} has been added to your cart.`);
}

/**
 * Remove one product completely.
 * @param {Number} productId
 */
function removeFromCart(productId) {

    const cart = getCart().filter(item => item.id !== productId);

    saveCart(cart);

    updateCartBadge();
}

/**
 * Calculate the total price.
 */
function getCartTotal() {

    const cart = getCart();

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    return total;
}

/**
 * Initialize the cart badge
 * whenever the page loads.
 */
document.addEventListener("DOMContentLoaded", () => {
    updateCartBadge();
});