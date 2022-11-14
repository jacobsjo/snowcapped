import { Climate, DensityFunction, Identifier, lerp, NoiseRouter, NoiseSettings, WorldgenRegistries } from "deepslate"

export function lerpClimate(a: Climate.TargetPoint, b: Climate.TargetPoint, c: number) {
	return new Climate.TargetPoint(
		lerp(c, a.temperature, b.temperature),
		lerp(c, a.humidity, b.humidity),
		lerp(c, a.continentalness, b.continentalness),
		lerp(c, a.erosion, b.erosion),
		lerp(c, a.depth, b.depth),
		lerp(c, a.weirdness, b.weirdness)
	)
}

export function lerp2Climate(a: Climate.TargetPoint, b: Climate.TargetPoint, c: Climate.TargetPoint, d: Climate.TargetPoint, e: number, f: number) {
	return lerpClimate(lerpClimate(a, b, e), lerpClimate(c, d, e), f)
}

function getDimensionDensityFunction(noise_settings_id: Identifier, dimension_id?: Identifier): DensityFunction | undefined {
  if (dimension_id === undefined) return undefined
  const dimensionName = dimension_id.path.split("/").reverse()[0]
  const noiseSettingsPath = noise_settings_id.path.split("/")
  noiseSettingsPath[noiseSettingsPath.length - 1] = `${dimensionName}_${noiseSettingsPath[noiseSettingsPath.length - 1]}`
  return WorldgenRegistries.DENSITY_FUNCTION.get(new Identifier(noise_settings_id.namespace, noiseSettingsPath.join("/") + "/snowcapped_surface"))
}

export function getSurfaceDensityFunction(noise_settings_id: Identifier, dimension_id?: Identifier): DensityFunction{
  return WorldgenRegistries.DENSITY_FUNCTION.get(new Identifier(noise_settings_id.namespace, noise_settings_id.path + "/snowcapped_surface"))
    ?? getDimensionDensityFunction(noise_settings_id, dimension_id)
    ?? WorldgenRegistries.DENSITY_FUNCTION.get(new Identifier(noise_settings_id.namespace, "snowcapped_surface"))
    ?? WorldgenRegistries.DENSITY_FUNCTION.get(new Identifier("minecraft", "snowcapped_surface"))
    ?? new DensityFunction.Constant(0)
}
