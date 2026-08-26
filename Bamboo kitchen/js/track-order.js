/*
=========================================
Bamboo Kitchen
js/track-order.js
Purpose: Look up a real order by its
order code and show its live status,
via the get_order_status() function
(see sql/track_order_function.sql).
=========================================
*/

const STATUS_STEPS = [
    "Order Received",
    "Preparing Food",
    "Cooking",
    "Ready for Pickup",
    "Out for Delivery",
    "Delivered"
];

const button = document.getElementById("trackButton");
const orderInput = document.getElementById("orderId");
const result = document.getElementById("trackingResult");
const progress = document.getElementById("progressSection");
const statusText = document.getElementById("statusText");
const displayOrderId = document.getElementById("displayOrderId");
const steps = document.querySelectorAll(".step");

const phoneInput = document.getElementById("phoneInput");
const phoneLookupButton = document.getElementById("phoneLookupButton");
const phoneResults = document.getElementById("phoneResults");

button.addEventListener("click", () => trackOrder());

orderInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        trackOrder();
    }

});

phoneLookupButton.addEventListener("click", lookupByPhone);

phoneInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        lookupByPhone();
    }

});

// If the confirmation page linked here with ?order=BK123456,
// pre-fill it and look it up automatically instead of making
// the customer retype the code they were just shown.
(function autoTrackFromUrl() {

    const params = new URLSearchParams(window.location.search);
    const orderFromUrl = params.get("order");

    if (orderFromUrl) {
        orderInput.value = orderFromUrl;
        trackOrder();
    }

})();

async function trackOrder(idOverride) {

    const id = (idOverride || orderInput.value).trim();

    if (id === "") {
        alert("Please enter your Order ID.");
        return;
    }

    orderInput.value = id;

    const originalLabel = button.textContent;

    button.disabled = true;
    button.textContent = "Checking...";

    const { data, error } = await supabaseClient
        .rpc("get_order_status", { order_code_input: id });

    button.disabled = false;
    button.textContent = originalLabel;

    if (error) {

        console.error(error);

        alert("Something went wrong while checking your order. Please try again.");

        return;

    }

    const order = data && data.length > 0 ? data[0] : null;

    if (!order) {

        alert("We couldn't find an order with that ID. Please double-check it and try again.");

        result.style.display = "none";
        progress.style.display = "none";

        return;

    }

    result.style.display = "block";
    progress.style.display = "block";

    result.scrollIntoView({ behavior: "smooth", block: "start" });

    displayOrderId.textContent = order.order_code;
    statusText.textContent = order.status;

    const currentIndex = STATUS_STEPS.indexOf(order.status);

    steps.forEach((step, index) => {

        if (currentIndex !== -1 && index <= currentIndex) {
            step.classList.add("active");
        } else {
            step.classList.remove("active");
        }

    });

    // Statuses like "Cancelled" don't map onto a step, so just
    // clear the progress bar entirely for anything unrecognized.
    if (currentIndex === -1) {

        steps.forEach(step => step.classList.remove("active"));

    }

}

// ----------------------------
// Look up past orders by phone number
// ----------------------------

async function lookupByPhone() {

    const phone = phoneInput.value.trim();

    if (phone === "") {
        alert("Please enter the phone number you checked out with.");
        return;
    }

    const originalLabel = phoneLookupButton.textContent;

    phoneLookupButton.disabled = true;
    phoneLookupButton.textContent = "Searching...";

    const { data, error } = await supabaseClient
        .rpc("get_orders_by_phone", { phone_input: phone });

    phoneLookupButton.disabled = false;
    phoneLookupButton.textContent = originalLabel;

    if (error) {

        console.error(error);

        phoneResults.innerHTML =
            '<p class="phone-results-error">Something went wrong. Please try again.</p>';

        return;

    }

    if (!data || data.length === 0) {

        phoneResults.innerHTML =
            '<p class="phone-results-empty">No orders found for that phone number.</p>';

        return;

    }

    phoneResults.innerHTML = "";

    data.forEach(order => {

        const item = document.createElement("div");
        item.className = "phone-result-item";

        const placedDate = new Date(order.created_at).toLocaleDateString();

        item.innerHTML = `
            <div>
                <div class="phone-result-code">${order.order_code}</div>
                <div class="phone-result-meta">
                    ${placedDate} &middot; ${formatCurrency(order.total)}
                </div>
            </div>
            <div class="phone-result-status">${order.status}</div>
        `;

        item.addEventListener("click", () => {
            trackOrder(order.order_code);
        });

        phoneResults.appendChild(item);

    });

}

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0
    }).format(amount);

}