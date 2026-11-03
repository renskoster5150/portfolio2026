// Every project gets a random colour from the palette. The projects page deals
// them out (never the same one twice in a row) and remembers which project got
// which, so a project page opens in the colour of the card you clicked.
(function () {
  const PALETTE = ["yellow", "pink", "lilac", "mint", "coral"];
  const KEY = "project-colors";
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const page = (href) => (href || "").split("/").pop().split("#")[0].split("?")[0];

  let saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY)) || {};
  } catch (err) {}
  const store = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(saved));
    } catch (err) {}
  };
  const apply = (el, name) => el.style.setProperty("--cat", `var(--${name})`);

  const cards = document.querySelectorAll(".projects-grid .project-card");
  if (cards.length) {
    let prev = "";
    cards.forEach((card) => {
      const name = pick(PALETTE.filter((c) => c !== prev));
      prev = name;
      apply(card, name);
      saved[page(card.getAttribute("href"))] = name;
    });
    store();
  } else if (document.body.classList.contains("project-detail-page")) {
    const file = page(location.pathname);
    saved[file] = saved[file] || pick(PALETTE);
    apply(document.documentElement, saved[file]);
    store();
  }
})();
