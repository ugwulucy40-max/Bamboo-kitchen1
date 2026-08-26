/*
=========================================
Bamboo Kitchen
js/admin-dashboard.js
=========================================
*/

const STATUS_OPTIONS = [
    "Order Received",
    "Preparing Food",
    "Cooking",
    "Ready for Pickup",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
];

const CATEGORY_LABELS = {
    rice: "Rice",
    soups: "Soups",
    grill: "Grills",
    combos: "Combos"
};

const adminEmailEl = document.getElementById("adminEmail");
const logoutBtn = document.getElementById("logoutBtn");

let ordersById = {};

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0
    }).format(amount);

}

// Same normalization the Edge Function uses, so the WhatsApp
// link always points at a valid international-format number.
function normalizePhone(phone) {

    const digits = (phone || "").replace(/\D/g, "");

    if (digits.startsWith("234")) return digits;
    if (digits.startsWith("0")) return "234" + digits.slice(1);

    return digits;

}

// ==========================================
// Auth guard
// ==========================================

async function requireLogin() {

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        window.location.href = "admin-login.html";
        return null;
    }

    return data.session;

}

// ==========================================
// Tabs
// ==========================================

const tabButtons = document.querySelectorAll(".admin-tab-btn");
const tabPanels = document.querySelectorAll(".admin-tab-panel");
const loadedTabs = new Set();

tabButtons.forEach(btn => {

    btn.addEventListener("click", () => switchTab(btn.dataset.tab));

});

function switchTab(tabName) {

    tabButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
    tabPanels.forEach(p => p.classList.toggle("active", p.id === "tab-" + tabName));

    loadTabIfNeeded(tabName);

}

function loadTabIfNeeded(tabName) {

    if (loadedTabs.has(tabName)) return;

    loadedTabs.add(tabName);

    if (tabName === "orders") loadOrders();
    if (tabName === "menu") loadProductsAdmin();
    if (tabName === "sales") loadSales();
    if (tabName === "customers") loadCustomers();

}

// ==========================================
// ORDERS
// ==========================================

const loadingEl = document.getElementById("ordersLoading");
const errorEl = document.getElementById("ordersError");
const emptyEl = document.getElementById("ordersEmpty");
const tableEl = document.getElementById("ordersTable");
const tableBody = document.getElementById("ordersTableBody");

document.getElementById("refreshOrdersBtn").addEventListener("click", loadOrders);

async function loadOrders() {

    loadingEl.style.display = "block";
    errorEl.style.display = "none";
    emptyEl.style.display = "none";
    tableEl.style.display = "none";

    const { data: orders, error } = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    loadingEl.style.display = "none";

    if (error) {
        console.error(error);
        errorEl.style.display = "block";
        return;
    }

    if (!orders || orders.length === 0) {
        emptyEl.style.display = "block";
        return;
    }

    ordersById = {};
    orders.forEach(order => { ordersById[order.id] = order; });

    renderOrders(orders);
    tableEl.style.display = "table";

}

function renderOrders(orders) {

    tableBody.innerHTML = "";

    orders.forEach(order => {

        const row = document.createElement("tr");

        const itemsSummary = (order.items || [])
            .map(item => `${item.name} x${item.quantity}`)
            .join(", ");

        const placedDate = new Date(order.created_at).toLocaleString();

        row.innerHTML = `
            <td>
                <strong>${order.order_code}</strong>
            </td>
            <td>
                ${order.customer_name}<br>
                <small>${order.customer_phone}</small>
            </td>
            <td>${itemsSummary}</td>
            <td>${formatCurrency(order.total)}</td>
            <td>${placedDate}</td>
            <td>
                <select
                    class="status-select"
                    data-id="${order.id}"
                    data-code="${order.order_code}"
                    data-phone="${order.customer_phone}"
                >
                    ${STATUS_OPTIONS.map(status => `
                        <option value="${status}" ${status === order.status ? "selected" : ""}>
                            ${status}
                        </option>
                    `).join("")}
                </select>
            </td>
            <td>
                <button class="btn btn-secondary receipt-btn" data-id="${order.id}">
                    View
                </button>
            </td>
        `;

        tableBody.appendChild(row);

    });

    attachStatusListeners();
    attachReceiptListeners();

}

function attachStatusListeners() {

    const selects = document.querySelectorAll(".status-select");

    selects.forEach(select => {

        select.addEventListener("change", async function () {

            const orderId = this.dataset.id;
            const orderCode = this.dataset.code;
            const customerPhone = this.dataset.phone;
            const newStatus = this.value;

            this.disabled = true;

            const { error } = await supabaseClient
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            this.disabled = false;

            if (error) {
                console.error(error);
                alert("Couldn't update this order's status. Please try again.");
                return;
            }

            if (ordersById[orderId]) {
                ordersById[orderId].status = newStatus;
            }

            supabaseClient.functions
                .invoke("send-order-notification", {
                    body: {
                        phone: customerPhone,
                        order_code: orderCode,
                        status: newStatus
                    }
                })
                .then(({ error: notifyError }) => {

                    if (notifyError) {
                        console.error("Order notification failed:", notifyError);
                    }

                });

        });

    });

}

// ==========================================
// RECEIPT MODAL
// ==========================================

const receiptModal = document.getElementById("receiptModal");
const receiptBody = document.getElementById("receiptBody");

document.getElementById("closeReceiptBtn").addEventListener("click", () => {
    receiptModal.classList.remove("active");
});

document.getElementById("printReceiptBtn").addEventListener("click", () => {
    window.print();
});

function attachReceiptListeners() {

    document.querySelectorAll(".receipt-btn").forEach(button => {

        button.addEventListener("click", function () {

            const order = ordersById[this.dataset.id];

            if (order) {
                showReceipt(order);
            }

        });

    });

}

function showReceipt(order) {

    const itemsRows = (order.items || []).map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `).join("");

    receiptBody.innerHTML = `
        <p><strong>Order:</strong> ${order.order_code}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        <p><strong>Status:</strong> ${order.status}</p>

        <hr>

        <p><strong>${order.customer_name}</strong></p>
        <p>${order.customer_phone}</p>
        ${order.customer_email ? `<p>${order.customer_email}</p>` : ""}
        <p>${order.customer_address}</p>
        ${order.order_notes ? `<p><em>Notes: ${order.order_notes}</em></p>` : ""}

        <hr>

        <table class="receipt-items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <hr>

        <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
        <p>Delivery Fee: ${formatCurrency(order.delivery_fee)}</p>
        <p class="receipt-grand-total">Total: ${formatCurrency(order.total)}</p>
    `;

    receiptModal.classList.add("active");

}

// ==========================================
// MENU MANAGEMENT
// ==========================================

const menuLoadingAdmin = document.getElementById("menuLoadingAdmin");
const menuErrorAdmin = document.getElementById("menuErrorAdmin");
const productsTable = document.getElementById("productsTable");
const productsTableBody = document.getElementById("productsTableBody");
const addProductForm = document.getElementById("addProductForm");

document.getElementById("refreshMenuBtn").addEventListener("click", loadProductsAdmin);

async function loadProductsAdmin() {

    menuLoadingAdmin.style.display = "block";
    menuErrorAdmin.style.display = "none";
    productsTable.style.display = "none";

    const { data: products, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("id", { ascending: true });

    menuLoadingAdmin.style.display = "none";

    if (error) {
        console.error(error);
        menuErrorAdmin.style.display = "block";
        return;
    }

    renderProductsAdmin(products || []);
    productsTable.style.display = "table";

}

function renderProductsAdmin(products) {

    productsTableBody.innerHTML = "";

    products.forEach(product => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${product.name}</td>
            <td>${CATEGORY_LABELS[product.category] || product.category}</td>
            <td>
                <input
                    type="number"
                    class="price-input"
                    data-id="${product.id}"
                    value="${product.price}"
                    min="0"
                    step="1">
            </td>
            <td>
                <input
                    type="checkbox"
                    class="available-checkbox"
                    data-id="${product.id}"
                    ${product.is_available ? "checked" : ""}>
            </td>
            <td>
                <button class="btn btn-secondary delete-product-btn" data-id="${product.id}">
                    Delete
                </button>
            </td>
        `;

        productsTableBody.appendChild(row);

    });

    attachProductListeners();

}

function attachProductListeners() {

    document.querySelectorAll(".price-input").forEach(input => {

        input.addEventListener("change", async function () {

            const newPrice = Number(this.value);

            if (isNaN(newPrice) || newPrice < 0) {
                alert("Please enter a valid price.");
                loadProductsAdmin();
                return;
            }

            const { error } = await supabaseClient
                .from("products")
                .update({ price: newPrice })
                .eq("id", this.dataset.id);

            if (error) {
                console.error(error);
                alert("Couldn't update the price. Please try again.");
            }

        });

    });

    document.querySelectorAll(".available-checkbox").forEach(checkbox => {

        checkbox.addEventListener("change", async function () {

            const { error } = await supabaseClient
                .from("products")
                .update({ is_available: this.checked })
                .eq("id", this.dataset.id);

            if (error) {
                console.error(error);
                alert("Couldn't update availability. Please try again.");
                this.checked = !this.checked;
            }

        });

    });

    document.querySelectorAll(".delete-product-btn").forEach(button => {

        button.addEventListener("click", async function () {

            const confirmed = confirm(
                "Remove this item from the menu? This can't be undone."
            );

            if (!confirmed) return;

            const { error } = await supabaseClient
                .from("products")
                .delete()
                .eq("id", this.dataset.id);

            if (error) {
                console.error(error);
                alert("Couldn't delete this item. Please try again.");
                return;
            }

            loadProductsAdmin();

        });

    });

}

addProductForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = document.getElementById("newProductName").value.trim();
    const price = Number(document.getElementById("newProductPrice").value);
    const category = document.getElementById("newProductCategory").value;
    const image = document.getElementById("newProductImage").value.trim();
    const description = document.getElementById("newProductDescription").value.trim();

    if (name === "" || isNaN(price) || price < 0) {
        alert("Please enter at least a name and a valid price.");
        return;
    }

    const { error } = await supabaseClient
        .from("products")
        .insert({
            name,
            price,
            category,
            image: image || null,
            description: description || null,
            is_available: true
        });

    if (error) {
        console.error(error);
        alert("Couldn't add this item. Please try again.");
        return;
    }

    addProductForm.reset();

    loadProductsAdmin();

});

// ==========================================
// SALES REPORT
// ==========================================

const salesLoading = document.getElementById("salesLoading");
const salesError = document.getElementById("salesError");
const salesContent = document.getElementById("salesContent");

document.getElementById("refreshSalesBtn").addEventListener("click", loadSales);

function getStartOfToday() {

    const d = new Date();
    d.setHours(0, 0, 0, 0);

    return d;

}

function getStartOfWeek() {

    const d = new Date();
    const day = d.getDay();
    const diffFromMonday = day === 0 ? 6 : day - 1;

    d.setDate(d.getDate() - diffFromMonday);
    d.setHours(0, 0, 0, 0);

    return d;

}

async function loadSales() {

    salesLoading.style.display = "block";
    salesError.style.display = "none";
    salesContent.style.display = "none";

    const startOfWeek = getStartOfWeek();
    const startOfToday = getStartOfToday();

    const { data: orders, error } = await supabaseClient
        .from("orders")
        .select("total, status, created_at")
        .gte("created_at", startOfWeek.toISOString());

    salesLoading.style.display = "none";

    if (error) {
        console.error(error);
        salesError.style.display = "block";
        return;
    }

    const countedOrders = (orders || []).filter(o => o.status !== "Cancelled");

    const todayOrders = countedOrders.filter(
        o => new Date(o.created_at) >= startOfToday
    );

    const todayTotal = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const weekTotal = countedOrders.reduce((sum, o) => sum + Number(o.total), 0);

    document.getElementById("salesTodayAmount").textContent = formatCurrency(todayTotal);
    document.getElementById("salesTodayCount").textContent =
        todayOrders.length + (todayOrders.length === 1 ? " order" : " orders");

    document.getElementById("salesWeekAmount").textContent = formatCurrency(weekTotal);
    document.getElementById("salesWeekCount").textContent =
        countedOrders.length + (countedOrders.length === 1 ? " order" : " orders");

    salesContent.style.display = "flex";

}

// ==========================================
// CUSTOMERS
// ==========================================

const customersLoading = document.getElementById("customersLoading");
const customersError = document.getElementById("customersError");
const customersEmpty = document.getElementById("customersEmpty");
const customersTable = document.getElementById("customersTable");
const customersTableBody = document.getElementById("customersTableBody");

document.getElementById("refreshCustomersBtn").addEventListener("click", loadCustomers);

async function loadCustomers() {

    customersLoading.style.display = "block";
    customersError.style.display = "none";
    customersEmpty.style.display = "none";
    customersTable.style.display = "none";

    const { data: orders, error } = await supabaseClient
        .from("orders")
        .select("customer_name, customer_phone, total, status, created_at")
        .order("created_at", { ascending: false });

    customersLoading.style.display = "none";

    if (error) {
        console.error(error);
        customersError.style.display = "block";
        return;
    }

    if (!orders || orders.length === 0) {
        customersEmpty.style.display = "block";
        return;
    }

    const customers = {};

    orders.forEach(order => {

        const phone = order.customer_phone;

        if (!customers[phone]) {

            customers[phone] = {
                name: order.customer_name,
                phone,
                orderCount: 0,
                totalSpent: 0,
                lastOrder: order.created_at
            };

        }

        customers[phone].orderCount += 1;

        if (order.status !== "Cancelled") {
            customers[phone].totalSpent += Number(order.total);
        }

        // orders are already sorted newest-first, so the first
        // time we see a phone number, that's their latest order —
        // no need to compare dates.

    });

    renderCustomers(Object.values(customers));
    customersTable.style.display = "table";

}

function renderCustomers(customers) {

    customersTableBody.innerHTML = "";

    customers.forEach(customer => {

        const row = document.createElement("tr");

        const whatsappNumber = normalizePhone(customer.phone);
        const lastOrderDate = new Date(customer.lastOrder).toLocaleDateString();

        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.orderCount}</td>
            <td>${formatCurrency(customer.totalSpent)}</td>
            <td>${lastOrderDate}</td>
            <td>
                <a
                    href="https://wa.me/${whatsappNumber}"
                    target="_blank"
                    rel="noopener"
                    class="btn btn-secondary">
                    Message
                </a>
            </td>
        `;

        customersTableBody.appendChild(row);

    });

}

// ==========================================
// Logout
// ==========================================

logoutBtn.addEventListener("click", async function () {

    await supabaseClient.auth.signOut();

    window.location.href = "admin-login.html";

});

// ==========================================
// Initialize
// ==========================================

(async function initDashboard() {

    const session = await requireLogin();

    if (!session) return;

    adminEmailEl.textContent = session.user.email;

    loadTabIfNeeded("orders");

})();