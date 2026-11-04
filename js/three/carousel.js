// About page: an endless row of riso-printed heads drifting sideways by
// themselves, each turning, bobbing and tilting on its own.

import * as THREE from "three";
import { loadRisoHead } from "./head.js";
import { createRenderer } from "./riso.js";
import { onFrame } from "../lib/ticker.js";
import { reducedMotion } from "../lib/utils.js";

const TILTS = [-13, 9, -5, 15, -9, 6].map(THREE.MathUtils.degToRad);
const DRIFT = 0.16; // spacings per second
const SPACING = 1.55; // head widths between centres

export function initHeadCarousel(section) {
  const canvas = section.querySelector("canvas");
  const renderer = createRenderer(canvas, 2);
  if (!renderer) {
    section.classList.add("no-3d");
    return;
  }

  const pr = { value: renderer.getPixelRatio() };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = 8;
  const VIEW_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15));

  let template = null; // one head, 1 unit tall
  let ratio = 0.81;
  let slots = [];
  let headH = 1;
  let spacing = 1;
  let offset = 0;
  let time = 0;
  let visible = false;

  function makeSlot(i) {
    const slot = new THREE.Group();
    const pivot = new THREE.Group(); // turn and nod
    pivot.add(template.clone(true));
    slot.add(pivot);
    scene.add(slot);
    return { slot, pivot, i, dir: i % 2 ? 1 : -1, tilt: TILTS[i % TILTS.length] };
  }

  function pose() {
    const total = slots.length * spacing;
    const t = reducedMotion ? 0 : time;
    slots.forEach((s) => {
      const x = ((((s.i * spacing + offset) % total) + total) % total) - total / 2;
      s.slot.position.set(x, Math.sin(t * 1.4 + s.i * 1.3) * 0.07 * headH, 0);
      s.slot.rotation.z = s.tilt + Math.sin(t * 0.9 + s.i * 2.1) * 0.07;
      s.pivot.rotation.y = reducedMotion ? s.i * 0.9 : s.dir * t * 0.5 + s.i * 1.3;
      s.pivot.rotation.x = Math.sin(t * 1.1 + s.i * 0.9) * 0.06;
    });
    renderer.render(scene, camera);
  }

  function layout() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const viewW = VIEW_H * camera.aspect;
    headH = (Math.min(0.56 * h, (0.6 * w) / ratio) / h) * VIEW_H;
    spacing = headH * ratio * SPACING;
    if (!template) return;
    const needed = Math.ceil((viewW + 2 * headH) / spacing) + 1;
    if (slots.length !== needed) {
      slots.forEach((s) => scene.remove(s.slot));
      slots = Array.from({ length: needed }, (_, i) => makeSlot(i));
    }
    slots.forEach((s) => s.slot.scale.setScalar(headH));
    pose();
  }

  onFrame((dt) => {
    if (!visible || !template || reducedMotion) return;
    time += dt;
    offset -= DRIFT * spacing * dt;
    pose();
  });

  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: "120px 0px" }).observe(section);
  new ResizeObserver(layout).observe(canvas);

  loadRisoHead(pr).then(
    (head) => {
      ratio = head.width / head.height;
      const holder = new THREE.Group();
      holder.scale.setScalar(1 / head.height);
      holder.add(head.object);
      template = new THREE.Group().add(holder);
      layout();
      section.classList.add("is-ready");
    },
    () => section.classList.add("no-3d"),
  );
}
