// Loads the 3D scan of Rens's head and prints it in the riso style: two inks
// (blue and pink) as halftone dots on cream paper, the pink slightly
// off-register. The sunglasses use the same shader on flat colours.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { RISO_GLSL, RISO_VERT } from "./riso.js";

const MODEL_URL = "models/head-riso.glb";

const HEAD_SHADER = /* glsl */ `
  vec3 c = pow(texture2D(map, vUv).rgb, vec3(1.0 / 2.2));
  vec3 shifted = pow(texture2D(map, vUv + vec2(0.0014, -0.0010)).rgb, vec3(1.0 / 2.2));
  float light = dot(normalize(vN), normalize(vec3(0.4, 0.6, 0.7))) * 0.5 + 0.5;
  float l1 = clamp(dot(c, vec3(0.299, 0.587, 0.114)) * 1.08 + (light - 0.5) * 0.32, 0.0, 1.0);
  float l2 = clamp(shifted.r * 0.98 + (light - 0.5) * 0.18, 0.0, 1.0);
  vec2 p = gl_FragCoord.xy / pr;
  float s1 = clamp((l1 - 0.14) / 0.62, 0.0, 1.0);
  float s2 = clamp((l2 - 0.22) / 0.55, 0.0, 1.0);
  float blue = ht(p, 0.7854, 3.6, pow(1.0 - s1, 2.0) * 0.9);
  float pink = ht(p, 0.2618, 3.6, (1.0 - s2) * 0.85 + 0.08);
  vec3 paper = vec3(0.96, 0.92, 0.83) * (0.97 + 0.06 * hash(p));
  vec3 col = paper * mix(vec3(1.0), vec3(0.0, 0.40, 0.80), blue * 0.95)
                   * mix(vec3(1.0), vec3(1.0, 0.28, 0.52), pink * 0.9);
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
  #include <colorspace_fragment>
`;

function solidTexture(r, g, b) {
  const texture = new THREE.DataTexture(new Uint8Array([r * 255, g * 255, b * 255, 255]), 1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function risoMaterial(map, pr) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, pr },
    vertexShader: RISO_VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float pr;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${RISO_GLSL}
      void main() { ${HEAD_SHADER} }`,
    side: THREE.DoubleSide,
  });
}

/**
 * Resolves to { object, width, height }. `object` is a group centred on the
 * head, facing +z; turn it with object.rotation.y. The scan lies on its side
 * in the file, so it is stood up here. Sizes are the upright bounding box.
 */
export async function loadRisoHead(pr) {
  const { scene } = await new GLTFLoader().loadAsync(MODEL_URL);
  let head = null;
  const parts = [];
  scene.traverse((node) => {
    if (!node.isMesh) return;
    const isLens = node.material.name === "M_Glass_Lenses";
    if (node.material.map && !isLens) head = node;
    else parts.push({ mesh: node, kind: isLens ? "lens" : "frame" });
  });

  head.geometry = toCreasedNormals(head.geometry, Math.PI); // smooth across UV seams
  head.material = risoMaterial(head.material.map, pr);
  const glasses = {
    frame: risoMaterial(solidTexture(0.2, 0.2, 0.32), pr),
    lens: risoMaterial(solidTexture(0, 0, 0), pr),
  };
  parts.forEach(({ mesh, kind }) => {
    mesh.geometry = toCreasedNormals(mesh.geometry, Math.PI / 3); // keep the frame's edges
    mesh.material = glasses[kind];
  });

  scene.position.sub(new THREE.Box3().setFromObject(scene).getCenter(new THREE.Vector3()));
  const upright = new THREE.Group();
  upright.rotation.z = Math.PI / 2;
  upright.add(scene);
  const object = new THREE.Group();
  object.add(upright);
  object.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  return { object, width: size.x, height: size.y };
}
