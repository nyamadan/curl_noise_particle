import 'babel-polyfill'

import THREE from 'three.js'
import '../lib/OrbitControls.js'

import Stats from 'stats.js'

import {ParticleRenderer} from './particle_renderer.js'
import {ParameterController} from './parameter_controller.js'

let stats = new Stats();
stats.domElement.setAttribute('style', 'position: absolute; left: 0; top: 0; z-index: 9999;');
document.body.appendChild(stats.domElement);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector('#container').appendChild(renderer.domElement);

let gl = renderer.getContext();
if (!gl.getExtension("OES_texture_float")) {
  throw new Error("No OES_texture_float support for float textures!");
}

let particleRenderer = new ParticleRenderer(renderer);

let $particles = document.querySelector('#particles');
$particles.textContent = particleRenderer.radix2.toString(10);

window.addEventListener('resize', function() {
  particleRenderer.adjustCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let parameter = new ParameterController(particleRenderer);

function render(clock) {
  stats.begin();
  parameter.update();
  particleRenderer.render(clock);
  stats.end();
  
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
