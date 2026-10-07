import * as THREE from 'three';
import { beamVertex, beamFragment } from './shaders/beam.js';
import { ROOM } from './room.js';
 
// ---------------------------------------------------------------------------
// Lighting:
//   • AmbientLight        — keeps the hall readable, nothing is pure black
//   • SpotLight           — travels overhead and sweeps across the statue,
//                           casting a real moving shadow on the floor
//   • PointLight x N      — small picture lights above the paintings
//   • beam cone           — custom shader mesh so the shaft is visible in air
// ---------------------------------------------------------------------------
 
// One dial for the whole mood of the hall. 1.0 is a dim gallery at night.
// Nudge it to 1.3 if your screen is dark, or 0.8 for something moodier.
// The spotlight is deliberately left out, so raising this never flattens the
// contrast between the lit statue and the room around it.
export const BRIGHTNESS = 1.0;
 
export function buildLights(scene, focus) {
  const ambient = new THREE.AmbientLight(0xc6d0e2, 0.50 * BRIGHTNESS);
  scene.add(ambient);
 
  // A weak fill from above so the ceiling is not dead flat.
  const hemi = new THREE.HemisphereLight(0xaec4dd, 0x453f37, 0.38 * BRIGHTNESS);
  scene.add(hemi);
 
  // --- the travelling spotlight -------------------------------------------
  const spot = new THREE.SpotLight(0xfff0d2, 150, 24, Math.PI / 13, 0.5, 1.6);
  spot.position.set(0, ROOM.height - 0.6, focus.z + 2.5);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.camera.near = 0.5;
  spot.shadow.camera.far = 25;
  spot.shadow.bias = -0.0007;
  spot.shadow.radius = 3;
  scene.add(spot);
 
  const spotTarget = new THREE.Object3D();
  spotTarget.position.copy(focus);
  scene.add(spotTarget);
  spot.target = spotTarget;
 
  // The lamp housing, so the light appears to come from an object.
  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 0.34, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 0.5, metalness: 0.7, side: THREE.DoubleSide })
  );
  scene.add(housing);
 
  // --- CUSTOM SHADER: the visible beam ------------------------------------
  const beamUniforms = {
    uTime:      { value: 0 },
    uColor:     { value: new THREE.Color('#ffe9bd') },
    uIntensity: { value: 0.22 },
  };
  // Unit cone: 1 tall, wide end (+Y) is the end that lands on the statue,
  // narrow end (-Y) sits at the lamp. It gets scaled to fit each frame.
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 0.035, 1, 32, 1, true),
    new THREE.ShaderMaterial({
      vertexShader: beamVertex,
      fragmentShader: beamFragment,
      uniforms: beamUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  scene.add(beam);
 
  // --- rim light: separates the statue from the wall behind it -------------
  const rim = new THREE.PointLight(0x9fc4ff, 13 * BRIGHTNESS, 11, 2);
  rim.position.set(focus.x, focus.y + 0.9, focus.z - 3.0);
  scene.add(rim);
 
  // --- house lights: a warm wash so the hall is never a black void ---------
  const houseLights = [];
  [[-6.5, 4.6, 3.0], [6.5, 4.6, 3.0]].forEach(([x, y, z]) => {
    const light = new THREE.PointLight(0xffeccb, 6.5 * BRIGHTNESS, 13, 2);
    light.position.set(x, y, z);
    scene.add(light);
    houseLights.push(light);
  });
 
  // --- picture lights ------------------------------------------------------
  const pictureLights = [];
  function addPictureLight(position) {
    const light = new THREE.PointLight(0xffe2b0, 11 * BRIGHTNESS, 9, 2);
    light.position.copy(position);
    scene.add(light);
 
    const shade = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xd8bc8e })
    );
    shade.position.copy(position);
    scene.add(shade);
 
    pictureLights.push(light);
    return light;
  }
 
  // --- animation -----------------------------------------------------------
  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  const midpoint = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
 
  /**
   * Moves the spotlight along an overhead arc while its aim point sweeps
   * across the statue, then rebuilds the beam cone to match.
   */
  function update(time, sweeping) {
    if (sweeping) {
      const angle = time * 0.45;
 
      // The lamp travels on a modest overhead arc. Keeping it fairly close to
      // directly above stops the cone striking the figure at a raking angle.
      spot.position.set(
        focus.x + Math.sin(angle) * 2.4,
        ROOM.height - 0.5,
        focus.z + Math.cos(angle * 0.8) * 1.4 + 1.0
      );
 
      // The aim point crosses the statue left to right and rides up and down.
      // These amplitudes are deliberately small: the figure is only about a
      // metre wide, so a wide sweep would spend most of its time lighting the
      // floor beside it instead of the statue itself.
      spotTarget.position.set(
        focus.x + Math.sin(angle * 1.15) * 0.42,
        focus.y - 0.35 + Math.sin(angle * 0.7) * 0.55,
        focus.z + Math.cos(angle * 1.15) * 0.20
      );
    }
 
    housing.position.copy(spot.position);
 
    // Orient and stretch the beam cone from the lamp to the aim point.
    direction.subVectors(spotTarget.position, spot.position);
    const length = direction.length();
    midpoint.copy(spot.position).addScaledVector(direction, 0.5);
 
    beam.position.copy(midpoint);
    quaternion.setFromUnitVectors(up, direction.clone().normalize());
    beam.quaternion.copy(quaternion);
 
    // Radius at the far end follows the real cone angle of the SpotLight.
    const farRadius = Math.tan(spot.angle) * length;
    beam.scale.set(farRadius, length, farRadius);
 
    beamUniforms.uTime.value = time;
  }
 
  return { ambient, hemi, rim, houseLights, spot, spotTarget, beam, beamUniforms, addPictureLight, pictureLights, update };
}