//Author: Emma Jeppesen

const setupNavigation = require('../public/javascripts/navigation.js');

document.body.innerHTML = `
    <button id="shiley-button">Shiley School of Engineering</button>
    <button id="menu-button">Menu</button>
`;

test("Shiley button navigates to sh_1948.html", () => {
    setupNavigation();
    document.getElementById("shiley-button").click();
    expect(window.location.href).toContain("sh_1948.html");
});

test("Menu button navigates to home_h.html", () => {
    setupNavigation();
    document.getElementById("menu-button").click();
    expect(window.location.href).toContain("home_h.html");
});