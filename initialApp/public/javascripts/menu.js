function navigateTo(page) {
  if (!page) {
    console.error("Invalid page selection");
    return;
  }

  switch (page) {
    case "home":
      window.location.href = "index.html";
      break;
    case "map":
      window.location.href = "map.html";
      break;
    case "geo":
      window.location.href = "geo.html";
      break;
    default:
      console.error("Invalid page selection");
  }
}

module.exports = { navigateTo };
