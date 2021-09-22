import { BiomeSource, NoiseParams, NoiseSampler, NormalNoise, TerrainShaper, WorldgenRandom } from "deepslate";
import { uniqueId } from "lodash";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseParameters } from "../BuilderData/BiomeBuilder";
import { LayoutElementUnassigned } from "../BuilderData/LayoutElementUnassigned";



export class GridMultiNoise {
	private readonly temperature: NormalNoise
	private readonly humidity: NormalNoise
	private readonly continentalness: NormalNoise
	private readonly erosion: NormalNoise
	private readonly weirdness: NormalNoise
	private readonly offset: NormalNoise

	private readonly builder: BiomeBuilder

	private worker : Worker
	private messageHandlers: Map<string, (values: {weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]) => void>

	constructor(
		seed: bigint,
		builder: BiomeBuilder,
		temperatureParams: NoiseParams,
		humidityParams: NoiseParams,
		continentalnessParams: NoiseParams,
		erosionParams: NoiseParams,
		weirdnessParams: NoiseParams,
		offsetParams: NoiseParams,
	) {
		this.builder = builder
		this.temperature = new NormalNoise(new WorldgenRandom(seed), temperatureParams.firstOctave, temperatureParams.amplitudes)
		this.humidity = new NormalNoise(new WorldgenRandom(seed + BigInt(1)), humidityParams.firstOctave, humidityParams.amplitudes)
		this.continentalness = new NormalNoise(new WorldgenRandom(seed + BigInt(2)), continentalnessParams.firstOctave, continentalnessParams.amplitudes)
		this.erosion = new NormalNoise(new WorldgenRandom(seed + BigInt(3)), erosionParams.firstOctave, erosionParams.amplitudes)
		this.weirdness = new NormalNoise(new WorldgenRandom(seed + BigInt(4)), weirdnessParams.firstOctave, weirdnessParams.amplitudes)
		this.offset = new NormalNoise(new WorldgenRandom(seed + BigInt(5)), offsetParams.firstOctave, offsetParams.amplitudes)

		this.worker = new Worker("multinoiseworker.js")

		this.messageHandlers = new Map<string, (values: {weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]) => void>()

		this.worker.onmessage = (evt) => {
			this.messageHandlers.get(evt.data.key)?.(evt.data.values)
		}
	}

	async getNoiseValues(x: number, z: number, size: number, step: number): Promise<MultiNoiseParameters[][]> {
		const key = uniqueId()
		this.worker.postMessage({ task: "calculate", key: key,  coords: { x: x, z: z, size: size, step: step } })

		return new Promise<{weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]>(resolve => {
			this.messageHandlers.set(key, (values:  {weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]) => {
				resolve(values)
			})
		})
	}

	public getTerrainShape(x: number, z: number) {
		const xx = x + this.getOffset(x, 0, z)
		const zz = z + this.getOffset(z, x, 0)
		const continentalness = this.continentalness.sample(xx, 0, zz)
		const erosion = this.erosion.sample(xx, 0, zz)
		const weirdness = this.weirdness.sample(xx, 0, zz)
		const point = TerrainShaper.point(continentalness, erosion, weirdness)
		const nearWater = TerrainShaper.nearWater(continentalness, weirdness)
		return TerrainShaper.shape(point, nearWater)
	}

	public getOffset(x: number, y: number, z: number) {
		return this.offset.sample(x, y, z) * 4
	}
}