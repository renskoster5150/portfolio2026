// About: the row of 3D heads, the timeline that draws itself as you scroll
// and the skill deck that fans out as it comes into view or when you hover it.

import { $, $$, clamp, reducedMotion } from "../lib/utils.js";
import { onFrame, scroll } from "../lib/ticker.js";
import { dimShapes } from "../ui/shapes.js";

export function init() {
  initTimeline();
  initSkills();
  dimShapes();

  const heads = $(".heads");
  if (heads) {
    import("../three/carousel.js")
      .then(({ initHeadCarousel }) => initHeadCarousel(heads))
      .catch(() => heads.classList.add("no-3d"));
  }
}

/** Eases a value towards whatever `read()` returns, calling `write()` when it changes. */
function follow(read, write, ease = 0.12) {
  let value = read(); // reopening the page halfway down shouldn't replay anything
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
