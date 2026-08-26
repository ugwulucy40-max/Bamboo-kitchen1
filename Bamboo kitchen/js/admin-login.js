/*
=========================================
Bamboo Kitchen
js/admin-login.js
=========================================
*/

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");

// If already logged in, skip straight to the dashboard
(async function redirectIfLoggedIn() {

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        window.location.href = "admin-dashboard.html";
    }

})();

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    loginError.style.display = "none";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {

        loginError.textContent = "Incorrect email or password.";
        loginError.style.display = "block";

        loginBtn.disabled = false;
        loginBtn.textContent = "Log In";

        return;

    }

    window.location.href = "admin-dashboard.html";

});