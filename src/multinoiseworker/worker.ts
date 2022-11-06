declare var self: ServiceWorkerGlobalScope;
export { };

import { Climate, NormalNoise, DensityFunction, WorldgenRegistries, Identifier, Holder, NoiseRouter, NoiseGeneratorSettings, RandomState, NoiseSettings, NoiseParameters } from "deepslate"

class MultiNoiseCalculator {
  private router: NoiseRouter
  private sampler: Climate.Sampler
  private noiseSettings: NoiseSettings
  private y: number | "surface" = "surface"

  constructor(
  ) {
  }

  private getSurface(x: number, z: number): number {
    function invLerp(a: number, b: number, v: number) {
      return (v - a) / (b - a)
    }

    const cellHeight = NoiseSettings.cellHeight(this.noiseSettings)
    var lastDepth = -1
    for (let y = this.noiseSettings.minY + this.noiseSettings.height; y >= this.noiseSettings.minY; y -= cellHeight) {
      const depth = this.router.depth.compute(DensityFunction.context(x, y, z))
      if (depth >= 0) {
        return y + invLerp(lastDepth, depth, 0) * cellHeight
      }
      lastDepth = depth
    }
    return Number.MAX_SAFE_INTEGER
  }


  public getMultiNoiseValues(min_x: number, min_z: number, max_x: number, max_z: number, tileSize: number): Climate.TargetPoint[][] {
    const array: Climate.TargetPoint[][] = Array(tileSize + 1)
    const step = (max_x - min_x) / tileSize
    for (var ix = 0; ix < tileSize + 1; ix++) {
      array[ix] = Array(tileSize + 1)
      for (var iz = 0; iz < tileSize + 1; iz++) {
        var x = ix * step + min_x
        var z = iz * step + min_z
        var y = (this.y === "surface") ? this.getSurface(x, z) : this.y
        var climate = this.sampler.sample(x, y / 4, z)
        if (this.y === "surface") climate = new Climate.TargetPoint(climate.temperature, climate.humidity, climate.continentalness, climate.erosion, 0.0, climate.weirdness)
        array[ix][iz] = climate
      }
    }
    return array
  }

  public setNoiseGeneratorSettings(json: unknown, seed: bigint) {
    const noiseGeneratorSettings = NoiseGeneratorSettings.fromJson(json)
    this.noiseSettings = noiseGeneratorSettings.noise
    const randomState = new RandomState(noiseGeneratorSettings, seed)
    this.router = randomState.router
    this.sampler = Climate.Sampler.fromRouter(this.router)
  }

  public addDensityFunction(id: Identifier, json: unknown) {
    const df = new DensityFunction.HolderHolder(Holder.parser(WorldgenRegistries.DENSITY_FUNCTION, DensityFunction.fromJson)(json))
    WorldgenRegistries.DENSITY_FUNCTION.register(id, df)
  }

  public addNoise(id: Identifier, json: unknown) {
    const noise = NoiseParameters.fromJson(json)
    WorldgenRegistries.NOISE.register(id, noise)
  }


  public setY(y: number | "surface") {
    this.y = y
  }
}

const multiNoiseCalculator = new MultiNoiseCalculator()

self.onmessage = (evt: ExtendableMessageEvent) => {
  if (evt.data.task === "calculate") {
    const values = multiNoiseCalculator.getMultiNoiseValues(evt.data.min.x, evt.data.min.y, evt.data.max.x, evt.data.max.y, evt.data.tileSize)
    postMessage({ key: evt.data.key, values: values })
  } else if (evt.data.task === "setNoiseGeneratorSettings") {
    multiNoiseCalculator.setNoiseGeneratorSettings(evt.data.json, evt.data.seed)
  } else if (evt.data.task === "addDensityFunction") {
    multiNoiseCalculator.addDensityFunction(Identifier.parse(evt.data.id), evt.data.json)
  } else if (evt.data.task === "addNoise") {
    multiNoiseCalculator.addNoise(Identifier.parse(evt.data.id), evt.data.json)
  } else if (evt.data.task === "setY") {
    multiNoiseCalculator.setY(evt.data.y)
  }
}
