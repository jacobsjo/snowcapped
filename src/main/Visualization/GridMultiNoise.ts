import { BiomeSource, NoiseParameters, NoiseSampler, NormalNoise, TerrainShaper, LegacyRandom } from "deepslate";
import { template, uniqueId } from "lodash";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseParameters } from "../BuilderData/BiomeBuilder";
import { GridElementUnassigned } from "../BuilderData/GridElementUnassigned";



export class GridMultiNoise {
	private readonly builder: BiomeBuilder

	private worker : Worker
	private messageHandlers: Map<string, (values: MultiNoiseParameters[][]) => void>

	constructor(
		seed: bigint,
		builder: BiomeBuilder,
	) {
		this.builder = builder

		this.worker = new Worker("multinoiseworker.js")

		this.messageHandlers = new Map<string, (values: MultiNoiseParameters[][]) => void>()

		this.worker.onmessage = (evt) => {
			this.messageHandlers.get(evt.data.key)?.(evt.data.values)
		}
	}

	async getNoiseValueArray(x: number, z: number, size: number, step: number): Promise<MultiNoiseParameters[][]> {
		const key = uniqueId()
		this.worker.postMessage({ task: "calculate", key: key,  coords: { x: x, z: z, size: size, step: step } })

		return new Promise<{w: number, c:number, e: number, h: number, t: number, d: number}[][]>(resolve => {
			this.messageHandlers.set(key, (values:  MultiNoiseParameters[][]) => {
				resolve(values.map(row=>row.map(value => {
					return {
						w: this.builder.fixedNoises["weirdness"] ?? value.w,
						c: this.builder.fixedNoises["continentalness"] ??value.c,
						e: this.builder.fixedNoises["erosion"] ??value.e,
						h: this.builder.fixedNoises["humidity"] ??value.h,
						t: this.builder.fixedNoises["temperature"] ??value.t,
						d: this.builder.fixedNoises["depth"] ??value.d
					}
				})))
			})
		})
	}

	updateNoiseSettings(){
		this.worker.postMessage({ task: "updateNoiseSettings", seed: this.builder.seed, params: this.builder.noiseSettings, useLegacyRandom: this.builder.useLegacyRandom})
	}
}