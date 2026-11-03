import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { RISO_GLSL, RISO_VERT } from "./riso-shapes.js";

// The head scan in the riso-print style: two inks (blue + pink) printed as
// halftone dots on cream paper, the pink one slightly off-register.
// Ported from risohead.html; the sunglasses run the same shader on flat colours.

const BODY = `
  vec3 c = texture2D(map, vUv).rgb;
  vec3 g = pow(c, vec3(1.0/2.2));
  vec3 g2 = pow(texture2D(map, vUv + vec2(0.0014,-0.0010)).rgb, vec3(1.0/2.2));
  float s = dot(normalize(vN), normalize(vec3(0.4,0.6,0.7)))*0.5+0.5;
  float l1 = clamp(dot(g,vec3(0.299,0.587,0.114))*1.08 + (s-0.5)*0.32, 0.0, 1.0);
  float l2 = clamp(g2.r*0.98 + (s-0.5)*0.18, 0.0, 1.0);
  vec2 p = gl_FragCoord.xy/pr;
  float l1s = clamp((l1-0.14)/0.62, 0.0, 1.0), l2s = clamp((l2-0.22)/0.55, 0.0, 1.0);
  float blue = ht(p, 0.7854, 3.6, pow(1.0-l1s, 2.0)*0.9);
  float pink = ht(p, 0.2618, 3.6, (1.0-l2s)*0.85 + 0.08);
  vec3 paper = vec3(0.96,0.92,0.83) * (0.97 + 0.06*hash(p));
  vec3 inkB = vec3(0.0,0.40,0.80), inkP = vec3(1.0,0.28,0.52);
  vec3 col = paper * mix(vec3(1.0), inkB, blue*0.95) * mix(vec3(1.0), inkP, pink*0.9);
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
  #include <colorspace_fragment>
`;

function solid(r, g, b) {
  const t = new THREE.DataTexture(
    new Uint8Array([r * 255, g * 255, b * 255, 255]),
    1,
    1,
  );
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function risoMaterial(map, pr) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, pr },
    vertexShader: RISO_VERT,
    fragmentShader: `uniform sampler2D map; uniform float pr;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${RISO_GLSL}
      void main(){ ${BODY} }`,
    side: THREE.DoubleSide,
  });
}

// Resolves to { object, width, height, depth }.
// `object` is a group centred on the head: rotate object.rotation.y to turn it.
// The scan lies sideways in the file, so it is stood up here (+90deg about Z);
// the face then looks down +z. The size is the upright bounding box (1 = scan units).
export async function loadRisoHead(url, pr) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  let head = null;
  const parts = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material.map && o.material.name !== "M_Glass_Lenses") head = o;
    else parts.push({ mesh: o, kind: o.material.name === "M_Glass_Lenses" ? "lens" : "frame" });
  });

  const map = head.material.map;
  head.geometry = toCreasedNormals(head.geometry, Math.PI); // smooth across UV seams
  const mats = {
    head: risoMaterial(map, pr),
    frame: risoMaterial(solid(0.2, 0.2, 0.32), pr),
    lens: risoMaterial(solid(0, 0, 0), pr),
  };
  head.material = mats.head;
  for (const p of parts) {
    p.mesh.geometry = toCreasedNormals(p.mesh.geometry, Math.PI / 3); // keep frame edges
    p.mesh.material = mats[p.kind];
  }

  const c = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  root.position.sub(c);
  const upright = new THREE.Group();
  upright.rotation.z = Math.PI / 2;
  upright.add(root);
  const object = new THREE.Group();
  object.add(upright);
  object.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  return { object, width: size.x, height: size.y, depth: size.z };
}
