import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { smartTexture, statueTexture } from './textures.js';
import { marbleVertex, marbleFragment } from './shaders/marble.js';
 
// ---------------------------------------------------------------------------
// The statue.
//
// By default it is built from Three.js primitives: a spline-driven
// LatheGeometry for the robe, with its vertices displaced afterwards to carve
// drapery folds, and limbs placed by a bone() helper so every joint actually
// meets its neighbour instead of floating beside it.
//
// If you drop a model at public/models/statue.glb it is used instead and the
// primitive figure hides itself. Both routes are allowed by the project brief.
// ---------------------------------------------------------------------------
 
const MODEL_URL = '/models/statue.glb';   // set to null to skip the attempt
 
export function buildStatue(scene, position = new THREE.Vector3(0, 0, -3.5)) {
  const group = new THREE.Group();
  group.position.copy(position);
 
  // --- pedestal: CUSTOM SHADER ---------------------------------------------
  const marbleUniforms = {
    uTime:          { value: 0 },
    uColorDeep:     { value: new THREE.Color('#4a4136') },
    uColorPale:     { value: new THREE.Color('#cfc6b2') },
    uVeinColor:     { value: new THREE.Color('#2b2620') },
    uLightPosition: { value: new THREE.Vector3(0, 5, 0) },
    uLightColor:    { value: new THREE.Color('#fff2d8') },
    uAmbient:       { value: 0.30 },
    uScale:         { value: 2.6 },
  };
 
  const pedestalMaterial = new THREE.ShaderMaterial({
    vertexShader: marbleVertex,
    fragmentShader: marbleFragment,
    uniforms: marbleUniforms,
  });
 
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 1.9), pedestalMaterial);
  plinth.position.y = 0.09;
  group.add(plinth);
 
  const column = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.0, 1.45), pedestalMaterial);
  column.position.y = 0.68;
  group.add(column);
 
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.14, 1.72), pedestalMaterial);
  cap.position.y = 1.25;
  group.add(cap);
 
  // --- material for the figure ---------------------------------------------
  const marbleMap = smartTexture('/textures/statue.jpg', statueTexture, { repeat: [1, 1] });
  const stone = new THREE.MeshStandardMaterial({
    map: marbleMap,
    color: 0xefe9dc,
    roughness: 0.62,
    metalness: 0.02,
  });
 
  const figure = new THREE.Group();
  figure.position.y = 1.32;
 
  // --- robe -----------------------------------------------------------------
  // Control points read (radius, height). A narrow waist and a flared hem are
  // what stop the silhouette looking like a stack of balls.
  const controlPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.52, 0.01),
    new THREE.Vector2(0.49, 0.12),
    new THREE.Vector2(0.42, 0.32),
    new THREE.Vector2(0.35, 0.55),
    new THREE.Vector2(0.28, 0.78),
    new THREE.Vector2(0.24, 0.94),
    new THREE.Vector2(0.27, 1.10),
    new THREE.Vector2(0.29, 1.24),
    new THREE.Vector2(0.24, 1.38),
    new THREE.Vector2(0.14, 1.46),
  ];
  const profile = new THREE.SplineCurve(controlPoints).getPoints(64);
 
  const robeGeometry = new THREE.LatheGeometry(profile, 96);
 
  // Carve vertical drapery folds by pushing each vertex in or out along its
  // own radius. The effect fades out toward the shoulders.
  const positionAttribute = robeGeometry.attributes.position;
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);
 
    const radius = Math.hypot(x, z);
    const theta = Math.atan2(z, x);
 
    const weight = THREE.MathUtils.clamp(1.0 - y / 1.3, 0, 1);
    const fold = 1
      + 0.055 * Math.sin(theta * 11.0) * weight
      + 0.020 * Math.sin(theta * 5.0 + y * 3.0) * weight;
 
    positionAttribute.setXYZ(i, Math.cos(theta) * radius * fold, y, Math.sin(theta) * radius * fold);
  }
  robeGeometry.computeVertexNormals();
 
  const robe = new THREE.Mesh(robeGeometry, stone);
  figure.add(robe);
 
  // --- helper: a limb segment that spans exactly from A to B ----------------
  const UP = new THREE.Vector3(0, 1, 0);
 
  function bone(from, to, radiusTop, radiusBottom) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
 
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 18),
      stone
    );
    mesh.position.copy(from).addScaledVector(direction, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
    return mesh;
  }
 
  function joint(at, radius) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), stone);
    mesh.position.copy(at);
    return mesh;
  }
 
  // --- torso, neck, head ----------------------------------------------------
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.30, 32, 24), stone);
  chest.position.set(0, 1.30, 0.01);
  chest.scale.set(1.05, 0.72, 0.80);
  figure.add(chest);
 
  figure.add(bone(new THREE.Vector3(0, 1.40, 0.01), new THREE.Vector3(0, 1.56, 0.02), 0.072, 0.095));
 
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 32, 24), stone);
  head.position.set(0, 1.70, 0.025);
  head.scale.set(0.88, 1.10, 0.98);
  figure.add(head);
 
  // Hair gathered at the back, so the head is not a bare sphere.
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 18), stone);
  hair.position.set(0, 1.73, -0.03);
  hair.scale.set(0.95, 0.92, 0.85);
  figure.add(hair);
 
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), stone);
  bun.position.set(0, 1.75, -0.155);
  figure.add(bun);
 
  // Laurel wreath
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.018, 10, 32), stone);
  wreath.position.set(0, 1.77, 0.02);
  wreath.rotation.x = Math.PI / 2 - 0.12;
  figure.add(wreath);
 
  // --- arms: shoulder to elbow to wrist ------------------------------------
  // Left arm hangs down and slightly forward.
  const leftShoulder = new THREE.Vector3(-0.245, 1.355, 0.02);
  const leftElbow    = new THREE.Vector3(-0.365, 1.030, 0.11);
  const leftWrist    = new THREE.Vector3(-0.305, 0.745, 0.235);
 
  figure.add(joint(leftShoulder, 0.088));
  figure.add(bone(leftShoulder, leftElbow, 0.078, 0.062));
  figure.add(joint(leftElbow, 0.062));
  figure.add(bone(leftElbow, leftWrist, 0.058, 0.048));
  figure.add(joint(leftWrist, 0.052));
 
  // Right arm is raised, holding a torch.
  const rightShoulder = new THREE.Vector3(0.245, 1.365, 0.02);
  const rightElbow    = new THREE.Vector3(0.425, 1.620, 0.06);
  const rightWrist    = new THREE.Vector3(0.365, 1.910, 0.12);
 
  figure.add(joint(rightShoulder, 0.088));
  figure.add(bone(rightShoulder, rightElbow, 0.078, 0.062));
  figure.add(joint(rightElbow, 0.062));
  figure.add(bone(rightElbow, rightWrist, 0.058, 0.048));
  figure.add(joint(rightWrist, 0.052));
 
  // The torch: a tapered shaft with a bowl at the top.
  const torchBase = new THREE.Vector3(0.365, 1.860, 0.12);
  const torchTip  = new THREE.Vector3(0.375, 2.230, 0.14);
  figure.add(bone(torchBase, torchTip, 0.030, 0.042));
 
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.045, 0.10, 20), stone);
  bowl.position.set(torchTip.x, torchTip.y + 0.05, torchTip.z);
  figure.add(bowl);
 
  // --- shadows --------------------------------------------------------------
  figure.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  group.add(figure);
 
  scene.add(group);
 
  // --- optional: replace the primitives with a downloaded model -------------
  if (MODEL_URL) {
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
 
        // Scale and centre the model so it stands on the pedestal whatever
        // units it happens to have been exported in.
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const centre = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(centre);
 
        const scale = 2.0 / size.y;                   // target height: 2 metres
        model.scale.setScalar(scale);
        model.position.set(-centre.x * scale, -box.min.y * scale, -centre.z * scale);
 
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = 0.62;
              child.material.metalness = 0.02;
              if (!child.material.map) child.material.map = marbleMap;
              child.material.needsUpdate = true;
            }
          }
        });
 
        const holder = new THREE.Group();
        holder.position.y = 1.32;
        holder.add(model);
        group.add(holder);
 
        figure.visible = false;                       // hide the primitive version
      },
      undefined,
      () => {
        /* no file there — the primitive figure stays, and no error is shown */
      }
    );
  }
 
  return {
    group,
    figure,
    marbleUniforms,
    /** Height the spotlight should aim at, in world space. */
    focus: new THREE.Vector3(position.x, position.y + 2.5, position.z),
  };
}
