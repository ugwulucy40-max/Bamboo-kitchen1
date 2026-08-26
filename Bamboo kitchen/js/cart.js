// ==========================================
// Bamboo Kitchen
// File: js/cart.js
// Purpose: Shopping Cart
// Part 1
// ==========================================

// Flat delivery fee
const DELIVERY_FEE = 1000;

// DOM Elements
const cartItemsContainer = document.getElementById("cart-items");
const emptyCart = document.getElementById("empty-cart");
const cartContent = document.getElementById("cart-content");

const subtotalElement = document.getElementById("subtotal");
const deliveryElement = document.getElementById("delivery-fee");
const grandTotalElement = document.getElementById("grand-total");

// ==========================================
// Format Currency
// ==========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0
    }).format(amount);

}

// ==========================================
// Display Cart
// ==========================================

function renderCart() {

    const cart = getCart();

    cartItemsContainer.innerHTML = "";

    // Empty Cart
    if (cart.length === 0) {

        emptyCart.style.display = "block";
        cartContent.style.display = "none";

        updateTotals();

        return;
    }

    // Show Cart
    emptyCart.style.display = "none";
    cartContent.style.display = "block";

    cart.forEach(item => {

        const row = document.createElement("div");

        row.className = "cart-item";

        row.innerHTML = `

            <div class="cart-product">

                <img
                    src="${item.image}"
                    alt="${item.name}"
                    class="cart-image">

                <div>

                    <h3>${item.name}</h3>

                    <p>Freshly prepared by Bamboo Kitchen</p>

                </div>

            </div>

            <div class="cart-price">

                ${formatCurrency(item.price)}

            </div>

            <div class="cart-quantity">

                <button
                    class="quantity-btn decrease"
                    data-id="${item.id}">

                    −

                </button>

                <span class="quantity">

                    ${item.quantity}

                </span>

                <button
                    class="quantity-btn increase"
                    data-id="${item.id}">

                    +

                </button>

            </div>

            <div class="cart-total">

                ${formatCurrency(item.price * item.quantity)}

            </div>

            <div>

                <button
                    class="remove-btn"
                    data-id="${item.id}">

                    Remove

                </button>

            </div>

        `;

        cartItemsContainer.appendChild(row);

    });

    updateTotals();

}

// ==========================================
// Bamboo Kitchen
// File: js/cart.js
// Part 2
// Quantity Controls & Remove Items
// ==========================================

// Increase quantity
function increaseQuantity(productId) {

    const cart = getCart();

    const item = cart.find(product => product.id === productId);

    if (item) {
        item.quantity++;
    }

    saveCart(cart);

    renderCart();

    updateCartBadge();

}

// Decrease quantity
function decreaseQuantity(productId) {

    const cart = getCart();

    const item = cart.find(product => product.id === productId);

    if (!item) return;

    if (item.quantity > 1) {

        item.quantity--;

    } else {

        const index = cart.findIndex(product => product.id === productId);

        if (index !== -1) {
            cart.splice(index, 1);
        }

    }

    saveCart(cart);

    renderCart();

    updateCartBadge();

}

// Remove an item completely
function removeItem(productId) {

    const confirmed = confirm(
        "Remove this meal from your cart?"
    );

    if (!confirmed) return;

    const cart = getCart().filter(product => product.id !== productId);

    saveCart(cart);

    renderCart();

    updateCartBadge();

}

// ==========================================
// Attach Button Events
// ==========================================

function attachCartEvents() {

    // Increase buttons

    const increaseButtons = document.querySelectorAll(".increase");

    increaseButtons.forEach(button => {

        button.addEventListener("click", () => {

            increaseQuantity(Number(button.dataset.id));

        });

    });

    // Decrease buttons

    const decreaseButtons = document.querySelectorAll(".decrease");

    decreaseButtons.forEach(button => {

        button.addEventListener("click", () => {

            decreaseQuantity(Number(button.dataset.id));

        });

    });

    // Remove buttons

    const removeButtons = document.querySelectorAll(".remove-btn");

    removeButtons.forEach(button => {

        button.addEventListener("click", () => {

            removeItem(Number(button.dataset.id));

        });

    });

}

// ==========================================
// Re-attach Events After Rendering
// ==========================================

const originalRenderCart = renderCart;

renderCart = function () {

    originalRenderCart();

    attachCartEvents();

};

// ==========================================
// Bamboo Kitchen
// File: js/cart.js
// Part 3
// Totals, Badge & Empty Cart
// ==========================================

// Calculate cart totals
function updateTotals() {

    const cart = getCart();

    let subtotal = 0;

    cart.forEach(item => {

        subtotal += item.price * item.quantity;

    });

    const deliveryFee = cart.length > 0 ? DELIVERY_FEE : 0;

    const grandTotal = subtotal + deliveryFee;

    if (subtotalElement) {
        subtotalElement.textContent = formatCurrency(subtotal);
    }

    if (deliveryElement) {
        deliveryElement.textContent = formatCurrency(deliveryFee);
    }

    if (grandTotalElement) {
        grandTotalElement.textContent = formatCurrency(grandTotal);
    }

}

// ==========================================
// Update Cart Badge
// ==========================================

function updateCartBadge() {

    const badge = document.getElementById("cart-count");

    if (!badge) return;

    const cart = getCart();

    const totalItems = cart.reduce((total, item) => {

        return total + item.quantity;

    }, 0);

    badge.textContent = totalItems;

}

// ==========================================
// Show or Hide Empty Cart
// ==========================================

function toggleEmptyCart() {

    const cart = getCart();

    if (cart.length === 0) {

        if (emptyCart) {
            emptyCart.style.display = "block";
        }

        if (cartContent) {
            cartContent.style.display = "none";
        }

    } else {

        if (emptyCart) {
            emptyCart.style.display = "none";
        }

        if (cartContent) {
            cartContent.style.display = "block";
        }

    }

}

// ==========================================
// Bamboo Kitchen
// File: js/cart.js
// Part 4
// Initialize Shopping Cart
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Check that the required functions exist
    if (typeof getCart !== "function") {
        console.error("storage.js is not loaded.");
        return;
    }

    // Render cart items
    renderCart();

    // Update totals
    updateTotals();

    // Update cart badge
    updateCartBadge();

    // Toggle empty cart if necessary
    toggleEmptyCart();

});

// ==========================================
// Continue Shopping Button
// ==========================================

const continueButton = document.querySelector(".btn-secondary");

if (continueButton) {

    continueButton.addEventListener("click", () => {

        window.location.href = "index.html#menu";

    });

}

// ==========================================
// Checkout Button
// ==========================================

const checkoutButton = document.querySelector(".btn-primary");

if (checkoutButton) {

    checkoutButton.addEventListener("click", (event) => {

        const cart = getCart();

        if (cart.length === 0) {

            event.preventDefault();

            alert("Your cart is empty. Please add some meals before checking out.");

            return;

        }

        // The link in cart.html will take the user
        // to checkout.html when the cart contains items.

    });

}

// ==========================================
// End of File
// ==========================================
