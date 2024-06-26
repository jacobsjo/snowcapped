import { VanillaBiomes } from "../Vanilla/VanillaBiomes";
import { Biome } from "./Biome";
import { BiomeBuilder } from "./BiomeBuilder";
import { GridElementUnassigned } from "./GridElementUnassigned";

export class Exporter {
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder) {
        this.builder = builder
    }

    public getBiomeColorJson(){
        const colors_json: {[key: string]: {r: number, g: number, b: number}}  = {}
        for (const biome of this.builder.biomes){
            const vanillaColor = VanillaBiomes.biomes.find(b => b.key === biome.getKey())?.color
            if (vanillaColor === undefined || biome.color !== vanillaColor){
                colors_json[biome.name] = biome.raw_color
            }
        }
        return colors_json
    }


    public getDimensionJSON(): unknown {
        const array: { biome: string, done: boolean }[][][][][][] = []

        for (let d_idx = 0; d_idx < this.builder.gridCells.depth.length - 1; d_idx++) {
            array[d_idx] = []
            for (let w_idx = 0; w_idx < this.builder.gridCells.weirdness.length - 1; w_idx++) {
                array[d_idx][w_idx] = []
                for (let c_idx = 0; c_idx < this.builder.gridCells.continentalness.length - 1; c_idx++) {
                    array[d_idx][w_idx][c_idx] = []
                    for (let e_idx = 0; e_idx < this.builder.gridCells.erosion.length - 1; e_idx++) {
                        array[d_idx][w_idx][c_idx][e_idx] = []

                        for (let t_idx = 0; t_idx < this.builder.gridCells.temperature.length - 1; t_idx++) {
                            array[d_idx][w_idx][c_idx][e_idx][t_idx] = []
                            for (let h_idx = 0; h_idx < this.builder.gridCells.humidity.length - 1; h_idx++) {
                                const biome = this.builder.dimension.lookupRecursive({
                                    depth: d_idx,
                                    weirdness: w_idx,
                                    continentalness: c_idx,
                                    erosion: e_idx,
                                    humidity: h_idx,
                                    temperature: t_idx
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

        for (let d_idx = 0; d_idx < this.builder.gridCells.depth.length - 1; d_idx++) {
            for (let w_idx = 0; w_idx < this.builder.gridCells.weirdness.length - 1; w_idx++) {
                for (let c_idx = 0; c_idx < this.builder.gridCells.continentalness.length - 1; c_idx++) {
                    for (let e_idx = 0; e_idx < this.builder.gridCells.erosion.length - 1; e_idx++) {
                        for (let t_idx = 0; t_idx < this.builder.gridCells.temperature.length - 1; t_idx++) {
                            for (let h_idx = 0; h_idx < this.builder.gridCells.humidity.length - 1; h_idx++) {
                                if (array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx].done)
                                    continue

                                let max_e_idx: number
                                for (max_e_idx = e_idx; max_e_idx < this.builder.gridCells.erosion.length - 1; max_e_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, w_idx, d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_e_idx--

                                let max_w_idx: number
                                for (max_w_idx = w_idx; max_w_idx < this.builder.gridCells.weirdness.length - 1; max_w_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_w_idx--

                                let max_d_idx: number
                                for (max_d_idx = d_idx; max_d_idx < this.builder.gridCells.depth.length - 1; max_d_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_d_idx--


                                let max_c_idx: number
                                for (max_c_idx = c_idx; max_c_idx < this.builder.gridCells.continentalness.length - 1; max_c_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_c_idx--

                                let max_h_idx: number
                                for (max_h_idx = h_idx; max_h_idx < this.builder.gridCells.humidity.length - 1; max_h_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, t_idx, max_h_idx))
                                        break
                                }
                                max_h_idx--

                                let max_t_idx: number
                                for (max_t_idx = t_idx; max_t_idx < this.builder.gridCells.temperature.length - 1; max_t_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, max_t_idx, max_h_idx))
                                        break
                                }
                                max_t_idx--

                                this.setDone(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, max_t_idx, max_h_idx)
                                biomes.push({
                                    parameters: {
                                        weirdness: [
                                            this.builder.gridCells.weirdness[w_idx],
                                            this.builder.gridCells.weirdness[max_w_idx + 1]
                                        ],
                                        continentalness: [
                                            this.builder.gridCells.continentalness[c_idx],
                                            this.builder.gridCells.continentalness[max_c_idx + 1]
                                        ],
                                        erosion: [
                                            this.builder.gridCells.erosion[e_idx],
                                            this.builder.gridCells.erosion[max_e_idx + 1]
                                        ],
                                        temperature: [
                                            this.builder.gridCells.temperature[t_idx],
                                            this.builder.gridCells.temperature[max_t_idx + 1]
                                        ],
                                        humidity: [
                                            this.builder.gridCells.humidity[h_idx],
                                            this.builder.gridCells.humidity[max_h_idx + 1]
                                        ],
                                        depth: [
                                            this.builder.gridCells.depth[d_idx],
                                            this.builder.gridCells.depth[max_d_idx + 1]
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
            type: this.builder.dimensionTypeName,
            generator: {
                biome_source: {
                    biomes: biomes,
                    type: "minecraft:multi_noise"
                },
                settings: this.builder.noiseSettingsName,
                type: "minecraft:noise"
            }
        }

        console.log("Emmited " + biomes.length + " Biome settings...")
        console.log(dimension)

        return dimension
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

    public async getNoiseSettingJSON(old_json?: string){
        if (!this.builder.getVersionInfo().hasTerrainShaper){
            throw new Error("trying to export noise settings in unsupporeted version")
        }

        const json = {
            offset: this.builder.splines.offset.exportLegacy(),
            factor: this.builder.splines.factor.exportLegacy(),
            jaggedness: this.builder.splines.jaggedness.exportLegacy()
        }
        const jsonString = JSON.stringify(json)

        if (old_json === undefined || old_json === ""){
            return fetch(`export_presets/${this.builder.targetVersion}/noise_settings.json`).then(s => s.text()).then(s => s.replace("%s", jsonString))
        } else {
            const parsed_old = JSON.parse(old_json)
            const terrain_shaper_id = old_json.indexOf(`"terrain_shaper":`)
            const start_id = old_json.indexOf("{", terrain_shaper_id)
            const next_comma = old_json.indexOf(",", terrain_shaper_id)
            if (next_comma < start_id){
                throw new Error("terrain shaper not of correct format in file")
            }
            const end_id = this.findClosingBracket(old_json, start_id)
            const new_json = old_json.substring(0, start_id) + jsonString + old_json.substring(end_id + 1)

            parsed_old.noise.terrain_shaper = json
            if (JSON.stringify(JSON.parse(new_json)) !== JSON.stringify(parsed_old)){
                throw new Error("inserting terrain shaper failed")
            }
            return new_json
        }
    }


    private findClosingBracket(s: string, start_id: number): number{
        const opening = ['{', '[']
        const closing = ['}', ']']
        const open_brackets = []
        var i = start_id
        while (true){
            if (i >= s.length){
                throw new Error("Unclosed Brackets")
            }
            const char = s[i]
            const open_bracket_id = opening.indexOf(char)
            if (open_bracket_id >= 0){
                open_brackets.push(open_bracket_id)
            } else {
                const closing_bracket_id = closing.indexOf(char)
                if (closing_bracket_id >= 0){
                    if (open_brackets.pop() !== closing_bracket_id){
                        throw new Error("Mismatched Brackets")
                    }
                }
            }
            if (open_brackets.length === 0){
                return i
            }
            i++
        }
    }    
}