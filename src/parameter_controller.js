import THREE from 'three.js'
import dat from '../lib/dat-gui.js'

export class ParameterController {
  constructor(particleRenderer) {
    this.particleRenderer = particleRenderer;

    this._gui = new dat.GUI();

    let fParticle = this._gui.addFolder('Particle');
    this.speed = 0.01;
    fParticle.add(this, 'speed', 0.00, 0.05);

    this.size = 3.0;
    fParticle.add(this, 'size', 1.00, 10.0);

    let fColor = this._gui.addFolder('Color');
    this.rgb = new THREE.Color(0x80, 0x80, 0xff);
    fColor.addColor(this, 'rgb');
    this.alpha = 0.1;
    fColor.add(this, 'alpha', 0.0, 1.0);

    let fNoiseFrequency = this._gui.addFolder('NoiseFrequency');
    this.noiseFrequencyX = 4.0;
    fNoiseFrequency.add(this, 'noiseFrequencyX', 1.00, 10.0);

    this.noiseFrequencyY = 4.0;
    fNoiseFrequency.add(this, 'noiseFrequencyY', 1.00, 10.0);

    this.noiseFrequencyZ = 4.0;
    fNoiseFrequency.add(this, 'noiseFrequencyZ', 1.00, 10.0);

    this._gui.add(this, 'resetParticle');
  }

  resetParticle() {
    this.particleRenderer.resetParticle();
  }

  update() {
    this.particleRenderer.setColor(this.rgb, this.alpha);
    this.particleRenderer.setSpeed(this.speed);
    this.particleRenderer.setParticleSize(this.size);
    this.particleRenderer.setNoiseScale(this.noiseFrequencyX, this.noiseFrequencyY, this.noiseFrequencyZ);
  }
}

