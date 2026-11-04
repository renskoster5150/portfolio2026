// The home hero's 3D head. While you scroll it slides in from the left,
// spins one full turn and lands looking slightly left; after that it follows
// the pointer. Click it to make it spin. The scroll position comes from
// pages/home.js through `state.progress` (0..1), so the text keeps working
// even when WebGL is missing.

import * as THREE from "three";
import { loadRisoHead } from "./head.js";
import { createRenderer } from "./riso.js";
import { onFrame, pointer, scroll } from "../lib/ticker.js";
import { clamp, easeInOut, easeOut, lerp, reducedMotion } from "../lib/utils.js";

const YAW_START = THREE.MathUtils.degToRad(20);
const YAW_END = THREE.MathUtils.degToRad(-20 - 360);

export function initHeroHead({ hero, canvas, hit, state }) {
  const renderer = createRenderer(canvas, 2);
  if (!renderer) return;

  const pr = { value: renderer.getPixelRatio() };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = 6;
  const VIEW_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15));

  const pivot = new THREE.Group(); // slide, turn and lean happen here
  const holder = new THREE.Group(); // uniform scale
  pivot.add(holder);
  pivot.visible = false;
  scene.add(pivot);

  const box = { w: 0.81, h: 1 }; // replaced by the real size once loaded
  let loaded = false;
  let viewW = 1;
  let headW = 0; // world units
  let dirty = true;

  function layout() {
    const { innerWidth: vw, innerHeight: vh } = window;
    const ratio = box.w / box.h;
    const portrait = vw < vh;
    const heightPx = portrait ? Math.min(0.4 * vh, (0.84 * vw) / ratio) : 0.66 * vh;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    const scale = ((heightPx / vh) * VIEW_H) / box.h;
    holder.scale.setScalar(scale);
    headW = box.w * scale;
    viewW = VIEW_H * camera.aspect;
    if (loaded) {
      hero.style.setProperty("--head-w", `${heightPx * ratio}px`);
      hero.style.setProperty("--head-h", `${heightPx}px`);
      hit.style.width = `${heightPx * ratio * 0.8}px`;
      hit.style.height = `${heightPx * 0.85}px`;
    }
    dirty = true;
  }

  // pointer lean and the click-to-spin easter egg
  const lean = { x: 0, y: 0 };
  let spin = 0;
  let spinTarget = 0;
  hit.addEventListener("click", () => (spinTarget += Math.PI * 2));

  let lastProgress = -1;
  onFrame(() => {
    if (!loaded || scroll.y > scroll.vh * 3.2) return; // covered by the rest of the page
    const p = state.progress;
    const arrived = easeOut(clamp(p / 0.3));
    const turn = easeInOut(clamp((p - 0.12) / 0.88));

    // only lean towards the pointer once the turn is done
    const settle = reducedMotion ? 0 : clamp((p - 0.85) / 0.15);
    const target = { x: pointer.nx * 0.38 * settle, y: pointer.ny * 0.2 * settle };
    lean.x = lerp(lean.x, target.x, 0.06);
    lean.y = lerp(lean.y, target.y, 0.06);
    spin = lerp(spin, spinTarget, 0.07);
    const moving =
      Math.abs(spinTarget - spin) > 0.001 ||
      Math.abs(lean.x - target.x) > 0.001 ||
      Math.abs(lean.y - target.y) > 0.001;
    if (!dirty && !moving && p === lastProgress) return;

    pivot.position.x = -(viewW / 2 + headW) * (1 - arrived);
    pivot.rotation.y = lerp(YAW_START, YAW_END, turn) + lean.x + spin;
    pivot.rotation.x = lean.y;
    pivot.visible = arrived > 0.001;
    hit.hidden = arrived < 0.95 || reducedMotion;
    renderer.render(scene, camera);
    lastProgress = p;
    dirty = false;
  });

  window.addEventListener("resize", layout);
  layout();

  loadRisoHead(pr).then(
    (head) => {
      box.w = head.width;
      box.h = head.height;
      holder.add(head.object);
      loaded = true;
      layout();
      hero.classList.add("has-head");
    },
    () => hero.classList.add("no-head"),
  );
}
