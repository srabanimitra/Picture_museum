// ---------------------------------------------------------------------------
// CUSTOM SHADER 2 — the visible light beam
//
// A hollow cone whose fragments fade out toward the floor, fade at the silhou-
// ette edges (a rim/fresnel term), and carry a faint dust flicker driven by
// uTime. Rendered additively with depth writing off so it reads as light in
// the air rather than as geometry.
// ---------------------------------------------------------------------------

export const beamVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDirection = normalize(-viewPosition.xyz);

    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const beamFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.7, 289.3))) * 24634.6345);
  }

  void main() {
    // On this cone vUv.y is 1 where the beam lands and 0 at the lamp, so the
    // shaft is brightest at the source and thins out as it spreads.
    float towardLamp = 1.0 - vUv.y;
    float alongBeam = 0.30 + 0.70 * smoothstep(0.0, 0.9, towardLamp);

    // Edge-on faces glow, face-on faces stay thin: makes the cone look volumetric.
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));
    rim = pow(rim, 1.6);

    // Slow-drifting dust motes inside the shaft.
    float dust = hash(floor(vUv * vec2(28.0, 90.0)) + floor(uTime * 3.0));
    dust = smoothstep(0.93, 1.0, dust) * 0.35;

    float alpha = (alongBeam * 0.30 + rim * 0.22 + dust) * uIntensity;

    gl_FragColor = vec4(uColor * (0.7 + alongBeam * 0.6), alpha);
    #include <colorspace_fragment>
  }
`;
