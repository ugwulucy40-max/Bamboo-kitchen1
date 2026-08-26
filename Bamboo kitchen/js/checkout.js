/*=========================================
    Bamboo Kitchen
    checkout.js
=========================================*/

// Delivery fee
const DELIVERY_FEE = 1500;

// Load cart via js/storage.js (single source of truth for the cart)
let cart = getCart();

// HTML Elements
const checkoutItems = document.getElementById("checkoutItems");
const subtotalElement = document.getElementById("subtotal");
const totalElement = document.getElementById("totalPrice");
const placeOrderButton = document.getElementById("placeOrderBtn");

// Display cart items
function displayCheckoutItems() {

    if (!checkoutItems) return;

    if (cart.length === 0) {

        checkoutItems.innerHTML = `
            <p>Your cart is empty.</p>
        `;

        subtotalElement.textContent = "₦0.00";
        totalElement.textContent = "₦0.00";

        return;
    }

    let subtotal = 0;

    checkoutItems.innerHTML = "";

    cart.forEach(item => {

        const total = item.price * item.quantity;

        subtotal += total;

        checkoutItems.innerHTML += `
            <div class="checkout-item">

                <div>

                    <h4>${item.name}</h4>

                    <small>₦${item.price.toLocaleString()} × ${item.quantity}</small>

                </div>

                <strong>

                    ₦${total.toLocaleString()}

                </strong>

            </div>
        `;

    });

    subtotalElement.textContent =
        "₦" + subtotal.toLocaleString();

    totalElement.textContent =
        "₦" + (subtotal + DELIVERY_FEE).toLocaleString();

}

// Generate Order ID
function generateOrderId() {

    const random = Math.floor(Math.random() * 900000) + 100000;

    return "BK" + random;

}

// Place Order
async function placeOrder() {

    if (cart.length === 0) {

        alert("Your shopping cart is empty.");

        return;

    }

    const customerName =
        document.getElementById("customerName").value.trim();

    const customerPhone =
        document.getElementById("customerPhone").value.trim();

    const customerAddress =
        document.getElementById("customerAddress").value.trim();

    const customerEmail =
        document.getElementById("customerEmail").value.trim();

    const orderNotes =
        document.getElementById("orderNotes").value.trim();

    if (
        customerName === "" ||
        customerPhone === "" ||
        customerAddress === ""
    ) {

        alert("Please complete all required fields.");

        return;

    }

    const subtotal = cart.reduce((sum, item) => {

        return sum + (item.price * item.quantity);

    }, 0);

    const orderId = generateOrderId();

    const order = {

        order_code: orderId,

        customer_name: customerName,

        customer_phone: customerPhone,

        customer_email: customerEmail || null,

        customer_address: customerAddress,

        order_notes: orderNotes || null,

        items: cart,

        subtotal,

        delivery_fee: DELIVERY_FEE,

        total: subtotal + DELIVERY_FEE,

        status: "Order Received"

    };

    // Disable the button while we talk to Supabase, so a slow
    // connection can't lead to the same order being submitted twice.

    const originalButtonHTML = placeOrderButton.innerHTML;

    placeOrderButton.disabled = true;
    placeOrderButton.textContent = "Placing your order...";

    let insertError = null;

    try {

        const result = await supabaseClient
            .from("orders")
            .insert(order);

        insertError = result.error;

    } catch (thrownError) {

        insertError = thrownError;

    }

    placeOrderButton.disabled = false;
    placeOrderButton.innerHTML = originalButtonHTML;

    if (insertError) {

        console.error(insertError);

        const detail =
            insertError.message ||
            insertError.error_description ||
            JSON.stringify(insertError);

        alert(
            "Sorry, we couldn't place your order.\n\n" +
            "Details: " + detail
        );

        return;

    }

    // Keep a local copy too, so the confirmation modal and
    // track-order page have something to show immediately.

    localStorage.setItem(
        "latestOrder",
        JSON.stringify({ ...order, createdAt: new Date().toLocaleString() })
    );

    // Clear cart

    clearCart();

    cart = [];

    updateCartBadge();

    // Show confirmation modal instead of an instant redirect

    showConfirmationModal(orderId);

    // Send the SMS/WhatsApp notification in the background. If this
    // fails (e.g. Termii is down), the order itself already
    // succeeded, so we don't want to alarm the customer about it —
    // just log it for you to notice.

    supabaseClient.functions
        .invoke("send-order-notification", {
            body: {
                phone: customerPhone,
                order_code: orderId,
                status: "Order Received"
            }
        })
        .then(({ error: notifyError }) => {

            if (notifyError) {
                console.error("Order notification failed:", notifyError);
            }

        });

}

// Show order confirmation modal

function showConfirmationModal(orderId) {

    const modal = document.getElementById("confirmationModal");
    const orderIdEl = document.getElementById("generatedOrderId");
    const trackLink = document.getElementById("trackOrderLink");

    if (orderIdEl) orderIdEl.textContent = orderId;

    if (trackLink) {
        trackLink.href = "track-order.html?order=" + orderId;
    }

    if (modal) {
        modal.classList.add("active");
        document.body.classList.add("modal-open");
    }

}

// Mobile navigation toggle

function setupMobileNav() {

    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener("click", () => {

        navMenu.classList.toggle("active");
        menuToggle.classList.toggle("active");

    });

}

// Event Listener

if (placeOrderButton) {

    placeOrderButton.addEventListener(

        "click",

        placeOrder

    );

}

// Load Checkout

displayCheckoutItems();
updateCartBadge();
setupMobileNav();