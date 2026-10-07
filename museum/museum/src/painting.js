import * as THREE from 'three';
import { smartTexture, frameTexture, artworkTextures } from './textures.js';

// ---------------------------------------------------------------------------
// A framed painting. The canvas mesh is the raycaster target: clicking it
// advances to the next artwork texture, which is requirement 4 of project 14
// ("texture of the painting will change").
// ---------------------------------------------------------------------------

const TITLES = [
  'Harbour by Moonlight',
  'Study in Four Bands',
  'Botanical Plate XI',
  'The City at Dusk',
];

let sharedArtworks = null;
let sharedFrameMap = null;

export function buildPainting(scene, {
  position = new THREE.Vector3(0, 2.6, -7.9),
  rotationY = 0,
  width = 2.6,
  height = 1.95,
  startIndex = 0,
} = {}) {
  if (!sharedArtworks) sharedArtworks = artworkTextures();
  if (!sharedFrameMap) sharedFrameMap = smartTexture('/textures/frame.jpg', frameTexture, { repeat: [2, 1] });

  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  // --- canvas --------------------------------------------------------------
  let index = startIndex % sharedArtworks.length;
  const canvasMaterial = new THREE.MeshStandardMaterial({
    map: sharedArtworks[index],
    roughness: 0.82,
    metalness: 0.0,
  });
  const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), canvasMaterial);
  canvasMesh.position.z = 0.045;
  canvasMesh.receiveShadow = true;
  group.add(canvasMesh);

  // --- frame ---------------------------------------------------------------
  const frameMaterial = new THREE.MeshStandardMaterial({
    map: sharedFrameMap,
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.85,
  });
  const bar = 0.15;
  const depth = 0.14;
  const bars = [
    [width + bar * 2, bar, 0, height / 2 + bar / 2],
    [width + bar * 2, bar, 0, -height / 2 - bar / 2],
    [bar, height, -width / 2 - bar / 2, 0],
    [bar, height, width / 2 + bar / 2, 0],
  ];
  bars.forEach(([w, h, x, y]) => {
    const piece = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), frameMaterial);
    piece.position.set(x, y, 0);
    piece.castShadow = true;
    group.add(piece);
  });

  // --- wall label ----------------------------------------------------------
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512; labelCanvas.height = 128;
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;

  const drawLabel = () => {
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = '#efe9db';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#221f1a';
    ctx.font = '600 34px Georgia, serif';
    ctx.fillText(TITLES[index % TITLES.length], 26, 58);
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillStyle = '#5c554a';
    ctx.fillText('oil on canvas — click to change', 26, 96);
    labelTexture.needsUpdate = true;
  };
  drawLabel();

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.18),
    new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.9 })
  );
  label.position.set(width / 2 + 0.02, -height / 2 - 0.45, 0.05);
  group.add(label);

  scene.add(group);

  return {
    group,
    /** The mesh the raycaster should test against. */
    target: canvasMesh,
    nextArtwork() {
      index = (index + 1) % sharedArtworks.length;
      canvasMaterial.map = sharedArtworks[index];
      canvasMaterial.needsUpdate = true;
      drawLabel();
      return TITLES[index % TITLES.length];
    },
  };
}
