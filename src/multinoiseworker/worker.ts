declare var self: ServiceWorkerGlobalScope;
export { };

import { NoiseParams, NoiseSampler, NormalNoise, TerrainShaper, WorldgenRandom } from "deepslate"



const noises = {
  "erosion": {
    "firstOctave": -9,
    "amplitudes": [
      1.0,
      1.0,
      0.0,
      1.0,
      1.0
    ]
  },
  "weirdness": {
    "firstOctave": -7,
    "amplitudes": [
      1.0,
      2.0,
      1.0,
      0.0,
      0.0,
      0.0
    ]
  },
  "shift": {
    "firstOctave": -3,
    "amplitudes": [
      1.0,
      1.0,
      1.0,
      0.0
    ]
  },
  "temperature": {
    "firstOctave": -9,
    "amplitudes": [
      1.5,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0
    ]
  },
  "humidity": {
    "firstOctave": -7,
    "amplitudes": [
      1.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0
    ]
  },
  "continentalness": {
    "firstOctave": -9,
    "amplitudes": [
      1.0,
      1.0,
      2.0,
      2.0,
      2.0,
      1.0,
      1.0,
      1.0,
      1.0
    ]
  }
}

type MultiNoiseParameters = { weirdness: number, continentalness: number, erosion: number, humidity: number, temperature: number, depth: number }

class MultiNoiseCalculator {

  private readonly temperature: NormalNoise
  private readonly humidity: NormalNoise
  private readonly continentalness: NormalNoise
  private readonly erosion: NormalNoise
  private readonly weirdness: NormalNoise
  private readonly shift: NormalNoise

  constructor(
    seed: bigint,
    temperatureParams: NoiseParams,
    humidityParams: NoiseParams,
    continentalnessParams: NoiseParams,
    erosionParams: NoiseParams,
    weirdnessParams: NoiseParams,
    shiftParams: NoiseParams,
  ) {
    this.temperature = new NormalNoise(new WorldgenRandom(seed), temperatureParams.firstOctave, temperatureParams.amplitudes)
    this.humidity = new NormalNoise(new WorldgenRandom(seed + BigInt(1)), humidityParams.firstOctave, humidityParams.amplitudes)
    this.continentalness = new NormalNoise(new WorldgenRandom(seed + BigInt(2)), continentalnessParams.firstOctave, continentalnessParams.amplitudes)
    this.erosion = new NormalNoise(new WorldgenRandom(seed + BigInt(3)), erosionParams.firstOctave, erosionParams.amplitudes)
    this.weirdness = new NormalNoise(new WorldgenRandom(seed + BigInt(4)), weirdnessParams.firstOctave, weirdnessParams.amplitudes)
    this.shift = new NormalNoise(new WorldgenRandom(seed + BigInt(5)), shiftParams.firstOctave, shiftParams.amplitudes)
  }

  getMultiNoiseValues(x: number, y: number, z: number): MultiNoiseParameters  {
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
}

const multiNoiseCalculator = new MultiNoiseCalculator(BigInt('1'), noises.temperature, noises.humidity, noises.continentalness, noises.erosion, noises.weirdness, noises.shift)

const noiseDownsample = 2

function lerp(a: number, b: number, l: number) {
  return ((1 - l) * a + l * b)
}

function lerpMultiNoiseValues(a: MultiNoiseParameters, b: MultiNoiseParameters, l : number ){
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
    for (let x = 0; x < evt.data.coords.size / noiseDownsample + 1 ; x++) {
      values[x] = []
      for (let z = 0; z < evt.data.coords.size / noiseDownsample + 1; z++) {
        values[x][z] = multiNoiseCalculator.getMultiNoiseValues(evt.data.coords.x + x * evt.data.coords.step * noiseDownsample, 64, evt.data.coords.z + z * evt.data.coords.step * noiseDownsample)
      }
    }

    const upsampled = []
    for (let x = 0; x < evt.data.coords.size ; x++) {
      upsampled[x] = []
      for (let z = 0; z < evt.data.coords.size; z++) {
        const ds_x = Math.floor(x/noiseDownsample)
        const ds_z = Math.floor(z/noiseDownsample)
        const lerp_x = (x % noiseDownsample) / noiseDownsample
        const lerp_z = (z % noiseDownsample) / noiseDownsample
        upsampled[x][z] = lerpMultiNoiseValues(lerpMultiNoiseValues(values[ds_x][ds_z] , values[ds_x+1][ds_z], lerp_x), lerpMultiNoiseValues(values[ds_x][ds_z+1], values[ds_x+1][ds_z+1], lerp_x), lerp_z)
      }
    }

    postMessage({ key: evt.data.key, values: upsampled })
  }
}
