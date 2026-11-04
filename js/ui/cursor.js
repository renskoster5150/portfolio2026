// Custom cursor (mouse and trackpad only): a dot that inverts what it covers,
// grows over anything clickable and swaps for a coloured label ("view",
// "drag", ...) over elements with data-cursor="...". Elements marked
// data-magnetic lean towards the pointer.

import { finePointer, reducedMotion } from "../lib/utils.js";
import { onFrame, pointer } from "../lib/ticker.js";

const INTERACTIVE = "a, button, [role='button'], summary, label, select";
const TEXT_INPUT = "input, textarea, [contenteditable]";

function make(className, inner = "") {
  const el = document.createElement("div");
  el.className = className;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = inner;
  document.body.append(el);
  return el;
}

export function initCursor() {
  if (!finePointer) return;

  // two elements: the dot blends with the page, the label must not
  const dot = make("cursor-dot");
  const label = make("cursor-label", '<span class="cursor-label__inner"></span>');
  const text = label.firstElementChild;
  document.documentElement.classList.add("has-cursor");

  const setState = (target) => {
    const labelled = target?.closest("[data-cursor]");
    const state = labelled ? "label" : target?.closest(TEXT_INPUT) ? "text" : target?.closest(INTERACTIVE) ? "link" : "";
    document.documentElement.dataset.cursorState = state;
    if (labelled) {
      text.textContent = labelled.dataset.cursor;
      label.style.setProperty("--cursor-color", getComputedStyle(labelled).getPropertyValue("--accent") || "#fff");
    }
  };

  document.addEventListener("pointerover", (event) => {
    setState(event.target instanceof Element ? event.target : null);
    document.documentElement.classList.remove("cursor-away");
  });
  // hide it when the pointer leaves the window or moves into an embedded video
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) document.documentElement.classList.add("cursor-away");
  });

  let lx = pointer.x;
  let ly = pointer.y;
  onFrame(() => {
    if (!pointer.moved) return;
    document.documentElement.classList.add("cursor-moved");
    lx += (pointer.x - lx) * 0.3; // the label trails a little
    ly += (pointer.y - ly) * 0.3;
    dot.style.translate = `${pointer.x}px ${pointer.y}px`;
    label.style.translate = `${lx}px ${ly}px`;
  });

  if (!reducedMotion) initMagnetic();
}

/** [data-magnetic] elements are pulled towards the pointer while it is over them. */
function initMagnetic() {
  let active = null;
  const release = () => {
    if (active) active.style.translate = "";
    active = null;
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      const el = event.target instanceof Element ? event.target.closest("[data-magnetic]") : null;
      if (el !== active) release();
      if (!el) return;
      active = el;
      const strength = Number(el.dataset.magnetic) || 0.25;
      const [tx = 0, ty = 0] = (el.style.translate || "0px 0px").split(" ").map(parseFloat);
      const rect = el.getBoundingClientRect();
      // measure from where the element sits without its current pull
      const cx = rect.left - tx + rect.width / 2;
      const cy = rect.top - ty + rect.height / 2;
      el.style.translate = `${(event.clientX - cx) * strength}px ${(event.clientY - cy) * strength}px`;
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", release);
}
