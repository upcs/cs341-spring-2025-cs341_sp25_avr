function setupNavigation() {
    document.getElementById("shiley-button").onclick = function () {
        window.location.href = "sh_1948.html";
    };

    document.getElementById("menu-button").onclick = function () {
        window.location.href = "home_h.html";
    };
}

module.exports = setupNavigation;