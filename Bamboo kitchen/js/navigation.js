// ==========================================
// Bamboo Kitchen
// Navigation Menu
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const menuButton = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (!menuButton || !navMenu) return;

    menuButton.addEventListener("click", () => {

        navMenu.classList.toggle("active");

    });

    // Close menu when a link is clicked
    const links = navMenu.querySelectorAll("a");

    links.forEach(link => {

        link.addEventListener("click", () => {

            navMenu.classList.remove("active");

        });

    });

});
