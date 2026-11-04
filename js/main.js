// Entry point for every page: the shared parts first, then the page's own
// module (picked by <body data-page="...">), then the 3D background once the
// browser has a moment to spare.

import { initChrome } from "./ui/chrome.js";
import { initTransitions } from "./ui/transitions.js";
import { initCursor } from "./ui/cursor.js";
import { initReveal } from "./ui/reveal.js";
import { whenIdle } from "./lib/utils.js";

window.siteReady = true; // tells boot.js the safety net isn't needed

const PAGES = {
  home: () => import("./pages/home.js"),
  projects: () => import("./pages/projects.js"),
  project: () => import("./pages/project.js"),
  about: () => import("./pages/about.js"),
  contact: () => import("./pages/contact.js"),
};

const page = document.body.dataset.page;

initChrome(page);
initTransitions();
initCursor();

try {
  const module = await PAGES[page]?.();
  module?.init();
} catch (error) {
  console.error(error); // the rest of the page still works
}

initReveal();

whenIdle(() =>
  import("./three/background.js")
    .then(({ startBackground }) => startBackground({ holdScreens: page === "home" ? 1.8 : 0 }))
    .catch(() => {}), // no WebGL or offline: the page simply has no shapes
);

console.log(
  "%crk%c  hi! curious how this was made? say hello: renskoster5@gmail.com",
  "background:#ff8fc0;color:#000;padding:2px 7px;border-radius:4px;font-weight:600",
  "color:inherit",
);
