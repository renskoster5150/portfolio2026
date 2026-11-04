// Page transitions. Clicking an internal link sweeps a riso-ink curtain up
// over the page (yellow, pink and blue stripes ahead of a black sheet) with
// the destination's name on a sticker. The next page starts covered and
// sweeps the curtain away. The curtain itself is pure CSS on <html>
// (see "page transition" in css/styles.css); boot.js starts the arrival.

import { reducedMotion } from "../lib/utils.js";
import { PROJECTS, categoryOf, pageOf } from "../data/projects.js";

const STORAGE_KEY = "transition";
const LEAVE_MS = 680; // a little longer than the curtain-in animation
const PAGE_NAMES = { "": "home", "index.html": "home", "about.html": "about", "projects.html": "projects", "contact.html": "contact" };

const root = document.documentElement;

/** What the sticker on the curtain says for a given destination. */
function labelFor(url) {
  const file = url.pathname.split("/").pop();
  const project = PROJECTS.find((item) => pageOf(item) === file);
  if (project) return project.title;
  const category = categoryOf(url.searchParams.get("filter"));
  if (file === "projects.html" && category) return category.title;
  return PAGE_NAMES[file] ?? "";
}

function shouldHandle(event, link) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return false;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || !/(\/|\.html)$/.test(url.pathname)) return false;
  // same page (or just a #hash on it): let the browser handle it
  return !(url.pathname === location.pathname && url.search === location.search);
}

function leave(url) {
  const label = labelFor(url);
  root.setAttribute("data-transition-label", label);
  root.classList.remove("is-arriving");
  root.classList.add("is-leaving");
  try {
    sessionStorage.setItem(STORAGE_KEY, label);
  } catch {
    // no storage: the next page simply appears without the curtain
  }
  setTimeout(() => location.assign(url.href), LEAVE_MS);
}

export function initTransitions() {
  if (reducedMotion) return;

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !shouldHandle(event, link)) return;
    event.preventDefault();
    leave(new URL(link.href, location.href));
  });

  // coming back with the browser's back button restores the page as we left it
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) root.classList.remove("is-leaving");
  });
}

/** Extra delay (ms) for intro animations while the arrival curtain is still lifting. */
export const arrivalDelay = () => (root.classList.contains("is-arriving") ? 450 : 0);
