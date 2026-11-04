// Small helpers shared by every module.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
export const lerp = (from, to, t) => from + (to - from) * t;
/** Maps value from the range [start, end] onto 0..1. */
export const progress = (value, start, end) => clamp((value - start) / (end - start));

export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Turns a trusted HTML string into DOM nodes. */
export function fragment(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content;
}

/** Plain-text escape for values placed inside HTML strings. */
export function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}

/** Runs a callback once the browser is idle (or soon, where that isn't supported). */
export const whenIdle = (callback) =>
  "requestIdleCallback" in window ? requestIdleCallback(callback, { timeout: 1500 }) : setTimeout(callback, 200);
