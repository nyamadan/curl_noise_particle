import THREE from 'three.js'

import {SNOISE_3D} from './noise.js'

const VERTEX_SHADER = `
precision highp float;

void main()	{
  gl_Position = vec4( position, 1.0 );
}
`;

const SNOISE_VEC3 = `
vec3 snoiseVec3( vec3 x ){
  float s   = snoise(vec3( x ));
  float s1  = snoise(
                vec3(
                  x.y + ${Math.random().toFixed(10)},
                  x.z + ${Math.random().toFixed(10)},
                  x.x + ${Math.random().toFixed(10)}
                )
              );
  float s2  = snoise(
                vec3(
                  x.z + ${Math.random().toFixed(10)},
                  x.x + ${Math.random().toFixed(10)},
                  x.y + ${Math.random().toFixed(10)}
                )
              );
  return vec3( s , s1 , s2 );
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float clock;
uniform vec2 resolution;
uniform vec3 speed;

uniform vec3 noiseScale;

uniform vec3 fieldScale;
uniform vec3 fieldOffset;

uniform sampler2D txPosition;

${SNOISE_3D}

${SNOISE_VEC3}

vec3 curlNoise( vec3 p ){
  const float e = 0.0009765625;
  const float e2 = 2.0 * e;

  vec3 dx = vec3( e   , 0.0 , 0.0 );
  vec3 dy = vec3( 0.0 , e   , 0.0 );
  vec3 dz = vec3( 0.0 , 0.0 , e   );

  vec3 p_x0 = snoiseVec3( p - dx );
  vec3 p_x1 = snoiseVec3( p + dx );
  vec3 p_y0 = snoiseVec3( p - dy );
  vec3 p_y1 = snoiseVec3( p + dy );
  vec3 p_z0 = snoiseVec3( p - dz );
  vec3 p_z1 = snoiseVec3( p + dz );

  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

  return normalize( vec3( x , y , z ) / e2 );
}

void main()	{
  vec3 p = texture2D( txPosition, gl_FragCoord.xy / resolution.xy).xyz;
  p = p - fieldOffset;

  vec3 noiseCoord = p / fieldScale;
  p = p + speed * curlNoise(noiseCoord * noiseScale);

  p = p + fieldOffset;
  gl_FragColor = vec4(p, 1.0);
}
`;

export class ParticleSimulation {
  constructor(renderer, radix = 512, fieldScale = new THREE.Vector3(10.0, 10.0, 10.0), fieldOffset = new THREE.Vector3(-5.0, -5.0, -5.0)) {
    /**
     * @type {THREE.WebGLRenderer}
     */
    this.renderer = renderer;

    /**
     * @type {number}
     */
    this.radix = radix;

    /**
     * @type {THREE.Vector3}
     */
    this.fieldScale = fieldScale;

    /**
     * @type {THREE.Vector3}
     */
    this.fieldOffset = fieldOffset;

    /**
     * @type {number}
     */
    this.radix2 = this.radix * this.radix;

    /**
     * @type {THREE.Scene}
     */
    this.scene = new THREE.Scene();

    /**
     * @type {THREE.Camera}
     */
    this.camera = new THREE.Camera();

    this.uniforms = {
      clock: {type: "f", value: 0.0},
      speed: {type: "v3", value: new THREE.Vector3(0.001, 0.001, 0.001)},
      noiseScale: {type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0)},
      resolution: {type: "v2", value: new THREE.Vector2(this.radix, this.radix)},
      fieldOffset: {type: "v3", value: this.fieldOffset},
      fieldScale: {type: "v3", value: this.fieldScale},
      txPosition: {type: "t", value: null}
    };

    /**
     * @type {THREE.ShaderMaterial}
     */
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false
    });

    /**
     * @type {THREE.Mesh}
     */
    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.material);

    this.scene.add(this.mesh);

    /**
     * @type {THREE.WebGLRenderTarget}
     */
    this.rtPositionRef = new THREE.WebGLRenderTarget(this.radix, this.radix, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
      depthBuffer: false
    });
    this.rtPositionRef.texture.generateMipmaps = false;

    /**
     * @type {THREE.WebGLRenderTarget}
     */
    this.rtPositionOut = this.rtPositionRef.clone();
  }

  swapRenderTarget() {
    [this.rtPositionRef, this.rtPositionOut] = [this.rtPositionOut, this.rtPositionRef];
  }

  simulate(clock = 0.0) {
    this.uniforms.clock.value = clock;
    this.uniforms.txPosition.value = this.rtPositionRef;
    this.renderer.render(this.scene, this.camera, this.rtPositionOut);
    this.swapRenderTarget();

    return this.rtPositionRef;
  }
}
