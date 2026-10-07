# A Museum — Computer Graphics Lab (CSE 4204), Project 14

A 3D museum hall in Three.js: a textured statue on a marble pedestal, framed
paintings whose artwork changes on click, a camera that moves around the hall,
and a spotlight that sweeps across the statue.

---

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

It runs immediately with no downloads — every texture is drawn on a `<canvas>`
at startup. See "Swapping in real textures" below to upgrade them.

---

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | walk |
| `Q` `E` / arrow keys | turn and look |
| `R` `F` | rise and crouch |
| `Shift` | walk faster |
| drag with the mouse | look around |
| click a painting | change its artwork |
| `T` | change the back-wall artwork from the keyboard |
| `C` | guided tour on / off |
| `L` | spotlight sweep on / off |

---

## Build order

Work through these in order. Each step leaves you with something that runs, so
you always have a working demo to show.

**1. Set up the project.** `npm create vite@latest`, pick vanilla JS, then
`npm install three`. Or just use this folder as-is.

**2. Renderer, scene, perspective camera.** Get a coloured background on
screen. Add the resize handler now so you never fight it later.
→ `src/main.js`

**3. The room.** Floor, ceiling, four walls, skirting board, cornice, a bench.
Textured with `MeshStandardMaterial` so they can receive shadows.
→ `src/room.js`

**4. The statue.** A `LatheGeometry` robe plus spheres and cylinders for the
head and arms, all under one marble texture. Set `castShadow = true` on every
mesh — the shadow is what sells the moving spotlight later.
→ `src/statue.js`

**5. The paintings.** A plane for the canvas, four boxes for the frame, a small
plaque underneath. Load all the artwork textures up front into an array so the
swap is instant.
→ `src/painting.js`

**6. Lighting.** `AmbientLight` for a readable base, then a `SpotLight` with
`castShadow = true` and a 2048×2048 shadow map. Remember `spot.target` has to
be added to the scene or aiming silently does nothing.
→ `src/lights.js`

**7. Animation.** In the render loop, move the spotlight along an overhead arc
while its target sweeps across the statue. Because the light casts shadows, the
statue's shadow swings across the floor as it goes.
→ `lights.update()`

**8. Keyboard and mouse.** A `Set` of held keys, moved along the camera's
forward and right vectors each frame; a `Raycaster` on pointer-up that tests
the painting canvases and calls `nextArtwork()` on a hit. Distinguish a click
from a drag by tracking how far the pointer travelled.
→ `src/controls.js`

**9. Custom shaders.** Two hand-written GLSL programs:

- `src/shaders/marble.js` — procedural marble on the pedestal. Value noise →
  fBm → warped sine gives the veining; ambient, diffuse and Blinn-Phong
  specular are computed by hand from a light position `main.js` feeds in every
  frame, so the pedestal responds to the moving spotlight.
- `src/shaders/beam.js` — the visible shaft of light. A hollow cone with a
  fresnel rim term, a fade along its length, and drifting dust motes, drawn
  with additive blending and `depthWrite: false`.

**10. Polish.** Fog, ACES tone mapping, the wall plaques, the bench, hover
cursor feedback. Aesthetics are marked, and this is where they come from.

---

## How the six required features are covered

| Requirement | Where | What to point at in your viva |
| --- | --- | --- |
| Custom shaders | `src/shaders/marble.js`, `src/shaders/beam.js` | fBm noise, hand-written Blinn-Phong, additive fresnel beam |
| Lighting | `src/lights.js` | ambient + hemisphere fill, shadow-casting spotlight, three picture lights |
| Perspective projection | `src/main.js` | `PerspectiveCamera(55, aspect, 0.1, 200)` and `updateProjectionMatrix()` on resize |
| Texture for each object | `src/textures.js` | floor, walls, ceiling, statue, frames, four artworks, plaques |
| Animation | `lights.update()`, `controls.update()` | spotlight arc and sweep, guided camera tour, `uTime` in both shaders |
| Mouse and keyboard | `src/controls.js` | raycast click to change artwork, WASD walk, C/L/T toggles |

Project 14's own columns: statue with texture ✓, painting with texture ✓,
camera moves around the museum ✓, painting texture changes ✓, spotlight moves
across the statue ✓.

---

## Swapping in real textures

Every texture is procedural by default, and every one of them upgrades itself
if a real file is present. Drop files at these paths and reload — no code
changes:

```
public/textures/floor.jpg
public/textures/wall.jpg
public/textures/ceiling.jpg
public/textures/statue.jpg
public/textures/frame.jpg
public/textures/paintings/art1.jpg   … art4.jpg
```

Free, licence-clean sources: ambientCG, Poly Haven, and any public-domain
museum collection (the Met and Rijksmuseum both publish open-access artwork
images) for the paintings.

`smartTexture()` in `src/textures.js` handles this: it returns the canvas
version straight away, then quietly replaces the image if the file loads.

## Using a downloaded statue model instead

Allowed by the project note. Put a `.glb` in `public/models/`, then in
`src/statue.js`:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

new GLTFLoader().load('/models/statue.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.setScalar(1.4);
  model.position.y = 1.22;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material.map = marbleMap;      // keep the texture requirement met
    }
  });
  group.add(model);
  figure.visible = false;                  // hide the primitive figure
});
```

---

## For the report

The template follows the same shape as the sample report: cover page, Project
Requirements, Key Requirements, Software Platform, Project Features (one
numbered paragraph each), a feature/status table, Snapshots, Contribution, and
Future Work.

For snapshots, take six: the guided tour from a wide angle, a close view of the
statue with the beam visible, the same statue with the spotlight on the other
side (so the moving shadow is obvious), each of two different artworks in the
same frame, and one shot from a corner showing the whole hall.

Split the contribution honestly along module lines — for two people, roughly:
room + statue + marble shader + lighting for one, paintings + textures + beam
shader + controls for the other.
