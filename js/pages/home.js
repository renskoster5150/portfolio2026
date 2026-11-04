// Home: the pinned hero with the 3D head, the yellow band, the featured
// work and the specialities, which link to the projects page with the
// matching filter already selected.

import { $, $$, clamp, easeOut, progress, reducedMotion } from "../lib/utils.js";
import { onFrame, scroll } from "../lib/ticker.js";
import { CATEGORIES, FEATURED, LISTED, categoryOf, pageOf, projectsIn } from "../data/projects.js";

const ARROW = `<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
const pad = (n) => String(n).padStart(2, "0");
const tagsOf = (project) => [...project.categories.map((id) => categoryOf(id)?.label), project.year].filter(Boolean);

export function init() {
  initHero();
  initMarquee();
  renderShowcase();
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
  };
  apply(smooth);

  let shapes = "";
  onFrame(() => {
    const goal = target();
    smooth += (goal - smooth) * 0.1;
    if (Math.abs(goal - smooth) < 0.0004) smooth = goal;
    if (smooth !== state.progress) apply(smooth);
    // the background shapes join in once the head has finished its turn,
    // and calm down once the rest of the page has slid over the hero
    const calm = progress(scroll.smooth, scroll.vh * 3, scroll.vh * 3.8);
    const value = (progress(smooth, 0.6, 0.95) * (1 - 0.55 * calm)).toFixed(3);
    if (value !== shapes) root.style.setProperty("--shapes-opacity", (shapes = value));
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

/* Featured work ----------------------------------------------------------
   The project images stack as you scroll: each one sticks, and the next
   slides over it while the one below shrinks and dims. The text column next
   to them stays put and swaps to whichever project is on top. */

const showcaseText = (project, index) => `
  <article class="showcase__item${index === 0 ? " is-active" : ""}" data-project="${project.slug}">
    <p class="showcase__index"><span>${pad(index + 1)}</span> / ${pad(FEATURED.length)}</p>
    <h3 class="showcase__title"><a href="${pageOf(project)}">${project.title}</a></h3>
    <p class="showcase__summary">${project.summary}</p>
    <p class="tags">${tagsOf(project).map((tag) => `<span class="tag">${tag}</span>`).join("")}</p>
    <a class="link-arrow" href="${pageOf(project)}">view case ${ARROW}</a>
  </article>`;

const showcaseSlide = (project, index) => {
  const { src, width, height } = project.cover ?? project.thumb;
  return `
    <li class="showcase__slide" style="--slot: ${index}" data-project="${project.slug}" data-reveal="up">
      <a class="showcase__image" href="${pageOf(project)}" data-cursor="view case" aria-label="${project.title}, view case">
        <img src="${src}" alt="" width="${width}" height="${height}" loading="lazy" decoding="async">
      </a>
      <div class="showcase__caption">${showcaseText(project, index)}</div>
    </li>`;
};

function renderShowcase() {
  const showcase = $("[data-showcase]");
  if (!showcase) return;
  showcase.innerHTML = `
    <div class="showcase__text" data-reveal="up">
      ${FEATURED.map(showcaseText).join("")}
      <ol class="showcase__progress" aria-hidden="true">${FEATURED.map(() => "<li></li>").join("")}</ol>
    </div>
    <ol class="showcase__slides">${FEATURED.map(showcaseSlide).join("")}</ol>`;
  $$("[data-project-count]").forEach((el) => (el.textContent = LISTED.length));

  const texts = $$(".showcase__text .showcase__item", showcase);
  const bars = $$(".showcase__progress li", showcase);
  const slides = $$(".showcase__slide", showcase);
  const images = slides.map((slide) => slide.firstElementChild);
  let heights = [];
  let visible = false;
  let active = -1;
  new ResizeObserver(() => (heights = images.map((image) => image.offsetHeight))).observe(showcase);
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(showcase);

  const setActive = (index) => {
    if (index === active) return;
    active = index;
    texts.forEach((text, i) => text.classList.toggle("is-active", i === index));
    bars.forEach((bar, i) => bar.classList.toggle("is-done", i <= index));
  };

  onFrame(() => {
    if (!visible) return;
    // read every position first, then write, so the browser lays out once per frame
    const tops = slides.map((slide) => slide.getBoundingClientRect().top);
    let covered = 0;
    images.forEach((image, i) => {
      const cover = i < images.length - 1 ? clamp(1 - (tops[i + 1] - tops[i]) / heights[i]) : 0;
      if (!reducedMotion) image.style.setProperty("--cover", cover.toFixed(3));
      if (cover > 0.5) covered = i + 1;
    });
    setActive(covered);
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
