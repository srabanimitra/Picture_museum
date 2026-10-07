// ---------------------------------------------------------------------------
// CUSTOM SHADER 1 — procedural marble
//
// Written from scratch in GLSL. Nothing here comes from a texture file: the
// veining is generated with value noise + fBm, and the lighting (ambient +
// diffuse + Blinn-Phong specular) is computed by hand from a light position
// that main.js feeds in every frame, so the pedestal reacts to the moving
// spotlight.
// ---------------------------------------------------------------------------

export const marbleVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const marbleFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColorDeep;
  uniform vec3  uColorPale;
  uniform vec3  uVeinColor;
  uniform vec3  uLightPosition;
  uniform vec3  uLightColor;
  uniform float uAmbient;
  uniform float uScale;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  // --- value noise -------------------------------------------------------
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);      // smoothstep interpolation
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // --- fractal Brownian motion: 5 octaves of noise -----------------------
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = vUv * uScale;

    // Warp a sine wave with noise to get marble veins.
    float turbulence = fbm(p * 2.5);
    float vein = sin((p.x * 1.4 + p.y * 0.7 + turbulence * 3.4) * 9.4248);
    vein = pow(abs(vein), 0.32);

    vec3 stone = mix(uColorDeep, uColorPale, vein);
    stone = mix(uVeinColor, stone, smoothstep(0.0, 0.35, vein));
    stone += 0.05 * fbm(p * 14.0);          // fine grain

    // --- lighting, computed by hand ---------------------------------------
    vec3 N = normalize(vNormal);
    vec3 L = uLightPosition - vWorldPosition;
    float distance = length(L);
    L = L / distance;

    float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.012 * distance * distance);
    float diffuse = max(dot(N, L), 0.0);

    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 H = normalize(L + V);
    float specular = pow(max(dot(N, H), 0.0), 56.0);

    vec3 color = stone * (uAmbient + diffuse * attenuation * 3.2) * uLightColor;
    color += specular * attenuation * 0.5 * uLightColor;

    // A very slow shimmer so the surface is never completely static.
    color *= 0.97 + 0.03 * sin(uTime * 0.6 + vUv.y * 3.0);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
