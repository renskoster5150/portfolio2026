// Home: the pinned hero with the 3D head, the yellow band, the intro
// statement, the stacked featured work and the specialities, which link to
// the projects page with the matching filter already selected.

import { $, $$, clamp, easeOut, progress, reducedMotion } from "../lib/utils.js";
import { onFrame, scroll } from "../lib/ticker.js";
import { splitWords } from "../ui/reveal.js";
import { CATEGORIES, FEATURED, LISTED, categoryOf, pageOf, projectsIn } from "../data/projects.js";

const ARROW = `<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
const pad = (n) => String(n).padStart(2, "0");

export function init() {
  initHero();
  initMarquee();
  initStatement();
  renderFeatured();
  renderSpecialities();
}

/* Hero ------------------------------------------------------------------- */

const HERO_SCREENS = 1.8; // how many screens of scrolling the hero choreography takes

function initHero() {
  const hero = $(".hero");
  if (!hero) return;
  const root = document.documentElement;
  const state = { progress: 0 };
  if (reducedMotion) hero.classList.add("is-static");

  // the two words differ in width: centre the gap between them on the head
  const first = $(".hero__first", hero);
  const last = $(".hero__last", hero);
  const centreName = () => hero.style.setProperty("--name-fix", `${(last.offsetWidth - first.offsetWidth) / 2}px`);
  centreName();
  document.fonts?.ready.then(centreName);
  window.addEventListener("resize", centreName);

  const target = () => (reducedMotion ? 1 : clamp(scroll.y / (HERO_SCREENS * scroll.vh)));
  let smooth = target(); // opening halfway down the page shouldn't replay the intro

  const apply = (p) => {
    state.progress = p;
    hero.style.setProperty("--head-in", easeOut(progress(p, 0, 0.3)).toFixed(4));
    hero.style.setProperty("--t1", easeOut(progress(p, 0.3, 0.5)).toFixed(4));
    hero.style.setProperty("--t2", easeOut(progress(p, 0.44, 0.64)).toFixed(4));
    hero.style.setProperty("--t3", easeOut(progress(p, 0.58, 0.76)).toFixed(4));
    hero.classList.toggle("is-scrolled", p > 0.03);
    hero.classList.toggle("cta-on", p > 0.7);
    // the background shapes join in once the head has finished its turn
    root.style.setProperty("--shapes-opacity", progress(p, 0.6, 0.95).toFixed(3));
  };
  apply(smooth);

  onFrame(() => {
    const goal = target();
    smooth += (goal - smooth) * 0.1;
    if (Math.abs(goal - smooth) < 0.0004) smooth = goal;
    if (smooth !== state.progress) apply(smooth);
  });

  import("../three/hero.js")
    .then(({ initHeroHead }) =>
      initHeroHead({ hero, state, canvas: $(".hero__canvas", hero), hit: $(".hero__hit", hero) }),
    )
    .catch(() => hero.classList.add("no-head"));
}

/* Yellow band: speeds up with scrolling and turns around when you scroll up */

function initMarquee() {
  const band = $(".marquee");
  if (!band || reducedMotion) return;
  const track = $(".marquee__track", band);
  band.classList.add("is-driven");

  let x = 0;
  let direction = -1;
  let width = track.firstElementChild.offsetWidth;
  let visible = false;
  window.addEventListener("resize", () => (width = track.firstElementChild.offsetWidth));
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(band);

  onFrame((dt) => {
    if (!visible) return;
    const velocity = scroll.velocity;
    if (Math.abs(velocity) > 40) direction = velocity > 0 ? -1 : 1;
    x += direction * (70 + Math.min(Math.abs(velocity) * 0.5, 1400)) * dt;
    x = ((x % width) - width) % width; // keep it within one group's width
    track.style.translate = `${x.toFixed(2)}px 0`;
  });
}

/* Intro statement: words light up one by one as it scrolls past ----------- */

function initStatement() {
  const statement = $(".statement");
  if (!statement) return;
  splitWords(statement);
  const words = $$(".word", statement);
  const stickers = $$(".sticker", statement);
  if (reducedMotion) {
    stickers.forEach((sticker) => sticker.classList.add("is-lit"));
    return;
  }

  let visible = false;
  let last = -1;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(statement);

  onFrame(() => {
    if (!visible) return;
    const rect = statement.getBoundingClientRect();
    const t = clamp((scroll.vh * 0.85 - rect.top) / (rect.height + scroll.vh * 0.3));
    if (Math.abs(t - last) < 0.001) return;
    last = t;
    const soft = 6; // words in the fading edge
    words.forEach((word, i) => {
      const lit = clamp((t * (words.length + soft) - i) / soft);
      word.style.setProperty("--lit", (0.16 + 0.84 * lit).toFixed(3));
      word.lit = lit;
    });
    stickers.forEach((sticker) => sticker.classList.toggle("is-lit", sticker.querySelector(".word").lit > 0.5));
  });
}

/* Featured work: cards stick, stack and shrink as the next one slides over */

function featureCard(project, index) {
  const tags = project.categories.map((id) => categoryOf(id)?.label).filter(Boolean);
  const { src, width, height } = project.cover ?? project.thumb;
  return `
    <li class="stack__item" style="--slot: ${index}" data-reveal="up">
      <a class="feature" href="${pageOf(project)}" data-project="${project.slug}" data-cursor="view case">
        <div class="feature__info">
          <p class="feature__index">${pad(index + 1)} / ${pad(FEATURED.length)}</p>
          <h3 class="feature__title">${project.title}</h3>
          <p class="feature__summary">${project.summary}</p>
          <p class="tags">${[...tags, project.year].map((tag) => `<span class="tag">${tag}</span>`).join("")}</p>
          <span class="feature__cta">view case ${ARROW}</span>
        </div>
        <div class="feature__media">
          <img src="${src}" alt="" width="${width}" height="${height}" loading="lazy" decoding="async">
        </div>
      </a>
    </li>`;
}

function renderFeatured() {
  const list = $("[data-featured]");
  if (!list) return;
  list.innerHTML = FEATURED.map(featureCard).join("");
  $$("[data-project-count]").forEach((el) => (el.textContent = LISTED.length));
  if (reducedMotion) return;

  const items = $$(".stack__item", list);
  const cards = items.map((item) => item.firstElementChild);
  let heights = [];
  let visible = false;
  new ResizeObserver(() => (heights = cards.map((card) => card.offsetHeight))).observe(list);
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(list);

  onFrame(() => {
    if (!visible) return;
    // read every position first, then write, so the browser lays out once per frame
    const tops = items.map((item) => item.getBoundingClientRect().top);
    cards.forEach((card, i) => {
      const covered = i < cards.length - 1 ? clamp(1 - (tops[i + 1] - tops[i]) / heights[i]) : 0;
      card.style.setProperty("--cover", covered.toFixed(3));
    });
  });
}

/* Specialities: each row links to the projects page, pre-filtered ---------- */

function renderSpecialities() {
  const list = $("[data-specialities]");
  if (!list) return;
  list.innerHTML = CATEGORIES.map((category, index) => {
    const projects = projectsIn(category.id);
    const thumbs = projects
      .slice(0, 3)
      .map(
        ({ thumb }, n) =>
          `<img src="${thumb.src}" alt="" width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async" style="--n: ${n}">`,
      )
      .join("");
    const count = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;
    return `
      <li data-reveal="up">
        <a class="service" href="projects.html?filter=${category.id}" style="--accent: var(--${category.color})"
           data-cursor="see ${count}" aria-label="${category.title}: see ${count}">
          <span class="service__num">${pad(index + 1)}</span>
          <span class="service__title">${category.title}</span>
          <span class="service__blurb">${category.blurb}</span>
          <span class="service__thumbs" aria-hidden="true">${thumbs}</span>
          <span class="service__end"><span class="service__count">${count}</span>${ARROW}</span>
        </a>
      </li>`;
  }).join("");
}
