// Project pages: reading progress, media blocks, the lightbox and a large
// "next project" card at the end, so there is always somewhere to go next.

import { $, reducedMotion } from "../lib/utils.js";
import { onFrame, scroll } from "../lib/ticker.js";
import { initLightbox } from "../ui/lightbox.js";
import { initMedia } from "../ui/media.js";
import { dimShapes } from "../ui/shapes.js";
import { categoryOf, nextProject, pageOf } from "../data/projects.js";

const ARROW = `<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;

export function init() {
  renderNext(document.body.dataset.project);
  initMedia();
  initLightbox();
  initProgress();
  dimShapes();
}

function renderNext(slug) {
  const slot = $("[data-next]");
  if (!slot) return;
  const next = nextProject(slug);
  const tags = next.categories.map((id) => categoryOf(id)?.label).filter(Boolean);
  const { src, width, height } = next.thumb;
  slot.innerHTML = `
    <div class="wrap">
      <a class="next-card" href="${pageOf(next)}" data-project="${next.slug}" data-cursor="next" data-reveal="up">
        <div class="next-card__info">
          <p class="next-card__label">next project</p>
          <h2 class="next-card__title">${next.title}</h2>
          <p class="tags">${[...tags, next.year].map((tag) => `<span class="tag">${tag}</span>`).join("")}</p>
          ${ARROW}
        </div>
        <div class="next-card__media">
          <img src="${src}" alt="" width="${width}" height="${height}" loading="lazy" decoding="async">
        </div>
      </a>
      <p class="next-project__all"><a class="link-arrow" href="projects.html">all projects ${ARROW}</a></p>
    </div>`;
}

/** A thin bar along the top that fills as you read. */
function initProgress() {
  const bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.append(bar);

  let end = 1;
  new ResizeObserver(() => (end = Math.max(1, document.documentElement.scrollHeight - window.innerHeight))).observe(
    document.body,
  );

  let last = -1;
  onFrame(() => {
    const y = reducedMotion ? scroll.y : scroll.smooth;
    if (y === last) return;
    last = y;
    bar.style.setProperty("--progress", (y / end).toFixed(4));
  });
}
