// One animation loop for every scroll- and pointer-driven effect, so they all
// share the same smoothed scroll position and pause together when the tab is
// hidden. Subscribe with onFrame(fn); fn receives the frame time in seconds.

const callbacks = new Set();

export const scroll = {
  y: window.scrollY, // real position
  smooth: window.scrollY, // eased towards y, for buttery motion
  velocity: 0, // px per second, from the smoothed position
  vh: window.innerHeight,
};

export const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  nx: 0, // -1 (left) .. 1 (right)
  ny: 0, // -1 (top) .. 1 (bottom)
  moved: false,
};

let frame = 0;
let last = 0;

function tick(now) {
  frame = requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
  last = now;

  const previous = scroll.smooth;
  scroll.smooth += (scroll.y - scroll.smooth) * (1 - Math.exp(-dt * 10));
  if (Math.abs(scroll.y - scroll.smooth) < 0.05) scroll.smooth = scroll.y;
  scroll.velocity = (scroll.smooth - previous) / dt;

  callbacks.forEach((callback) => callback(dt));
}

function start() {
  if (frame || document.hidden) return;
  last = performance.now();
  frame = requestAnimationFrame(tick);
}

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
}

export function onFrame(callback) {
  callbacks.add(callback);
  start();
  return () => callbacks.delete(callback);
}

window.addEventListener("scroll", () => (scroll.y = window.scrollY), { passive: true });
window.addEventListener("resize", () => {
  scroll.vh = window.innerHeight;
  scroll.y = window.scrollY;
});
window.addEventListener(
  "pointermove",
  (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.nx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = (event.clientY / window.innerHeight) * 2 - 1;
    pointer.moved = true;
  },
  { passive: true },
);
document.addEventListener("visibilitychange", () => (document.hidden ? stop() : callbacks.size && start()));
