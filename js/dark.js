document.addEventListener("DOMContentLoaded", () => {
    // Dark Mode Toggle
    const toggleButton = document.getElementById("dark-mode-toggle");
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = localStorage.getItem("theme");
    
    // Set initial theme
    if (currentTheme === "dark" || (!currentTheme && prefersDarkScheme.matches)) {
        document.body.classList.add("dark-mode");
    }

    // Toggle dark mode
    toggleButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
        localStorage.setItem("theme", theme);
    });
});