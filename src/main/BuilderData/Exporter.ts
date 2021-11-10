import { Climate } from "deepslate";
import { Biome } from "./Biome";
import { BiomeBuilder } from "./BiomeBuilder";
import { GridElementUnassigned } from "./GridElementUnassigned";



export class Exporter {
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder) {
        this.builder = builder
    }

    private findIdx(value: number, params: Climate.Param[]) {
        if (value < params[0].min) return 0
        if (value > params[params.length - 1].max) return params.length - 1
        return params.findIndex(r => r.min < value && value < r.max)
    }

    public export(): string {
        const array: { biome: string, done: boolean }[][][][][][] = []

        const fixed_d_idx = this.builder.fixedNoises["depth"] ? this.findIdx(this.builder.fixedNoises["depth"], this.builder.weirdnesses) : undefined
        const fixed_w_idx = this.builder.fixedNoises["weirdness"] ? this.findIdx(this.builder.fixedNoises["weirdnesses"], this.builder.weirdnesses) : undefined
        const fixed_c_idx = this.builder.fixedNoises["continentalness"] ? this.findIdx(this.builder.fixedNoises["continentalness"], this.builder.continentalnesses) : undefined
        const fixed_e_idx = this.builder.fixedNoises["erosion"] ? this.findIdx(this.builder.fixedNoises["erosion"], this.builder.erosions) : undefined
        const fixed_t_idx = this.builder.fixedNoises["temperature"] ? this.findIdx(this.builder.fixedNoises["temperature"], this.builder.temperatures) : undefined
        const fixed_h_idx = this.builder.fixedNoises["humidity"] ? this.findIdx(this.builder.fixedNoises["humidity"], this.builder.humidities) : undefined

        for (let d_idx = 0; d_idx < this.builder.depths.length; d_idx++) {
            array[d_idx] = []
            for (let w_idx = 0; w_idx < this.builder.weirdnesses.length; w_idx++) {
                array[d_idx][w_idx] = []
                for (let c_idx = 0; c_idx < this.builder.continentalnesses.length; c_idx++) {
                    array[d_idx][w_idx][c_idx] = []
                    for (let e_idx = 0; e_idx < this.builder.erosions.length; e_idx++) {
                        array[d_idx][w_idx][c_idx][e_idx] = []

                        for (let t_idx = 0; t_idx < this.builder.temperatures.length; t_idx++) {
                            array[d_idx][w_idx][c_idx][e_idx][t_idx] = []
                            for (let h_idx = 0; h_idx < this.builder.humidities.length; h_idx++) {
                                const biome = this.builder.dimension.lookupRecursive({
                                    d_idx: fixed_d_idx ?? d_idx,
                                    w_idx: fixed_w_idx ?? w_idx,
                                    c_idx: fixed_c_idx ?? c_idx,
                                    e_idx: fixed_e_idx ?? e_idx,
                                    h_idx: fixed_h_idx ?? h_idx,
                                    t_idx: fixed_t_idx ?? t_idx
                                }, "Any")
                                if (biome === undefined || biome instanceof GridElementUnassigned) {
                                    array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx] = { biome: "", done: true }
                                } else if (biome instanceof Biome) {
                                    array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx] = { biome: biome.name, done: false }
                                } else {
                                    console.warn("Data structure corruption at w: " + w_idx, + " c: " + c_idx + " e: " + e_idx + " t: " + t_idx + " h: " + h_idx + " - Found element of type " + biome.constructor.name)
                                }
                            }
                        }
                    }
                }
            }
        }

        const biomes: { parameters: { weirdness: [number, number], continentalness: [number, number], erosion: [number, number], temperature: [number, number], humidity: [number, number], depth: [number, number], offset: number }, biome: string }[] = []

        for (let d_idx = 0; d_idx < this.builder.depths.length; d_idx++) {
            for (let w_idx = 0; w_idx < this.builder.weirdnesses.length; w_idx++) {
                for (let c_idx = 0; c_idx < this.builder.continentalnesses.length; c_idx++) {
                    for (let e_idx = 0; e_idx < this.builder.erosions.length; e_idx++) {
                        for (let t_idx = 0; t_idx < this.builder.temperatures.length; t_idx++) {
                            for (let h_idx = 0; h_idx < this.builder.humidities.length; h_idx++) {
                                if (array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx].done)
                                    continue

                                let max_e_idx
                                for (max_e_idx = e_idx; max_e_idx < this.builder.erosions.length; max_e_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, w_idx, d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_e_idx--

                                let max_w_idx
                                for (max_w_idx = w_idx; max_w_idx < this.builder.weirdnesses.length; max_w_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_w_idx--

                                let max_d_idx
                                for (max_d_idx = d_idx; max_d_idx < this.builder.depths.length; max_d_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_d_idx--


                                let max_c_idx
                                for (max_c_idx = c_idx; max_c_idx < this.builder.continentalnesses.length; max_c_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_c_idx--

                                let max_h_idx
                                for (max_h_idx = h_idx; max_h_idx < this.builder.humidities.length; max_h_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, t_idx, max_h_idx))
                                        break
                                }
                                max_h_idx--

                                let max_t_idx
                                for (max_t_idx = t_idx; max_t_idx < this.builder.temperatures.length; max_t_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, max_t_idx, max_h_idx))
                                        break
                                }
                                max_t_idx--

                                this.setDone(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, max_t_idx, max_h_idx)
                                biomes.push({
                                    parameters: {
                                        weirdness: [
                                            this.builder.weirdnesses[w_idx].min,
                                            this.builder.weirdnesses[max_w_idx].max
                                        ],
                                        continentalness: [
                                            this.builder.continentalnesses[c_idx].min,
                                            this.builder.continentalnesses[max_c_idx].max
                                        ],
                                        erosion: [
                                            this.builder.erosions[e_idx].min,
                                            this.builder.erosions[max_e_idx].max
                                        ],
                                        temperature: [
                                            this.builder.temperatures[t_idx].min,
                                            this.builder.temperatures[max_t_idx].max
                                        ],
                                        humidity: [
                                            this.builder.humidities[h_idx].min,
                                            this.builder.humidities[max_h_idx].max
                                        ],
                                        depth: [
                                            this.builder.depths[d_idx].min,
                                            this.builder.depths[max_d_idx].max
                                        ],
                                        offset: 0.0
                                    },
                                    biome: array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx].biome
                                })
                            }
                        }
                    }
                }
            }
        }


        const dimension = {
            type: "minecraft:overworld",
            generator: {
                biome_source: {
                    biomes: biomes,
                    type: "minecraft:multi_noise"
                },
                seed: Number(this.builder.seed),
                settings: "minecraft:overworld",
                type: "minecraft:noise"
            }
        }

        console.log("Emmited " + biomes.length + " Biome settings...")

        return (JSON.stringify(dimension))
    }


    private checkRange(array: { biome: string, done: boolean }[][][][][][], min_w_idx: number, min_d_idx: number, min_c_idx: number, min_e_idx: number, min_t_idx: number, min_h_idx: number, max_w_idx: number, max_d_idx: number, max_c_idx: number, max_e_idx: number, max_t_idx: number, max_h_idx: number): boolean {
        const biome = array[min_d_idx][min_w_idx][min_c_idx][min_e_idx][min_t_idx][min_h_idx].biome
        for (let d_idx = min_d_idx; d_idx <= max_d_idx; d_idx++) {
            for (let w_idx = min_w_idx; w_idx <= max_w_idx; w_idx++) {
                for (let c_idx = min_c_idx; c_idx <= max_c_idx; c_idx++) {
                    for (let e_idx = min_e_idx; e_idx <= max_e_idx; e_idx++) {
                        for (let t_idx = min_t_idx; t_idx <= max_t_idx; t_idx++) {
                            for (let h_idx = min_h_idx; h_idx <= max_h_idx; h_idx++) {
                                const cell_biome = array[d_idx]?.[w_idx]?.[c_idx]?.[e_idx]?.[t_idx]?.[h_idx]?.biome
                                if (cell_biome === undefined) {
                                    console.warn("undefined element at w: " + w_idx + " c: " + c_idx + " e: " + e_idx + " t: " + t_idx + " h: " + h_idx)
                                }
                                if (array[d_idx]?.[w_idx]?.[c_idx]?.[e_idx]?.[t_idx]?.[h_idx]?.biome !== biome)
                                    return false
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    private setDone(array: { biome: string, done: boolean }[][][][][][], min_w_idx: number, min_d_idx: number, min_c_idx: number, min_e_idx: number, min_t_idx: number, min_h_idx: number, max_w_idx: number, max_d_idx: number, max_c_idx: number, max_e_idx: number, max_t_idx: number, max_h_idx: number): void {
        for (let d_idx = min_d_idx; d_idx <= max_d_idx; d_idx++) {
            for (let w_idx = min_w_idx; w_idx <= max_w_idx; w_idx++) {
                for (let c_idx = min_c_idx; c_idx <= max_c_idx; c_idx++) {
                    for (let e_idx = min_e_idx; e_idx <= max_e_idx; e_idx++) {
                        for (let t_idx = min_t_idx; t_idx <= max_t_idx; t_idx++) {
                            for (let h_idx = min_h_idx; h_idx <= max_h_idx; h_idx++) {
                                array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx].done = true
                            }
                        }
                    }
                }
            }
        }
    }

}