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
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
 
  // Smoothly interpolated value noise. The smoothstep on the fractional part
  // is what stops the dust showing up as hard rectangular blocks.
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
 
  void main() {
    // On this cone vUv.y is 1 where the beam lands and 0 at the lamp, so the
    // shaft is brightest at the source and thins out as it spreads.
    float towardLamp = 1.0 - vUv.y;
    float alongBeam = 0.28 + 0.72 * smoothstep(0.0, 0.9, towardLamp);
 
    // Edge-on faces glow, face-on faces stay thin: makes the cone volumetric.
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));
    rim = pow(rim, 1.7);
 
    // Two layers of soft noise drifting down the shaft at different speeds.
    float dust =
        noise(vec2(vUv.x * 9.0, vUv.y * 5.0 - uTime * 0.07)) * 0.6
      + noise(vec2(vUv.x * 17.0 + 4.0, vUv.y * 9.0 - uTime * 0.11)) * 0.4;
    dust = smoothstep(0.55, 0.95, dust) * 0.10;
 
    float alpha = (alongBeam * 0.26 + rim * 0.20 + dust) * uIntensity;
 
    gl_FragColor = vec4(uColor * (0.7 + alongBeam * 0.6), alpha);
    #include <colorspace_fragment>
  }
`;
 