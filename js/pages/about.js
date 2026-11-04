// About: the pinned intro (title lifts, card and 3D heads come in, words
// light up as you read), the timeline that draws itself and the skill deck
// that fans out as it scrolls into view or when you hover it.

import { $, $$, clamp, easeOut, progress, reducedMotion } from "../lib/utils.js";
import { onFrame, scroll } from "../lib/ticker.js";
import { splitWords } from "../ui/reveal.js";
import { dimShapes } from "../ui/shapes.js";

export function init() {
  initIntro();
  initTimeline();
  initSkills();
  // the shapes calm down once the pinned intro is over and the reading starts
  const intro = $(".about-intro");
  const introEnd = () => (intro ? intro.offsetHeight - scroll.vh : 0);
  dimShapes({ from: introEnd, to: () => introEnd() + scroll.vh * 0.6 });

  const heads = $(".heads");
  if (heads) {
    import("../three/carousel.js")
      .then(({ initHeadCarousel }) => initHeadCarousel(heads))
      .catch(() => heads.classList.add("no-3d"));
  }
}

/** Eases a value towards whatever `read()` returns, calling `write()` when it changes. */
function follow(read, write, ease = 0.12) {
  let value = read(); // refreshing halfway down shouldn't replay anything
  write(value);
  onFrame(() => {
    const target = read();
    let next = value + (target - value) * (reducedMotion ? 1 : ease);
    if (Math.abs(target - next) < 0.0005) next = target;
    if (next === value) return;
    value = next;
    write(value);
  });
}

function initIntro() {
  const intro = $(".about-intro");
  if (!intro) return;
  const card = $(".about-card", intro);
  const words = $$(".about-card p", intro).flatMap((p) => {
    splitWords(p);
    return $$(".word", p);
  });
  const pinned = matchMedia("(min-width: 961px) and (min-height: 640px)");

  // 0..1 through the pinned stretch (or, unpinned, as the card moves up the screen)
  const reading = () => {
    if (reducedMotion) return 1;
    if (!pinned.matches) {
      const rect = card.getBoundingClientRect();
      return clamp((scroll.vh * 0.85 - rect.top) / (rect.height * 0.8 + scroll.vh * 0.1));
    }
    return clamp(-intro.getBoundingClientRect().top / (intro.offsetHeight - scroll.vh));
  };

  let lastLit = -1;
  follow(reading, (p) => {
    if (pinned.matches && !reducedMotion) {
      intro.style.setProperty("--a1", easeOut(progress(p, 0, 0.2)).toFixed(4));
      intro.style.setProperty("--a2", easeOut(progress(p, 0.12, 0.36)).toFixed(4));
    } else {
      intro.style.removeProperty("--a1");
      intro.style.removeProperty("--a2");
    }
    const read = pinned.matches ? progress(p, 0.32, 0.9) : p;
    const key = Math.round(read * 1000);
    if (key === lastLit) return;
    lastLit = key;
    const soft = 5; // words in the fading edge
    words.forEach((word, i) => {
      const lit = clamp((read * (words.length + soft) - i) / soft);
      word.style.setProperty("--lit", (0.2 + 0.8 * lit).toFixed(3));
    });
  });
}

function initTimeline() {
  const timeline = $(".timeline");
  if (!timeline) return;
  const items = $$(".timeline__item", timeline);
  let height = 1;
  let offsets = [];
  new ResizeObserver(() => {
    height = timeline.offsetHeight;
    offsets = items.map((item) => item.offsetTop);
  }).observe(timeline);

  const drawn = () => {
    if (reducedMotion) return 1;
    return clamp((scroll.vh * 0.65 - timeline.getBoundingClientRect().top) / height);
  };
  follow(drawn, (d) => {
    timeline.style.setProperty("--drawn", d.toFixed(4));
    items.forEach((item, i) => item.classList.toggle("is-reached", offsets[i] <= d * height + 8));
  });
}

function initSkills() {
  const stack = $(".skill-stack");
  if (!stack) return;
  let hovering = false;
  const grab = () => (hovering = true);
  stack.addEventListener("pointerenter", grab);
  stack.addEventListener("focusin", grab);
  stack.addEventListener("pointerleave", () => (hovering = stack.contains(document.activeElement)));
  stack.addEventListener("focusout", () => (hovering = stack.matches(":hover")));

  const open = () => {
    if (reducedMotion || hovering) return 1;
    return clamp((scroll.vh * 0.92 - stack.getBoundingClientRect().top) / (scroll.vh * 0.42));
  };
  follow(open, (o) => stack.style.setProperty("--open", o.toFixed(4)), 0.1);
}
