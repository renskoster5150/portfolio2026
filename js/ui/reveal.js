// Scroll reveals.
//   data-reveal="up|fade|clip|scale|words"  animates in once, when it first scrolls into view
//   data-split                              splits text into words that rise out of a mask
//   data-stagger                            gives its children an index (--i) for staggered delays
// The starting states live in css/styles.css ("reveals").

import { $$, reducedMotion } from "../lib/utils.js";
import { arrivalDelay } from "./transitions.js";

const pageStart = performance.now();
let observer = null;

/** Wraps every word in <span class="word"><span>word</span></span>, keeping inner elements. */
function splitWords(el) {
  if (el.hasAttribute("data-split-done")) return;
  let index = 0;
  const visit = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) return visit(child);
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
      const pieces = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return pieces.append(" ");
        const word = document.createElement("span");
        word.className = "word";
        word.style.setProperty("--w", index++);
        word.append(Object.assign(document.createElement("span"), { textContent: part }));
        pieces.append(word);
      });
      child.replaceWith(pieces);
    });
  };
  visit(el);
  el.setAttribute("data-split-done", "");
}

function show(el) {
  // things on screen right at load wait for the page-transition curtain
  if (performance.now() - pageStart < 600) el.style.setProperty("--delay", `${arrivalDelay()}ms`);
  el.classList.add("is-in");
}

export function initReveal(root = document) {
  $$("[data-split]", root).forEach(splitWords);
  $$("[data-stagger]", root).forEach((group) =>
    [...group.children].forEach((child, i) => child.style.setProperty("--i", i)),
  );

  const items = $$("[data-reveal]:not(.is-in)", root);
  if (reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  observer ??= new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      }),
    { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
  );
  items.forEach((el) => observer.observe(el));
}
