/*=========================================
    Bamboo Kitchen
    Test Supabase Connection
=========================================*/

async function testConnection() {

    const status = document.getElementById("status");

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {

            status.textContent =
                "Connection failed. Please check your Supabase URL and key.";

            status.style.color = "red";

            return;
        }

        status.textContent =
            "Successfully connected to Supabase";

        status.style.color = "green";

    }

    catch (err) {

        status.textContent =
            "Connection failed. Please check your Supabase URL and key.";

        status.style.color = "red";

    }

}

window.addEventListener("DOMContentLoaded", testConnection);