import * as THREE from 'three';
import { smartTexture, wallTexture, floorTexture, ceilingTexture } from './textures.js';

export const ROOM = { width: 22, height: 6.5, depth: 16 };

export function buildRoom(scene) {
  const { width, height, depth } = ROOM;
  const group = new THREE.Group();

  // --- floor ---------------------------------------------------------------
  const floorMap = smartTexture('/textures/floor.jpg', floorTexture, { repeat: [6, 4] });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.35, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // --- ceiling -------------------------------------------------------------
  const ceilingMap = smartTexture('/textures/ceiling.jpg', ceilingTexture, { repeat: [8, 6] });
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: ceilingMap, roughness: 0.95 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  // --- walls ---------------------------------------------------------------
  const wallMap = smartTexture('/textures/wall.jpg', wallTexture, { repeat: [5, 2] });
  const wallMaterial = new THREE.MeshStandardMaterial({ map: wallMap, roughness: 0.92 });

  const makeWall = (w, h, position, rotationY) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMaterial);
    wall.position.set(position.x, position.y, position.z);
    wall.rotation.y = rotationY;
    wall.receiveShadow = true;
    group.add(wall);
    return wall;
  };

  makeWall(width, height, { x: 0, y: height / 2, z: -depth / 2 }, 0);                 // back
  makeWall(width, height, { x: 0, y: height / 2, z: depth / 2 }, Math.PI);            // front
  makeWall(depth, height, { x: -width / 2, y: height / 2, z: 0 }, Math.PI / 2);       // left
  makeWall(depth, height, { x: width / 2, y: height / 2, z: 0 }, -Math.PI / 2);       // right

  // --- skirting board and cornice -----------------------------------------
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1815, roughness: 0.6 });
  const trim = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), trimMaterial);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    group.add(m);
  };
  const t = 0.3;
  trim(width, t, 0.18, 0, t / 2, -depth / 2 + 0.09);
  trim(width, t, 0.18, 0, t / 2, depth / 2 - 0.09);
  trim(0.18, t, depth, -width / 2 + 0.09, t / 2, 0);
  trim(0.18, t, depth, width / 2 - 0.09, t / 2, 0);

  const cornice = new THREE.MeshStandardMaterial({ color: 0x38321f, roughness: 0.7, metalness: 0.25 });
  const cor = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), cornice);
    m.position.set(x, height - 0.11, z);
    group.add(m);
  };
  cor(width, 0.22, 0, -depth / 2 + 0.11);
  cor(width, 0.22, 0, depth / 2 - 0.11);
  cor(0.22, depth, -width / 2 + 0.11, 0);
  cor(0.22, depth, width / 2 - 0.11, 0);

  // --- a bench, so the hall reads as a room and not a box ------------------
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.55 });
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 0.9), benchMaterial);
  seat.position.y = 0.52;
  seat.castShadow = seat.receiveShadow = true;
  bench.add(seat);
  [-1.35, 1.35].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.7), benchMaterial);
    leg.position.set(x, 0.26, 0);
    leg.castShadow = true;
    bench.add(leg);
  });
  bench.position.set(0, 0, 3.6);
  group.add(bench);

  scene.add(group);
  return group;
}
