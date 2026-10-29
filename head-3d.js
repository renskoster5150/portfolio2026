import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ---- Config ---------------------------------------------------------------
const MODEL_URL = "models/head.glb";
// The scan has no back of the head, so the turn is kept small. The mesh was
// checked from -35deg to +35deg; the animation only uses +/-20deg.
const YAW_START = THREE.MathUtils.degToRad(20); // looking slightly right
const YAW_END = THREE.MathUtils.degToRad(-20); // looking left
const SCROLL_SCREENS = 1.8; // timeline length, in viewport heights
const FACE_FORWARD_Z = 0.12; // pivot sits this far behind the face shell
// ---------------------------------------------------------------------------

const hero = document.getElementById("hero");
const canvas = hero && hero.querySelector(".hero-canvas");
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

if (hero && canvas) init();

function init() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion) hero.classList.add("reduce");

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    renderer = null; // no WebGL: the text composition still works without the head
  }

  const nameRens = hero.querySelector(".name-rens");
  const nameKoster = hero.querySelector(".name-koster");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6);
  const VIS_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15));

  scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2, 3, 4);
  scene.add(key);

  const pivot = new THREE.Group(); // yaw + slide happen here
  const holder = new THREE.Group(); // uniform scale
  pivot.add(holder);
  scene.add(pivot);
  pivot.visible = false;

  const box = { w: 0.745, h: 0.959 }; // scan bounds (width / height)
  let headLoaded = false;
  let worldHeadW = 0; // head width in world units after scaling
  let visW = 1;

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    new GLTFLoader().loadAsync(MODEL_URL).then(
      (gltf) => {
        const model = gltf.scene;
        const b = new THREE.Box3().setFromObject(model);
        const c = b.getCenter(new THREE.Vector3());
        // centre on x / y, and put the turning axis behind the face
        model.position.set(-c.x, -c.y, -(b.min.z + FACE_FORWARD_Z));
        holder.add(model);
        headLoaded = true;
        layout();
        needsRender = true;
      },
      () => {
        headLoaded = false;
        hero.style.setProperty("--head-w", "0px");
        hero.style.setProperty("--head-h", "0px");
      },
    );
  }

  // ---- Layout: how big the head is on this screen ---------------------------
  let vw = 1;
  let vh = 1;
  function layout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const portrait = vw / vh < 1;
    const headHpx = portrait
      ? Math.min(0.4 * vh, (0.84 * vw) / (box.w / box.h))
      : 0.66 * vh;
    const headWpx = headHpx * (box.w / box.h);

    if (renderer) {
      renderer.setSize(vw, vh, false);
      camera.aspect = vw / vh;
      camera.updateProjectionMatrix();
    }
    const scale = ((headHpx / vh) * VIS_H) / box.h;
    holder.scale.setScalar(scale);
    worldHeadW = box.w * scale;
    visW = VIS_H * (vw / vh);

    // the two words differ in width, so centre the gap between them on the head
    const rw = nameRens ? nameRens.offsetWidth : 0;
    const kw = nameKoster ? nameKoster.offsetWidth : 0;
    hero.style.setProperty("--name-fix", portrait ? "0px" : `${(kw - rw) / 2}px`);

    if (headLoaded) {
      hero.style.setProperty("--head-w", `${headWpx}px`);
      hero.style.setProperty("--head-h", `${headHpx}px`);
    }
    needsRender = true;
  }

  // ---- Scroll-driven timeline -----------------------------------------------
  let target = 0; // where the scroll says we should be
  let p = 0; // smoothed progress
  let needsRender = true;

  function readScroll() {
    target = reduceMotion ? 1 : clamp(window.scrollY / (SCROLL_SCREENS * window.innerHeight));
  }

  function apply(progress) {
    const headIn = easeOut(clamp(progress / 0.3));
    const t1 = easeOut(clamp((progress - 0.3) / 0.2));
    const t2 = easeOut(clamp((progress - 0.44) / 0.2));
    const t3 = easeOut(clamp((progress - 0.58) / 0.18));
    const turn = easeInOut(clamp((progress - 0.25) / 0.75));

    hero.style.setProperty("--head-in", headIn.toFixed(4));
    hero.style.setProperty("--t1", t1.toFixed(4));
    hero.style.setProperty("--t2", t2.toFixed(4));
    hero.style.setProperty("--t3", t3.toFixed(4));
    hero.classList.toggle("is-scrolled", progress > 0.03);
    hero.classList.toggle("cta-on", t3 > 0.6);
    document.body.style.setProperty("--shapes-o", clamp((progress - 0.6) / 0.35).toFixed(3));

    // head slides in from the left edge, facing right, then turns to the left
    const startX = -(visW / 2 + worldHeadW);
    pivot.position.x = startX * (1 - headIn);
    pivot.rotation.y = THREE.MathUtils.lerp(YAW_START, YAW_END, turn);
    pivot.visible = headLoaded && headIn > 0.001;
  }

  let raf = 0;
  function loop() {
    p += (target - p) * (reduceMotion ? 1 : 0.1);
    if (Math.abs(target - p) < 0.0004) p = target;
    apply(p);
    if (renderer && (needsRender || p !== target)) {
      renderer.render(scene, camera);
      needsRender = false;
    }
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => {
    layout();
    readScroll();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(loop);
  });

  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  readScroll();
  p = target; // opening mid-page (refresh) shouldn't replay the slide
  raf = requestAnimationFrame(loop);
}
