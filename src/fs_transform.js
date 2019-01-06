import THREE from 'three'

const VERTEX_SHADER = `
precision highp float;

void main()	{
  gl_Position = vec4( position, 1.0 );
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 resolution;
uniform sampler2D txPosition;
uniform mat4 transform;

void main()	{
  vec3 p = texture2D( txPosition, gl_FragCoord.xy / resolution.xy).xyz;
  gl_FragColor = transform * vec4(p, 1.0);
}
`;

export class FsTransform {
  constructor(renderer) {
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    this.uniforms = {
      resolution: {type: "v2", value: null},
      txPosition: {type: "t", value: null},
      transform: {type: "m4", value: null}
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.material);
    this.scene.add(this.mesh);
  }

  /**
   * @param {THREE.WebGLRenderTarget} texture
   * @param {THREE.Matrix4} transform
   * @param {THREE.WebGLRenderTarget} output
   */
  render(texture, transform, output) {
    this.uniforms.txPosition.value = texture;
    this.uniforms.transform.value = transform;
    this.mesh.material.uniforms.resolution.value = new THREE.Vector2(output.width, output.height);
    this.renderer.render(this.scene, this.camera, output);
    return output;
  }
}

