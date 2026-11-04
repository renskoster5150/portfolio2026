// Projects page: a staggered two-column gallery built from js/data/projects.js.
// The right column sits lower and drifts against the scroll. The active filter
// lives in the URL (projects.html?filter=branding), so the specialities on the
// home page can link straight to a filtered view and it can be shared.
// When filtering, the projects glide to their new place.

import { $, $$, clamp, reducedMotion } from "../lib/utils.js";
import { onFrame, scroll } from "../lib/ticker.js";
import { CATEGORIES, LISTED, categoryOf, pageOf, projectsIn } from "../data/projects.js";

const ARROW = `<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const pad = (n) => String(n).padStart(2, "0");

const tile = (project) => {
  const tags = project.categories.map((id) => `<span class="tag">${categoryOf(id).label}</span>`).join("");
  const { src, width, height } = project.cover ?? project.thumb;
  return `
    <li data-reveal="up" data-categories="${project.categories.join(" ")}">
      <a class="tile" href="${pageOf(project)}" data-project="${project.slug}" data-cursor="view">
        <div class="tile__media">
          <img src="${src}" alt="" width="${width}" height="${height}" loading="lazy" decoding="async">
        </div>
        <div class="tile__body">
          <p class="tile__index" aria-hidden="true"></p>
          <h2 class="tile__title">${project.title}</h2>
          ${ARROW}
          <p class="tile__summary">${project.summary}</p>
          <p class="tile__meta">${tags}<span class="tag">${project.year}</span></p>
        </div>
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

  grid.innerHTML = LISTED.map(tile).join("");
  bar.innerHTML =
    filterButton("all", "all", LISTED.length, "yellow") +
    CATEGORIES.map((c) => filterButton(c.id, c.label, projectsIn(c.id).length, c.color)).join("");

  const items = $$("li", grid);
  const buttons = $$("[data-filter]", bar);
  const fromUrl = new URLSearchParams(location.search).get("filter");
  let current = categoryOf(fromUrl) ? fromUrl : "all";

  const matches = (item, filter) => filter === "all" || item.dataset.categories.split(" ").includes(filter);

  /** Shows the matching projects, numbers them and puts every second one in the right column. */
  function layout(filter) {
    let shown = 0;
    items.forEach((item) => {
      item.hidden = !matches(item, filter);
      if (item.hidden) return;
      item.dataset.col = shown % 2 ? "2" : "1";
      item.style.setProperty("--i", shown % 2); // the right column reveals a beat later
      $(".tile__index", item).textContent = pad(++shown);
    });
  }

  function select(filter, animate) {
    current = filter;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
    const url = filter === "all" ? location.pathname : `${location.pathname}?filter=${filter}`;
    history.replaceState(null, "", url);
    if (animate && !reducedMotion) flip(filter);
    else layout(filter);
  }

  // FLIP: note where every project is (First), apply the filter (Last), shift
  // each one back to where it was (Invert), then let it glide into place (Play).
  function flip(filter) {
    items.forEach((item) => item.getAnimations().forEach((animation) => animation.cancel()));
    const before = new Map(items.filter((item) => !item.hidden).map((item) => [item, item.getBoundingClientRect()]));
    // where each visible tile is drawn (including its column offset), for the fade-out copies
    const drawn = new Map([...before.keys()].map((item) => [item, item.firstElementChild.getBoundingClientRect()]));

    layout(filter);

    // projects that leave fade out as a copy on top, so the grid can reflow at once
    drawn.forEach((rect, item) => {
      if (!item.hidden) return;
      const ghost = item.firstElementChild.cloneNode(true);
      ghost.setAttribute("aria-hidden", "true");
      ghost.tabIndex = -1;
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        margin: 0,
        translate: "none",
        transform: "none",
        pointerEvents: "none",
        zIndex: 1,
      });
      document.body.append(ghost);
      ghost
        .animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.94)" }], { duration: 350, easing: "ease-in" })
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
            { opacity: 0, transform: "translateY(60px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 750, delay: 100 + entering++ * 80, easing: EASE, fill: "backwards" },
        );
        return;
      }
      const now = item.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (dx || dy) {
        item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: 800,
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
  if (!reducedMotion) initDrift(grid);
}

/** The right column floats: it starts lower and catches up as you scroll past. */
function initDrift(grid) {
  let visible = false;
  let last = "";
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(grid);
  onFrame(() => {
    if (!visible) return;
    const rect = grid.getBoundingClientRect();
    const passed = clamp((scroll.vh - rect.top) / (rect.height + scroll.vh));
    const drift = `${((0.5 - passed) * scroll.vh * 0.16).toFixed(1)}px`;
    if (drift === last) return;
    last = drift;
    grid.style.setProperty("--drift", drift);
  });
}
