declare var self: ServiceWorkerGlobalScope;
export { };

import { NoiseParams, NoiseSampler, NormalNoise, TerrainShaper, WorldgenRandom } from "deepslate"

export type NoiseSetting = { firstOctave: number, amplitudes: number[] }

type MultiNoiseParameters = { weirdness: number, continentalness: number, erosion: number, humidity: number, temperature: number, depth: number }

class MultiNoiseCalculator {

  private temperature: NormalNoise
  private humidity: NormalNoise
  private continentalness: NormalNoise
  private erosion: NormalNoise
  private weirdness: NormalNoise
  private shift: NormalNoise

  constructor(
  ) {
  }

  getMultiNoiseValues(x: number, y: number, z: number): MultiNoiseParameters {
    if (!this.temperature)
      return { temperature: 0, humidity: 0, continentalness: 0, erosion: 0, weirdness: 0, depth: 0}

    const xx = x + this.getShift(x, 0, z)
    const yy = y + this.getShift(y, z, x)
    const zz = z + this.getShift(z, x, 0)
    const temperature = this.temperature.sample(xx, yy, zz)
    const humidity = this.humidity.sample(xx, yy, zz)
    const continentalness = this.continentalness.sample(xx, 0, zz)
    const erosion = this.erosion.sample(xx, 0, zz)
    const weirdness = this.weirdness.sample(xx, 0, zz)
    const offset = TerrainShaper.offset(TerrainShaper.point(continentalness, erosion, weirdness))
    const depth = NoiseSampler.computeDimensionDensity(1, -0.51875, y * 4) + offset

    return { temperature: temperature, humidity: humidity, continentalness: continentalness, erosion: erosion, weirdness: weirdness, depth: depth }
  }

  public getShift(x: number, y: number, z: number) {
    return this.shift.sample(x, y, z) * 4
  }

  public setNoises(seed: bigint, params: {
    "continentalness": NoiseSetting,
    "erosion": NoiseSetting,
    "weirdness": NoiseSetting,
    "humidity": NoiseSetting,
    "temperature": NoiseSetting,
    "shift": NoiseSetting
  }) {
    this.temperature = new NormalNoise(new WorldgenRandom(seed), params.temperature.firstOctave, params.temperature.amplitudes)
    this.humidity = new NormalNoise(new WorldgenRandom(seed + BigInt(1)), params.humidity.firstOctave, params.humidity.amplitudes)
    this.continentalness = new NormalNoise(new WorldgenRandom(seed + BigInt(2)), params.continentalness.firstOctave, params.continentalness.amplitudes)
    this.erosion = new NormalNoise(new WorldgenRandom(seed + BigInt(3)), params.erosion.firstOctave, params.erosion.amplitudes)
    this.weirdness = new NormalNoise(new WorldgenRandom(seed + BigInt(4)), params.weirdness.firstOctave, params.weirdness.amplitudes)
    this.shift = new NormalNoise(new WorldgenRandom(seed + BigInt(5)), params.shift.firstOctave, params.shift.amplitudes)
  }
}

const multiNoiseCalculator = new MultiNoiseCalculator()

const noiseDownsample = 2

function lerp(a: number, b: number, l: number) {
  return ((1 - l) * a + l * b)
}

function lerpMultiNoiseValues(a: MultiNoiseParameters, b: MultiNoiseParameters, l: number) {
  return {
    weirdness: lerp(a.weirdness, b.weirdness, l),
    continentalness: lerp(a.continentalness, b.continentalness, l),
    erosion: lerp(a.erosion, b.erosion, l),
    humidity: lerp(a.humidity, b.humidity, l),
    temperature: lerp(a.temperature, b.temperature, l),
    depth: lerp(a.depth, b.depth, l),
  }
}

self.onmessage = (evt: ExtendableMessageEvent) => {
  if (evt.data.task === "calculate") {
    const values = []
    for (let x = 0; x < evt.data.coords.size / noiseDownsample + 1; x++) {
      values[x] = []
      for (let z = 0; z < evt.data.coords.size / noiseDownsample + 1; z++) {
        values[x][z] = multiNoiseCalculator.getMultiNoiseValues(evt.data.coords.x + x * evt.data.coords.step * noiseDownsample, 0, evt.data.coords.z + z * evt.data.coords.step * noiseDownsample)
      }
    }

    const upsampled = []
    for (let x = 0; x < evt.data.coords.size; x++) {
      upsampled[x] = []
      for (let z = 0; z < evt.data.coords.size; z++) {
        const ds_x = Math.floor(x / noiseDownsample)
        const ds_z = Math.floor(z / noiseDownsample)
        const lerp_x = (x % noiseDownsample) / noiseDownsample
        const lerp_z = (z % noiseDownsample) / noiseDownsample
        upsampled[x][z] = lerpMultiNoiseValues(lerpMultiNoiseValues(values[ds_x][ds_z], values[ds_x + 1][ds_z], lerp_x), lerpMultiNoiseValues(values[ds_x][ds_z + 1], values[ds_x + 1][ds_z + 1], lerp_x), lerp_z)
      }
    }

    postMessage({ key: evt.data.key, values: upsampled })
  } else if (evt.data.task === "updateNoiseSettings") {
    multiNoiseCalculator.setNoises(evt.data.seed, evt.data.params)
  }
}
