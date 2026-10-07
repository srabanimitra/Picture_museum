import * as THREE from 'three';
 
// ---------------------------------------------------------------------------
// Every surface in the museum is textured. So that the project runs the very
// first time you open it, each texture is drawn procedurally on a <canvas>.
// If you later drop a real image at the matching path in /public/textures/,
// smartTexture() swaps it in automatically and the procedural one is dropped.
// ---------------------------------------------------------------------------
 
const loader = new THREE.TextureLoader();
 
export function smartTexture(url, generator, { repeat = [1, 1], srgb = true } = {}) {
  const texture = generator();
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
 
  if (url) {
    loader.load(
      url,
      (loaded) => {
        texture.image = loaded.image;
        texture.needsUpdate = true;
      },
      undefined,
      () => {
        /* file missing — keep the procedural version, no error shown */
      }
    );
  }
  return texture;
}
 
function canvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}
 
function grain(ctx, size, amount, alpha) {
  for (let i = 0; i < amount; i++) {
    const v = Math.random() * 255;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }
}
 
// --- gallery wall: warm plaster with a subtle vertical wash ----------------
export function wallTexture() {
  const size = 512;
  const [c, ctx] = canvas(size);
  const wash = ctx.createLinearGradient(0, 0, 0, size);
  wash.addColorStop(0, '#403c36');
  wash.addColorStop(0.55, '#524c42');
  wash.addColorStop(1, '#474139');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);
 
  // Very large, very faint blotches: enough to break up the flat wash without
  // reading as smudges when the camera walks up close.
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,246,228,${0.004 + Math.random() * 0.010})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 40 + Math.random() * 70, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, size, 5000, 0.03);
  return new THREE.CanvasTexture(c);
}
 
// --- floor: checkerboard stone tiles ---------------------------------------
export function floorTexture() {
  const size = 512;
  const [c, ctx] = canvas(size);
  const tile = size / 4;
 
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const dark = (x + y) % 2 === 0;
      ctx.fillStyle = dark ? '#2a2825' : '#968f83';
      ctx.fillRect(x * tile, y * tile, tile, tile);
 
      // veining inside each tile
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(60,55,48,0.16)';
      ctx.lineWidth = 1.2;
      for (let v = 0; v < 5; v++) {
        ctx.beginPath();
        let px = x * tile + Math.random() * tile;
        let py = y * tile;
        ctx.moveTo(px, py);
        while (py < (y + 1) * tile) {
          px += (Math.random() - 0.5) * 22;
          py += tile / 7;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(size, i * tile); ctx.stroke();
  }
  grain(ctx, size, 4000, 0.04);
  return new THREE.CanvasTexture(c);
}
 
// --- ceiling: plain coffered plaster ---------------------------------------
export function ceilingTexture() {
  const size = 256;
  const [c, ctx] = canvas(size);
  ctx.fillStyle = '#35322c';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, size - 28, size - 28);
  grain(ctx, size, 1500, 0.03);
  return new THREE.CanvasTexture(c);
}
 
// --- statue: pale weathered marble -----------------------------------------
export function statueTexture() {
  const size = 512;
  const [c, ctx] = canvas(size);
  ctx.fillStyle = '#ddd6c6';
  ctx.fillRect(0, 0, size, size);
 
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(120,114,102,${0.05 + Math.random() * 0.12})`;
    ctx.lineWidth = 0.6 + Math.random() * 2.4;
    ctx.beginPath();
    let px = Math.random() * size;
    let py = Math.random() * size;
    ctx.moveTo(px, py);
    for (let s = 0; s < 16; s++) {
      px += (Math.random() - 0.5) * 60;
      py += (Math.random() - 0.4) * 46;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(90,84,72,${Math.random() * 0.07})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 30, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, size, 6000, 0.05);
  return new THREE.CanvasTexture(c);
}
 
// --- picture frame: gilded wood --------------------------------------------
export function frameTexture() {
  const size = 256;
  const [c, ctx] = canvas(size);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#6b5220');
  g.addColorStop(0.45, '#c5a05c');
  g.addColorStop(0.62, '#f0dda6');
  g.addColorStop(1, '#5c4519');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = `rgba(255,240,200,${Math.random() * 0.14})`;
    ctx.beginPath();
    const y = Math.random() * size;
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}
 
// --- artworks --------------------------------------------------------------
// Four procedurally painted canvases so the swap works before you add photos.
const artRecipes = [
  {
    // moonlit seascape
    sky: ['#12203a', '#2c4a6b', '#87a2b0'],
    paint(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0d1830'); g.addColorStop(0.55, '#40648a'); g.addColorStop(1, '#8fa8ac');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,247,222,0.92)';
      ctx.beginPath(); ctx.arc(w * 0.72, h * 0.26, w * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22364a'; ctx.fillRect(0, h * 0.62, w, h * 0.38);
      for (let i = 0; i < 60; i++) {
        ctx.strokeStyle = `rgba(220,235,240,${Math.random() * 0.4})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        const y = h * 0.62 + Math.random() * h * 0.38;
        ctx.beginPath(); ctx.moveTo(Math.random() * w, y); ctx.lineTo(Math.random() * w, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w * 0.72 - 20 + Math.random() * 40, y); ctx.lineTo(w * 0.72 - 40 + Math.random() * 80, y); ctx.stroke();
      }
    },
  },
  {
    // colour-field abstraction
    paint(ctx, w, h) {
      ctx.fillStyle = '#e5dcc8'; ctx.fillRect(0, 0, w, h);
      const bands = ['#b8402f', '#e0a13a', '#2f5d63', '#7a3f6b'];
      bands.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(w * 0.1, h * (0.1 + i * 0.2), w * 0.8, h * 0.14);
      });
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = '#000';
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    // botanical study
    paint(ctx, w, h) {
      ctx.fillStyle = '#f2ead6'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#3f5a2e'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.92); ctx.lineTo(w * 0.5, h * 0.22); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const y = h * (0.28 + i * 0.07);
        const dir = i % 2 === 0 ? 1 : -1;
        ctx.fillStyle = `rgba(${70 + i * 6},${100 + i * 5},${50},0.9)`;
        ctx.beginPath();
        ctx.ellipse(w * 0.5 + dir * w * 0.16, y, w * 0.15, h * 0.035, dir * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#c8543f';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.19, w * 0.075, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8a93c';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.19, w * 0.03, 0, Math.PI * 2); ctx.fill();
    },
  },
  {
    // city at dusk
    paint(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2b1b3d'); g.addColorStop(0.6, '#8a4a3c'); g.addColorStop(1, '#e0a05a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      let x = 0;
      while (x < w) {
        const bw = w * (0.05 + Math.random() * 0.07);
        const bh = h * (0.2 + Math.random() * 0.45);
        ctx.fillStyle = `rgba(${20 + Math.random() * 18},${16 + Math.random() * 14},${30},1)`;
        ctx.fillRect(x, h - bh, bw, bh);
        for (let wy = h - bh + 8; wy < h - 10; wy += 14) {
          for (let wx = x + 5; wx < x + bw - 6; wx += 12) {
            if (Math.random() > 0.55) {
              ctx.fillStyle = `rgba(255,220,140,${0.35 + Math.random() * 0.5})`;
              ctx.fillRect(wx, wy, 5, 7);
            }
          }
        }
        x += bw + 3;
      }
    },
  },
];
 
export function artworkTextures() {
  return artRecipes.map((recipe, index) => {
    const w = 512, h = 384;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    recipe.paint(ctx, w, h);
    grain(ctx, Math.max(w, h), 2500, 0.03);
 
    // Drop a matching file at /public/textures/paintings/art1.jpg to override.
    return smartTexture(`/textures/paintings/art${index + 1}.jpg`,
      () => new THREE.CanvasTexture(c), { repeat: [1, 1] });
  });
}