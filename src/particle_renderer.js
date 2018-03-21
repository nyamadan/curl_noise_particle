import THREE from 'three.js'

import {BitonicSort} from './bitonic_sort_webgl.js'
import {FsTransform} from './fs_transform.js'

import {ParticleSimulation} from './particle_simulation.js'

import {PassThru} from './pass_thru.js'

const VERTEX_SHADER_PARTICLE = `
precision highp float;

uniform sampler2D txPosition;
uniform float particleSize;

varying vec3 vPosition;

void main() {
  gl_PointSize = particleSize;
  gl_Position = texture2D( txPosition, uv );
}
`;

const FRAGMENT_SHADER_PARTICLE = `
uniform sampler2D txParticle;
uniform vec4 color;

void main() {
  vec4 texColor = texture2D(txParticle, gl_PointCoord);
  gl_FragColor = texColor * color;
}
`;

export class ParticleRenderer {
  /**
   * @param {THREE.WebGLRenderer} renderer
   */
  constructor(renderer) {
    this.radix = 1 << 9;
    this.radix2 = this.radix * this.radix;
    
    this.scale = new THREE.Vector3(10.0, 10.0, 10.0);
    this.offset = new THREE.Vector3(-5.0, -5.0, -5.0);

    this.renderer = renderer;
    this.loader = new THREE.TextureLoader();

    this.scene = new THREE.Scene();
    this.scene.autoUpdate = false;
    
    this.projScreenMatrix = new THREE.Matrix4();
    this.transformMatrix = new THREE.Matrix4();
    
    this.camera = new THREE.PerspectiveCamera();
    this.camera.position.set(5.0, 10.0, 15.0);
    this.adjustCamera();

    this.controls = new THREE.OrbitControls(this.camera,this.renderer.domElement);

    this.geometry = this._createParticleGeometry();

    this.material = new THREE.ShaderMaterial( {
      uniforms: {
        color: { type: 'v4', value: new THREE.Vector4(0.5, 0.5, 1.0, 0.1) },
        txPosition: { type: 't', value: null },
        txParticle: { type: 't', value: this.loader.load('./particle.png') },
        particleSize: {type: 'f', value: 3}
      },
      vertexShader: VERTEX_SHADER_PARTICLE,
      fragmentShader: FRAGMENT_SHADER_PARTICLE,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });

    this.uniforms = this.material.uniforms;

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    let boxGeometry = this._createBoxGeometry();
    let boxMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00
    });
    let cubeMesh = new THREE.LineSegments( boxGeometry, boxMaterial );
    this.scene.add( cubeMesh );

    this.fsTransform = new FsTransform(this.renderer);

    this.bitonicSort = new BitonicSort(this.renderer, this.radix);

    this.particleSimulation = new ParticleSimulation(this.renderer, this.radix, this.scale, this.offset);

    this.passThru = new PassThru(this.renderer);
    this.dtParticle = this._createRandomPositionDataTexture();

    this.resetParticle();
  }

  /**
   * @return {THREE.Geometry}
   * @private
   */
  _createBoxGeometry(){
    let geometry = new THREE.Geometry();

    geometry.vertices.push(
      new THREE.Vector3(this.offset.x, this.offset.y, this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.offset.y, this.offset.z),

      new THREE.Vector3(this.offset.x, this.offset.y, this.scale.z + this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.offset.y, this.scale.z + this.offset.z),

      new THREE.Vector3(this.offset.x, this.offset.y, this.offset.z),
      new THREE.Vector3(this.offset.x, this.offset.y, this.scale.z + this.offset.z),

      new THREE.Vector3(this.scale.x + this.offset.x, this.offset.y, this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.offset.y, this.scale.z + this.offset.z),

      new THREE.Vector3(this.offset.x, this.scale.y + this.offset.y, this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.scale.y + this.offset.y, this.offset.z),

      new THREE.Vector3(this.offset.x, this.scale.y + this.offset.y, this.scale.z + this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.scale.y + this.offset.y, this.scale.z + this.offset.z),

      new THREE.Vector3(this.offset.x, this.scale.y + this.offset.y, this.offset.z),
      new THREE.Vector3(this.offset.x, this.scale.y + this.offset.y, this.scale.z + this.offset.z),

      new THREE.Vector3(this.scale.x + this.offset.x, this.scale.y + this.offset.y, this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.scale.y + this.offset.y, this.scale.z + this.offset.z),

      new THREE.Vector3(this.offset.x, this.offset.y, this.offset.z),
      new THREE.Vector3(this.offset.x, this.scale.y + this.offset.y, this.offset.z),

      new THREE.Vector3(this.scale.x + this.offset.x, this.offset.y, this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.scale.y + this.offset.y, this.offset.z),

      new THREE.Vector3(this.offset.x, this.offset.y, this.scale.z + this.offset.z),
      new THREE.Vector3(this.offset.x, this.scale.y + this.offset.y, this.scale.z + this.offset.z),

      new THREE.Vector3(this.scale.x + this.offset.x, this.offset.y, this.scale.z + this.offset.z),
      new THREE.Vector3(this.scale.x + this.offset.x, this.scale.y + this.offset.y, this.scale.z + this.offset.z)
    );

    return geometry;
  }

  adjustCamera() {
    this.camera.fov = 60.0;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.near = 0.5;
    this.camera.far = 1000.0;
    this.camera.updateProjectionMatrix();
  }

  setSpeed(speed) {
    this.particleSimulation.uniforms.speed.value.set(speed, speed, speed);
  }

  setColor(rgb, alpha) {
    this.uniforms.color.value.set(rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, alpha);
  }

  setParticleSize(size) {
    this.uniforms.particleSize.value = size;
  }

  setNoiseScale(x, y, z) {
    this.particleSimulation.uniforms.noiseScale.value.set(x, y, z);
  }

  resetParticle() {
    this.passThru.render(this.dtParticle, this.particleSimulation.rtPositionRef);
  }

  /**
   * @return {THREE.DataTexture}
   * @private
   */
  _createRandomPositionDataTexture() {
    let texture = new THREE.DataTexture(
      this._createRandomValue(),
      this.radix,
      this.radix,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * @return {Float32Array}
   * @private
   */
  _createRandomValue() {
    let length = this.radix2;

    let buffer = new Float32Array(length * 4);
    
    for(let i = 0; i < length; i++) {
      let i4 = 4 * i;
      buffer[i4    ] = Math.random() * this.scale.x + this.offset.x;
      buffer[i4 + 1] = Math.random() * this.scale.y + this.offset.y;
      buffer[i4 + 2] = Math.random() * this.scale.z + this.offset.z;
      buffer[i4 + 3] = 1.0;
    }
    
    return buffer;
  }
  
  _createParticleGeometry() {
    let geometry = new THREE.BufferGeometry();
    let length = this.radix2;
    
    let vertices = new THREE.BufferAttribute( new Float32Array( length * 3 ), 3 );
    let uv = new THREE.BufferAttribute( new Float32Array( length * 2 ), 2 );
    geometry.addAttribute( 'position', vertices );
    geometry.addAttribute( 'uv', uv );
    
    let half_pixel_width = 0.5 / this.radix;
    
    for( let i = 0; i < length; i++ ) {
      var x = (i % this.radix) / this.radix;
      var y = ~~(i / this.radix) / this.radix;
      
      vertices.array[ i * 3     ] = 0.0;
      vertices.array[ i * 3 + 1 ] = 0.0;
      vertices.array[ i * 3 + 2 ] = 0.0;
      
      uv.array[ i * 2     ] = x + half_pixel_width;
      uv.array[ i * 2 + 1 ] = y + half_pixel_width;
    }
    
    return geometry;
  }

  /**
   * @param {number} clock
   */
  render(clock) {
    this.particleSimulation.simulate(clock);

    this.scene.updateMatrixWorld();
    this.camera.updateMatrixWorld();
    this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);

    this.projScreenMatrix.multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
    this.transformMatrix.multiplyMatrices( this.projScreenMatrix, this.points.matrixWorld );

    this.fsTransform.render(this.particleSimulation.rtPositionRef, this.transformMatrix, this.bitonicSort.rtDataRef);
    //this.bitonicSort.exec();
    this.uniforms.txPosition.value = this.bitonicSort.rtDataRef;

    this.renderer.render(this.scene, this.camera);
  }
}
