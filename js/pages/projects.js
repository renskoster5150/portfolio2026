// Projects page: the grid and its filters, built from js/data/projects.js.
// The active filter lives in the URL (projects.html?filter=branding), so the
// specialities on the home page can link straight to a filtered view and a
// filtered view can be shared. Cards glide to their new place when filtering.

import { $, $$, reducedMotion } from "../lib/utils.js";
import { CATEGORIES, LISTED, categoryOf, pageOf, projectsIn } from "../data/projects.js";

const ARROW = `<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const card = (project) => {
  const tags = project.categories.map((id) => `<span class="tag">${categoryOf(id).label}</span>`).join("");
  const { src, width, height } = project.thumb;
  return `
    <li data-reveal="up" data-categories="${project.categories.join(" ")}">
      <a class="card" href="${pageOf(project)}" data-project="${project.slug}" data-cursor="view">
        <div class="card__head">
          <h2 class="card__title">${project.title}</h2>
          <p class="card__tags">${tags}</p>
        </div>
        <p class="card__summary">${project.summary}</p>
        <div class="card__media">
          <img src="${src}" alt="" width="${width}" height="${height}" loading="lazy" decoding="async">
        </div>
        <p class="card__foot"><span>${project.year}</span>${ARROW}</p>
      </a>
    </li>`;
};

const filterButton = (id, label, count, color) => `
  <button class="filter" type="button" data-filter="${id}" aria-pressed="false" style="--accent: var(--${color})">
    ${label} <span class="filter__count">${count}</span>
  </button>`;

export function init() {
  const grid = $("[data-grid]");
  const bar = $("[data-filters]");
  if (!grid || !bar) return;

  grid.innerHTML = LISTED.map(card).join("");
  bar.innerHTML =
    filterButton("all", "all", LISTED.length, "yellow") +
    CATEGORIES.map((c) => filterButton(c.id, c.label, projectsIn(c.id).length, c.color)).join("");

  const items = $$("li", grid);
  const buttons = $$("[data-filter]", bar);
  const fromUrl = new URLSearchParams(location.search).get("filter");
  let current = categoryOf(fromUrl) ? fromUrl : "all";

  const matches = (item, filter) => filter === "all" || item.dataset.categories.split(" ").includes(filter);

  function select(filter, animate) {
    current = filter;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
    const url = filter === "all" ? location.pathname : `${location.pathname}?filter=${filter}`;
    history.replaceState(null, "", url);

    if (!animate || reducedMotion) {
      items.forEach((item) => (item.hidden = !matches(item, filter)));
      return;
    }
    flip(filter);
  }

  // FLIP: note where every card is (First), apply the filter (Last), shift each
  // card back to where it was (Invert), then let it glide into place (Play).
  function flip(filter) {
    items.forEach((item) => item.getAnimations().forEach((animation) => animation.cancel()));
    const before = new Map(items.filter((item) => !item.hidden).map((item) => [item, item.getBoundingClientRect()]));

    items.forEach((item) => (item.hidden = !matches(item, filter)));

    // cards that leave fade out as a copy on top, so the grid can reflow at once
    before.forEach((rect, item) => {
      if (!item.hidden) return;
      const ghost = item.cloneNode(true);
      ghost.hidden = false;
      ghost.setAttribute("aria-hidden", "true");
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: "none",
        zIndex: 1,
      });
      document.body.append(ghost);
      ghost
        .animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.9)" }], { duration: 350, easing: "ease-in" })
        .finished.then(() => ghost.remove());
    });

    let entering = 0;
    items.forEach((item) => {
      if (item.hidden) return;
      item.classList.add("is-in"); // skip the scroll reveal, this animation replaces it
      const old = before.get(item);
      if (!old) {
        item.animate(
          [
            { opacity: 0, transform: "translateY(40px) scale(0.94)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 650, delay: 80 + entering++ * 60, easing: EASE, fill: "backwards" },
        );
        return;
      }
      const now = item.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (dx || dy) {
        item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: 700,
          easing: EASE,
        });
      }
    });
  }

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (button && button.dataset.filter !== current) select(button.dataset.filter, true);
  });

  select(current, false);
}
