// Lets the 3D shapes behind a page calm down once you start reading, so they
// never compete with text. `from` and `to` return scroll positions in px
// (functions, so they follow resizes); between them the shapes fade to `min`.

import { onFrame, scroll } from "../lib/ticker.js";
import { progress } from "../lib/utils.js";

export function dimShapes({ from = () => 0, to = () => scroll.vh * 0.8, min = 0.4 } = {}) {
  const root = document.documentElement;
  let last = "";
  onFrame(() => {
    const value = (1 - (1 - min) * progress(scroll.smooth, from(), to())).toFixed(3);
    if (value === last) return;
    last = value;
    root.style.setProperty("--shapes-opacity", value);
  });
}
