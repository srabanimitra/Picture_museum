import * as THREE from 'three';
import { buildRoom, ROOM } from './room.js';
import { buildStatue } from './statue.js';
import { buildPainting } from './painting.js';
import { buildLights } from './lights.js';
import { createControls } from './controls.js';
 
// ---------------------------------------------------------------------------
// A Museum — Computer Graphics Lab (CSE 4204), project 14
//
//   1. Custom shaders          src/shaders/marble.js, src/shaders/beam.js
//   2. Lighting                src/lights.js (ambient + moving spotlight)
//   3. Perspective projection  THREE.PerspectiveCamera, below
//   4. Textures                src/textures.js (every object is mapped)
//   5. Animation               spotlight sweep, camera tour, shader uTime
//   6. Interaction             src/controls.js (keyboard walk, mouse click)
// ---------------------------------------------------------------------------
 
const canvas = document.querySelector('#scene');
const statusLine = document.querySelector('#status');
 
// --- renderer ---------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
 
// --- scene ------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101218);
scene.fog = new THREE.Fog(0x181a20, 20, 48);
 
// --- perspective projection (requirement 3) ---------------------------------
// A 55 degree field of view at the window's aspect ratio, with near and far
// clipping planes sized to the hall. This is what makes distant exhibits
// shrink and gives the room its sense of depth.
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.75, 6.5);
camera.lookAt(0, 1.6, -3.5);
 
// --- contents ---------------------------------------------------------------
buildRoom(scene);
 
const statue = buildStatue(scene, new THREE.Vector3(0, 0, -3.5));
 
const paintings = [
  buildPainting(scene, {
    position: new THREE.Vector3(0, 2.9, -ROOM.depth / 2 + 0.12),
    rotationY: 0,
    width: 3.0, height: 2.2, startIndex: 0,
  }),
  buildPainting(scene, {
    position: new THREE.Vector3(-ROOM.width / 2 + 0.12, 2.7, -2.0),
    rotationY: Math.PI / 2,
    width: 2.4, height: 1.8, startIndex: 1,
  }),
  buildPainting(scene, {
    position: new THREE.Vector3(ROOM.width / 2 - 0.12, 2.7, -2.0),
    rotationY: -Math.PI / 2,
    width: 2.4, height: 1.8, startIndex: 2,
  }),
];
 
const lights = buildLights(scene, statue.focus);
// Set back from the wall and lower, so they graze the canvas instead of
// burning a hot spot into the middle of it.
lights.addPictureLight(new THREE.Vector3(0, 4.1, -ROOM.depth / 2 + 2.0));
lights.addPictureLight(new THREE.Vector3(-ROOM.width / 2 + 2.0, 3.9, -2.0));
lights.addPictureLight(new THREE.Vector3(ROOM.width / 2 - 2.0, 3.9, -2.0));
 
// --- controls ---------------------------------------------------------------
const controls = createControls({
  camera,
  renderer,
  paintings,
  onStatus: (message) => { statusLine.textContent = message; },
});
 
// --- render loop ------------------------------------------------------------
const clock = new THREE.Clock();
 
function animate() {
  requestAnimationFrame(animate);
 
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.getElapsedTime();
 
  controls.update(delta, time, statue.focus);
  lights.update(time, controls.state.sweeping);
 
  // Feed the moving spotlight into the hand-written marble shader so the
  // pedestal is lit by the same source as everything else.
  statue.marbleUniforms.uTime.value = time;
  statue.marbleUniforms.uLightPosition.value.copy(lights.spot.position);
 
  renderer.render(scene, camera);
}
 
animate();
 
// --- resize -----------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();          // recompute the projection matrix
  renderer.setSize(window.innerWidth, window.innerHeight);
});