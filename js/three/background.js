// A few riso-printed teardrops floating behind every page. They are real 3D
// objects: they turn slowly, tumble a little, drift with the pointer, and
// scrolling spins them further. Pages can fade them with the CSS variable
// --shapes-opacity on <html> (0 also pauses rendering).

import * as THREE from "three";
import { teardropGeometry, risoShapeMaterial, SHAPE_LOOKS, createRenderer } from "./riso.js";
import { onFrame, scroll, pointer } from "../lib/ticker.js";
import { reducedMotion } from "../lib/utils.js";

// ax / ay: home position on screen (-1..1), size: fraction of the viewport
// height, speed: parallax against scrolling, spin: radians per second
const SHAPES = [
  { look: 1, ax: 0.8, ay: 0.3, size: 0.46, speed: 0.55, spin: 0.35, tilt: 0.5, roll: 2.4 },
  { look: 0, ax: -0.82, ay: 0.62, size: 0.34, speed: 0.25, spin: -0.28, tilt: -0.4, roll: 0.9 },
  { look: 2, ax: -0.6, ay: -0.72, size: 0.3, speed: 0.9, spin: 0.22, tilt: 0.9, roll: -0.6 },
  { look: 3, ax: 0.6, ay: -0.8, size: 0.26, speed: 0.15, spin: -0.4, tilt: -0.8, roll: 1.7 },
];

/** holdScreens: how many screens of scrolling the shapes stay put (the pinned home hero). */
export function startBackground({ holdScreens = 0 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "shapes-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const renderer = createRenderer(canvas, 1.5);
  if (!renderer) return;
  document.body.prepend(canvas);

  const pr = { value: renderer.getPixelRatio() };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = 10;
  const VIEW_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15));

  const geometry = teardropGeometry();
  const materials = SHAPE_LOOKS.map((look) => risoShapeMaterial({ ...look, pr }));
  const count = window.innerWidth < 768 ? 3 : 4;
  const shapes = SHAPES.slice(0, count).map((def, i) => {
    const spinner = new THREE.Group(); // turns around its own long axis
    spinner.add(new THREE.Mesh(geometry, materials[def.look]));
    const holder = new THREE.Group(); // fixed tilt and roll, then position
    holder.rotation.set(def.tilt * 0.4, 0, def.roll);
    holder.add(spinner);
    scene.add(holder);
    return { def, holder, spinner, phase: i * 1.9 };
  });

  let viewW = 1;
  function layout() {
    const { innerWidth: w, innerHeight: h } = window;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewW = VIEW_H * camera.aspect;
    shapes.forEach((shape) => shape.holder.scale.setScalar(shape.def.size * VIEW_H));
  }

  let time = 0;
  let spinBoost = 0;
  let lastScroll = scroll.smooth;
  const lean = { x: 0, y: 0 };

  function place() {
    const travelled = (Math.max(0, scroll.smooth - holdScreens * scroll.vh) / scroll.vh) * VIEW_H;
    shapes.forEach(({ def, holder, spinner, phase }) => {
      const size = def.size * VIEW_H;
      const span = VIEW_H + size * 3; // wrap around vertically, off screen
      let y = def.ay * (VIEW_H / 2) + travelled * def.speed;
      y = ((((y + span / 2) % span) + span) % span) - span / 2;
      const x = def.ax * (viewW / 2) + Math.sin(time * 0.3 + phase) * size * 0.12;
      holder.position.set(x + lean.x * size * (0.3 + def.speed * 0.3), y - lean.y * size * 0.2, 0);
      holder.rotation.x = def.tilt * 0.4 + Math.sin(time * 0.45 + phase) * 0.18;
      spinner.rotation.y = phase + time * def.spin + spinBoost * Math.sign(def.spin);
    });
  }

  const opacity = () => parseFloat(document.documentElement.style.getPropertyValue("--shapes-opacity") || "1");

  onFrame((dt) => {
    if (!reducedMotion) {
      time += dt;
      spinBoost += (scroll.smooth - lastScroll) * 0.004; // scrolling turns them
      lean.x += (pointer.nx - lean.x) * 0.04;
      lean.y += (pointer.ny - lean.y) * 0.04;
    } else if (scroll.smooth === lastScroll) {
      return; // nothing moves without scrolling
    }
    lastScroll = scroll.smooth;
    if (opacity() <= 0.001) return;
    place();
    renderer.render(scene, camera);
  });

  window.addEventListener("resize", layout);
  layout();
  place();
  renderer.render(scene, camera);
  canvas.classList.add("is-ready");
}
