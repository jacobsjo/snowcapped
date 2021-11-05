import { BiomeSource, NoiseParameters, NoiseSampler, NormalNoise, TerrainShaper, LegacyRandom } from "deepslate";
import { template, uniqueId } from "lodash";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseParameters } from "../BuilderData/BiomeBuilder";
import { LayoutElementUnassigned } from "../BuilderData/LayoutElementUnassigned";



export class GridMultiNoise {
	private readonly builder: BiomeBuilder

	private worker : Worker
	private messageHandlers: Map<string, (values: {weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]) => void>

	constructor(
		seed: bigint,
		builder: BiomeBuilder,
	) {
		this.builder = builder

		this.worker = new Worker("multinoiseworker.js")

		this.messageHandlers = new Map<string, (values: {weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]) => void>()

		this.worker.onmessage = (evt) => {
			this.messageHandlers.get(evt.data.key)?.(evt.data.values)
		}
	}

	async getNoiseValueArray(x: number, z: number, size: number, step: number): Promise<MultiNoiseParameters[][]> {
		const key = uniqueId()
		this.worker.postMessage({ task: "calculate", key: key,  coords: { x: x, z: z, size: size, step: step } })

		return new Promise<{weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]>(resolve => {
			this.messageHandlers.set(key, (values:  {weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}[][]) => {
				resolve(values.map(row=>row.map(value => {
					return {
						weirdness: this.builder.fixedNoises["weirdness"] ?? value.weirdness,
						continentalness: this.builder.fixedNoises["continentalness"] ??value.continentalness,
						erosion: this.builder.fixedNoises["erosion"] ??value.erosion,
						humidity: this.builder.fixedNoises["humidity"] ??value.humidity,
						temperature: this.builder.fixedNoises["temperature"] ??value.temperature,
						depth: this.builder.fixedNoises["depth"] ??value.depth
					}
				})))
			})
		})
	}

	updateNoiseSettings(){
		this.worker.postMessage({ task: "updateNoiseSettings", seed: this.builder.seed, params: this.builder.noiseSettings, useLegacyRandom: this.builder.useLegacyRandom})
	}
}