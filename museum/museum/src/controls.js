import * as THREE from 'three';
import { ROOM } from './room.js';

// ---------------------------------------------------------------------------
// Requirement 6: mouse and keyboard interaction.
//   keyboard — walk the camera around the hall, plus toggles
//   mouse    — drag to look, click a painting to change its artwork
// ---------------------------------------------------------------------------

export function createControls({ camera, renderer, paintings, onStatus }) {
  const state = {
    autoTour: true,
    sweeping: true,
    yaw: Math.PI,
    pitch: -0.04,
    speed: 3.4,
  };

  const keys = new Set();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  const say = (message) => onStatus && onStatus(message);

  // --- keyboard ------------------------------------------------------------
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keys.add(key);

    if (key === 'c') {
      state.autoTour = !state.autoTour;
      if (!state.autoTour) {
        // Hand over control from wherever the tour left the camera.
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        state.yaw = euler.y;
        state.pitch = euler.x;
      }
      say(state.autoTour
        ? 'Guided tour is running. Press C to walk on your own.'
        : 'You have the camera. W A S D to walk, drag to look.');
    }

    if (key === 'l') {
      state.sweeping = !state.sweeping;
      say(state.sweeping ? 'Spotlight is sweeping across the statue.' : 'Spotlight is holding still.');
    }

    if (key === 't') {
      const title = paintings[0].nextArtwork();
      say(`Now showing: ${title}`);
    }

    // Movement keys should not scroll the page.
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

  // --- mouse ---------------------------------------------------------------
  const canvas = renderer.domElement;
  let dragging = false;
  let travelled = 0;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    travelled = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    // Hover feedback: the cursor changes over a clickable painting.
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const over = raycaster.intersectObjects(paintings.map((p) => p.target), false);
    canvas.style.cursor = over.length ? 'pointer' : 'default';

    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    travelled += Math.abs(dx) + Math.abs(dy);
    lastX = event.clientX;
    lastY = event.clientY;

    if (state.autoTour) return;            // looking is disabled during the tour
    state.yaw -= dx * 0.0032;
    state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0028, -0.9, 0.9);
  });

  canvas.addEventListener('pointerup', (event) => {
    dragging = false;
    canvas.releasePointerCapture(event.pointerId);

    // A short press counts as a click, a long one was a look-around.
    if (travelled > 6) return;

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    for (const painting of paintings) {
      const hit = raycaster.intersectObject(painting.target, false);
      if (hit.length) {
        const title = painting.nextArtwork();
        say(`Now showing: ${title}`);
        break;
      }
    }
  });

  // --- per-frame update ----------------------------------------------------
  const bounds = {
    x: ROOM.width / 2 - 1.0,
    z: ROOM.depth / 2 - 1.0,
  };

  function update(delta, time, tourFocus) {
    if (state.autoTour) {
      // A slow arc around the hall, always facing the statue.
      const angle = time * 0.16;
      const radius = 6.4 + Math.sin(time * 0.23) * 1.5;
      camera.position.set(
        tourFocus.x + Math.sin(angle) * radius,
        1.75 + Math.sin(time * 0.31) * 0.35,
        tourFocus.z + Math.cos(angle) * radius * 0.85 + 1.2
      );
      camera.lookAt(tourFocus.x, tourFocus.y - 0.6, tourFocus.z);
      return;
    }

    // Turn with Q/E and the left/right arrows.
    if (keys.has('q') || keys.has('arrowleft')) state.yaw += 1.5 * delta;
    if (keys.has('e') || keys.has('arrowright')) state.yaw -= 1.5 * delta;
    if (keys.has('arrowup')) state.pitch = Math.min(state.pitch + 1.1 * delta, 0.9);
    if (keys.has('arrowdown')) state.pitch = Math.max(state.pitch - 1.1 * delta, -0.9);

    camera.quaternion.setFromEuler(new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ'));

    forward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    right.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));

    const step = state.speed * delta * (keys.has('shift') ? 2 : 1);
    if (keys.has('w')) camera.position.addScaledVector(forward, step);
    if (keys.has('s')) camera.position.addScaledVector(forward, -step);
    if (keys.has('d')) camera.position.addScaledVector(right, step);
    if (keys.has('a')) camera.position.addScaledVector(right, -step);
    if (keys.has('r')) camera.position.y += step * 0.7;
    if (keys.has('f')) camera.position.y -= step * 0.7;

    // Stay inside the building.
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -bounds.x, bounds.x);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -bounds.z, bounds.z);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.8, ROOM.height - 0.6);
  }

  return { state, update };
}
